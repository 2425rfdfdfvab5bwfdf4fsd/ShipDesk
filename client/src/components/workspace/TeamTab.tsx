import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UserPlus, Trash2, Loader2, Crown, Clock, Users, Lock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
  expiresAt: string;
}

interface TeamData {
  owner: TeamMember | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  seatLimit: number;
}

interface BillingStatus {
  plan: "FREE" | "STARTER" | "SOLO" | "AGENCY";
  lsSubscriptionId: string | null;
  trialEndsAt: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isAgencyPlan(billing: BillingStatus | undefined): boolean {
  if (!billing) return false;
  if (billing.lsSubscriptionId) return billing.plan === "AGENCY";
  return false;
}

export function TeamTab() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: team, isLoading } = useQuery<TeamData>({
    queryKey: ["workspace-team"],
    queryFn: () => api.get("/api/workspace/team").then((r) => r.data),
  });

  const { data: billing } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => api.get("/api/billing/status").then((r) => r.data),
    staleTime: 60_000,
  });

  const canUseTeam = isAgencyPlan(billing);
  const totalSeats = 1 + (team?.members.length ?? 0);
  const pendingCount = team?.invitations.length ?? 0;
  const seatLimit = team?.seatLimit ?? 5;
  const seatsUsed = totalSeats + pendingCount;
  const atLimit = seatsUsed >= seatLimit;

  const inviteMutation = useMutation({
    mutationFn: (emailAddr: string) =>
      api.post("/api/workspace/team/invite", { email: emailAddr }).then((r) => r.data),
    onSuccess: () => {
      toast({ title: "Invite sent", description: `An invitation email has been sent to ${email}.` });
      setEmail("");
      qc.invalidateQueries({ queryKey: ["workspace-team"] });
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      const messages: Record<string, string> = {
        PLAN_REQUIRED: "Team seats require the Agency plan.",
        ALREADY_MEMBER: "This person is already a member.",
        SEAT_LIMIT_REACHED: `Workspace is at the ${seatLimit}-seat limit.`,
        CANNOT_INVITE_SELF: "You cannot invite yourself.",
      };
      toast({
        title: "Could not send invite",
        description: messages[code] ?? "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/api/workspace/team/members/${memberId}`).then((r) => r.data),
    onSuccess: () => {
      toast({ title: "Member removed" });
      qc.invalidateQueries({ queryKey: ["workspace-team"] });
    },
    onError: () => toast({ title: "Failed to remove member", variant: "destructive" }),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/api/workspace/team/invitations/${invitationId}`).then((r) => r.data),
    onSuccess: () => {
      toast({ title: "Invite cancelled" });
      qc.invalidateQueries({ queryKey: ["workspace-team"] });
    },
    onError: () => toast({ title: "Failed to cancel invite", variant: "destructive" }),
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate(email.trim());
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allMembers: Array<TeamMember & { isOwner?: boolean }> = [
    ...(team?.owner ? [{ ...team.owner, isOwner: true }] : []),
    ...(team?.members ?? []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-0.5">Team Seats</h2>
        <p className="text-xs text-muted-foreground">
          Invite developers to collaborate in your workspace. Available on the Agency plan.
        </p>
      </div>

      {!canUseTeam && (
        <div className="rounded-xl border bg-amber-500/5 border-amber-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Agency plan required</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to Agency to invite up to {seatLimit} team members to your workspace.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            onClick={() => navigate("/billing")}
            data-testid="button-upgrade-team"
          >
            Upgrade to Agency
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      )}

      {canUseTeam && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Users className="h-3.5 w-3.5" />
          <span>
            <span className="font-medium text-foreground">{seatsUsed}</span> of{" "}
            <span className="font-medium text-foreground">{seatLimit}</span> seats used
          </span>
          {atLimit && (
            <Badge variant="warning" className="ml-1 text-xs">At limit</Badge>
          )}
        </div>
      )}

      <div className="bg-card border rounded-xl divide-y divide-border">
        {allMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3"
            data-testid={`row-member-${member.id}`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={member.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {member.isOwner ? (
                <Badge variant="info" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              ) : (
                <Badge variant="secondary">Member</Badge>
              )}
              {!member.isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMemberMutation.mutate(member.id)}
                  disabled={removeMemberMutation.isPending}
                  data-testid={`button-remove-member-${member.id}`}
                  title="Remove member"
                >
                  {removeMemberMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}

        {allMembers.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No members yet.
          </div>
        )}
      </div>

      {(team?.invitations ?? []).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Pending Invites
          </p>
          <div className="bg-card border rounded-xl divide-y divide-border">
            {(team?.invitations ?? []).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3"
                data-testid={`row-invitation-${inv.id}`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited {formatDistanceToNow(new Date(inv.invitedAt), { addSuffix: true })} ·
                    expires {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="warning">Pending</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => cancelInviteMutation.mutate(inv.id)}
                    disabled={cancelInviteMutation.isPending}
                    data-testid={`button-cancel-invite-${inv.id}`}
                    title="Cancel invite"
                  >
                    {cancelInviteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Invite a team member
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canUseTeam || atLimit}
            className={cn("flex-1", (!canUseTeam || atLimit) && "opacity-50 cursor-not-allowed")}
            data-testid="input-invite-email"
          />
          <Button
            type="submit"
            disabled={!canUseTeam || atLimit || !email.trim() || inviteMutation.isPending}
            data-testid="button-send-invite"
          >
            {inviteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1.5" />
                Invite
              </>
            )}
          </Button>
        </form>
        {atLimit && canUseTeam && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            Workspace is at the {seatLimit}-seat limit. Remove a member to invite someone new.
          </p>
        )}
        {!canUseTeam && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Upgrade to the Agency plan to send invitations.
          </p>
        )}
      </div>
    </div>
  );
}
