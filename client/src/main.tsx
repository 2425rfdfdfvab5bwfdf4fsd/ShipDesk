import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { queryClient } from "./lib/queryClient";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const isClientPortal = (() => {
  const host = window.location.hostname;
  const parts = host.split(".");
  return parts.length >= 3 && parts[1] === "portal";
})();

const clerkEnabled = !isClientPortal && !!PUBLISHABLE_KEY;

function Root({ clerkEnabled }: { clerkEnabled: boolean }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App clerkEnabled={clerkEnabled} />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Persist the root across Vite HMR re-executions so createRoot is only ever
// called once. Without this, a failed Fast Refresh causes main.tsx to re-run,
// which calls createRoot on the same container again → mounts a second React
// tree → second ClerkProvider → Clerk throws → all auth hooks break → every
// API call fires without a token → mutations fail with 401.
declare global {
  interface Window {
    __reactRoot?: ReactDOM.Root;
  }
}

const container = document.getElementById("root")!;
if (!window.__reactRoot) {
  window.__reactRoot = ReactDOM.createRoot(container);
}
const root = window.__reactRoot;

if (clerkEnabled) {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY!} afterSignOutUrl="/">
        <Root clerkEnabled={true} />
      </ClerkProvider>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <Root clerkEnabled={false} />
    </React.StrictMode>
  );
}
