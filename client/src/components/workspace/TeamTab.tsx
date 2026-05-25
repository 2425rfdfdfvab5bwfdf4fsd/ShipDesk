import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  UserPlus, Trash2, Loader2, Crown, Clock, Users, Lock, ArrowRight,
  Link2, RefreshCw, LogOut, Pencil, Check, X, Activity,
  UserCheck, UserMinus, UserX, Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePlan } from "@/hooks/usePlan";
import {
  useTeam,
  useInviteTeamMember,
  useRemoveTeamMember,
  useCancelTeamInvite,
  useGetInviteLink,
  useLeaveWorkspace,
  useUpdateMemberTitle,
  useTeamActivity,
} from "@/hooks/useWorkspace";
import type { TeamMember, TeamActivityItem, TeamActivityEvent } from "@/types";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function SeatBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Seats used
        </span>
        <span className="font-medium tabular-nums">
          <span className={cn(pct >= 100 && "text-destructive", pct >= 80 && pct < 100 && "text-amber-500")}>
            {used}
          </span>
          <span className="text-muted-foreground"> / {limit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 100 && (
        <p className="text-xs text-destructive">
          Seat limit reached. Remove a member to invite someone new.
        </p>
      )}
    </div>
  );
}

function activityLabel(item: TeamActivityItem): { icon: React.ReactNode; text: string } {
  const target = item.targetName ?? item.targetEmail ?? "someone";
  const map: Record<TeamActivityEvent, { icon: React.ReactNode; text: string }> = {
    INVITE_SENT: { icon: <Send className="h-3 w-3 text-blue-500" />, text: `Invite sent to ${item.targetEmail}` },
    INVITE_RESENT: { icon: <RefreshCw className="h-3 w-3 text-blue-400" />, text: `Invite resent to ${item.targetEmail}` },
    INVITE_CANCELLED: { icon: <UserX className="h-3 w-3 text-muted-foreground" />, text: `Invite cancelled for ${item.targetEmail}` },
    MEMBER_JOINED: { icon: <UserCheck className="h-3 w-3 text-green-500" />, text: `${target} joined the workspace` },
    MEMBER_REMOVED: { icon: <UserMinus className="h-3 w-3 text-destructive" />, text: `${target} was removed` },
    MEMBER_LEFT: { icon: <LogOut className="h-3 w-3 text-amber-500" />, text: `${target} left the workspace` },
  };
  return map[item.event] ?? { icon: <Activity className="h-3 w-3" />, text: item.event };
}

