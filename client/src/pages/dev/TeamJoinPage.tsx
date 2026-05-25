import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { useJoinTeam } from "@/hooks/useWorkspace";

function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export function TeamJoinPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, navigate] = useLocation();
  const [joined, setJoined] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const token = getTokenFromUrl();

  const joinMutation = useJoinTeam();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!token) {
      setErrorMsg("No invite token found in this link.");
      return;
    }
    if (isSignedIn && !hasAttempted.current) {
      hasAttempted.current = true;
      joinMutation.mutate(token, {
        onSuccess: () => {
          setJoined(true);
          setTimeout(() => navigate("/dashboard"), 2500);
        },
        onError: (err: unknown) => {
          const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
          const messages: Record<string, string> = {
            LINK_USED: "This invite link has already been used or revoked.",
            LINK_EXPIRED: "This invite link has expired. Ask your workspace owner to send a new invite.",
            EMAIL_MISMATCH: "This invite was sent to a different email address. Please sign in with the invited email.",
            INVALID_TOKEN: "This invite link is invalid or has expired.",
          };
          setErrorMsg(messages[code ?? ""] ?? "Something went wrong. Please try again.");
        },
      });
    }
  }, [isLoaded, isSignedIn, token]);

  if (!isLoaded || joinMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Accepting invitation…</p>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">You're in!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              You've joined the workspace. Redirecting to your dashboard…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Invite error</h1>
            <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-5 max-w-sm px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">You've been invited</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in or create an account to accept this team invitation.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            data-testid="button-signin-to-accept"
            onClick={() => navigate(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)}
          >
            Sign in to accept
          </Button>
          <Button
            variant="outline"
            data-testid="button-signup-to-accept"
            onClick={() => navigate(`/sign-up?redirect_url=${encodeURIComponent(window.location.href)}`)}
          >
            Create an account
          </Button>
        </div>
      </div>
    </div>
  );
}
