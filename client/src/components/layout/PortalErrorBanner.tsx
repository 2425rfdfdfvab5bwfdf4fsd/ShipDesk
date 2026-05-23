import { WifiOff } from "lucide-react";

export function PortalErrorBanner() {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
      <WifiOff className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-destructive">Unable to reach the server</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your portal is loading but the backend is not responding. Please try refreshing in a moment.
        </p>
      </div>
    </div>
  );
}
