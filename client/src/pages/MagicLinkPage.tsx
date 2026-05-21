import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

const ERROR_MESSAGES: Record<string, string> = {
  LINK_EXPIRED: "This link has expired. Contact your project manager to request a new invitation.",
  LINK_SUPERSEDED: "This link is no longer valid. Check your email for a more recent invitation.",
  ACCESS_REVOKED: "Your access to this project has been removed. Contact your project manager.",
};

export function MagicLinkPage() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setError("No token provided.");
      return;
    }

    api.post("/api/portal/auth/magic", { token })
      .then((res) => {
        const { projectIds } = res.data as { clientId: string; projectIds: string[] };
        if (projectIds.length === 1) {
          navigate(`/projects/${projectIds[0]}`);
        } else {
          navigate("/");
        }
      })
      .catch((err) => {
        const code = err.response?.data?.error as string | undefined;
        setError(ERROR_MESSAGES[code || ""] || "Something went wrong. Please try again.");
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Failed</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
