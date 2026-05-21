import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
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
    <QueryClientProvider client={queryClient}>
      <App clerkEnabled={clerkEnabled} />
      <Toaster />
    </QueryClientProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

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