function EditableTitle({
  memberId,
  currentTitle,
}: {
  memberId: string;
  currentTitle: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentTitle ?? "");
  const updateTitle = useUpdateMemberTitle();
  const { toast } = useToast();

  function save() {
    updateTitle.mutate(
      { memberId, title: draft.trim() || null },
      {
        onSuccess: () => { setEditing(false); toast({ title: "Title updated" }); },
        onError: () => toast({ title: "Failed to update title", variant: "destructive" }),
      }
    );
  }

  if (editing) {
    return (
      <form
        className="flex items-center gap-1 mt-0.5"
        onSubmit={(e) => { e.preventDefault(); save(); }}
      >
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Frontend Developer"
          className="h-5 text-xs px-1.5 py-0 w-40"
          maxLength={60}
          data-testid="input-member-title"
        />
        <button type="submit" disabled={updateTitle.isPending} className="text-green-600 hover:text-green-700">
          {updateTitle.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => { setDraft(currentTitle ?? ""); setEditing(false); }} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 group mt-0.5"
      data-testid={`button-edit-title-${memberId}`}
      title="Edit title"
    >
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {currentTitle || <span className="italic opacity-50">Add title…</span>}
      </span>
      <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function TeamTab() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const { data: team, isLoading } = useTeam();
  const { data: activities } = useTeamActivity();
  const { capabilities } = usePlan();
  const canUseTeam = capabilities?.canUseTeamSeats ?? false;

  const inviteMutation = useInviteTeamMember();
  const removeMemberMutation = useRemoveTeamMember();
  const cancelInviteMutation = useCancelTeamInvite();
  const getInviteLink = useGetInviteLink();
  const leaveWorkspace = useLeaveWorkspace();

  const isOwner = team?.currentUserRole === "OWNER";
  const isMember = team?.currentUserRole === "MEMBER";

  const totalMembers = 1 + (team?.members.length ?? 0);
  const pendingCount = team?.invitations.length ?? 0;
  const seatLimit = team?.seatLimit ?? 5;
  const seatsUsed = totalMembers + pendingCount;
  const atLimit = seatsUsed >= seatLimit;

  const inviteErrors: Record<string, string> = {
    PLAN_REQUIRED: "Team seats require the Agency plan.",
    ALREADY_MEMBER: "This person is already a member.",
    SEAT_LIMIT_REACHED: `Workspace is at the ${seatLimit}-seat limit.`,
    CANNOT_INVITE_SELF: "You cannot invite yourself.",
  };

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate(email.trim(), {
      onSuccess: () => {
        toast({ title: "Invite sent", description: `Invitation emailed to ${email}.` });
        setEmail("");
      },
      onError: (err: unknown) => {
        const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Could not send invite", description: inviteErrors[code ?? ""] ?? "Something went wrong.", variant: "destructive" });
      },
    });
  }

  function handleCopyLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setCopyingId("form");
    getInviteLink.mutate(email.trim(), {
      onSuccess: ({ joinUrl }) => {
        navigator.clipboard.writeText(joinUrl).then(() => {
          toast({ title: "Link copied!", description: "Share this link with your team member directly." });
          setEmail("");
        });
        setCopyingId(null);
      },
      onError: (err: unknown) => {
        setCopyingId(null);
        const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Could not generate link", description: inviteErrors[code ?? ""] ?? "Something went wrong.", variant: "destructive" });
      },
    });
  }

  function handleResend(inviteEmail: string, inviteId: string) {
    setResendingId(inviteId);
    inviteMutation.mutate(inviteEmail, {
      onSuccess: () => {
        setResendingId(null);
        toast({ title: "Invite resent", description: `A new link has been sent to ${inviteEmail}.` });
      },
      onError: () => {
        setResendingId(null);
        toast({ title: "Failed to resend invite", variant: "destructive" });
      },
    });
  }

  function handleRemoveMember(memberId: string) {
    removeMemberMutation.mutate(memberId, {
      onSuccess: () => toast({ title: "Member removed" }),
      onError: () => toast({ title: "Failed to remove member", variant: "destructive" }),
    });
  }

  function handleCancelInvite(invitationId: string) {
    cancelInviteMutation.mutate(invitationId, {
      onSuccess: () => toast({ title: "Invite cancelled" }),
      onError: () => toast({ title: "Failed to cancel invite", variant: "destructive" }),
    });
  }

  function handleLeave() {
    leaveWorkspace.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "You've left the workspace" });
        navigate("/dashboard");
      },
      onError: () => toast({ title: "Failed to leave workspace", variant: "destructive" }),
    });
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
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold mb-0.5">Team Seats</h2>
        <p className="text-xs text-muted-foreground">
          Invite developers, designers, and collaborators to your workspace. Agency plan only.
        </p>
      </div>

      {/* Upgrade gate */}
      {!canUseTeam && (
        <div className="rounded-xl border bg-amber-500/5 border-amber-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Agency plan required</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to Agency to invite up to {seatLimit} team members to collaborate in your workspace.
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

      {/* Seat progress bar */}
      {canUseTeam && (
        <div className="bg-muted/40 rounded-lg px-4 py-3">
          <SeatBar used={seatsUsed} limit={seatLimit} />
        </div>
      )}

      {/* Member list */}
      <div className="bg-card border rounded-xl divide-y divide-border">
        {allMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3"
            data-testid={`row-member-${member.id}`}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={member.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{member.name}</p>
                {member.id === team?.currentMemberId && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              {/* Editable title — only for non-owner members */}
              {!member.isOwner && (
                member.id === team?.currentMemberId || isOwner
                  ? <EditableTitle memberId={member.id} currentTitle={member.title} />
                  : member.title && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{member.title}</p>
                  )
              )}
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
              {!member.isOwner && isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveMember(member.id)}
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
            No members yet. Send an invite below.
          </div>
        )}
      </div>

      {/* Pending invites */}
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
                    Invited {formatDistanceToNow(new Date(inv.invitedAt), { addSuffix: true })} ·{" "}
                    expires {formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="warning">Pending</Badge>
                  {isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleResend(inv.email, inv.id)}
                        disabled={resendingId === inv.id}
                        data-testid={`button-resend-invite-${inv.id}`}
                        title="Resend invite"
                      >
                        {resendingId === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleCancelInvite(inv.id)}
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form — owner only */}
      {isOwner && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Invite a team member
          </p>
          <div className="flex gap-2">
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
              onClick={handleInvite}
              disabled={!canUseTeam || atLimit || !email.trim() || inviteMutation.isPending}
              data-testid="button-send-invite"
              title="Send invite email"
            >
              {inviteMutation.isPending && resendingId === null && copyingId === null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Invite
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              disabled={!canUseTeam || atLimit || !email.trim() || getInviteLink.isPending}
              data-testid="button-copy-link"
              title="Copy invite link to share manually"
            >
              {getInviteLink.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1.5" />
                  Copy link
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Invite</strong> sends an email via your connected email service.{" "}
            <strong>Copy link</strong> generates a shareable link you can paste in Slack, WhatsApp, or anywhere.
          </p>
        </div>
      )}

      {/* Activity log */}
      {(activities?.length ?? 0) > 0 && (
        <div>
          <button
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors mb-2 group"
            onClick={() => setShowActivity((v) => !v)}
            data-testid="button-toggle-activity"
          >
            <Activity className="h-3.5 w-3.5" />
            Team Activity
            <span className="text-muted-foreground/50 group-hover:text-muted-foreground ml-0.5">
              {showActivity ? "▲" : "▼"}
            </span>
          </button>
          {showActivity && (
            <div className="bg-card border rounded-xl divide-y divide-border">
              {(activities ?? []).map((item) => {
                const { icon, text } = activityLabel(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-2.5"
                    data-testid={`row-activity-${item.id}`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Leave workspace — for members only */}
      {isMember && (
        <div className="border border-destructive/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3 bg-destructive/5">
          <div>
            <p className="text-sm font-medium text-destructive">Leave workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You'll lose access to all projects and data in this workspace.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeave}
            disabled={leaveWorkspace.isPending}
            data-testid="button-leave-workspace"
          >
            {leaveWorkspace.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Leave
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
