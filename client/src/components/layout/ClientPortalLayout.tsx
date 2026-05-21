import { useState } from "react";
import { Link, useLocation } from "wouter";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { LogOut, ChevronLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClientPortalLayoutProps {
  children: React.ReactNode;
  workspaceSlug: string;
}

export function ClientPortalLayout({ children, workspaceSlug }: ClientPortalLayoutProps) {
  const { data: branding } = usePortalBranding(workspaceSlug);
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = useMutation({
    mutationFn: () => api.post("/api/portal/auth/logout").then((r) => r.data),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const primaryColor = branding?.primaryColor || "#6366F1";
  const isRoot = location === "/" || location === "";

  return (
    <div
      className="min-h-screen bg-background"
      style={{ "--color-primary": primaryColor } as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm h-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {!isRoot && (
              <button
                onClick={() => window.history.back()}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Agency logo"
                className="h-7 w-auto object-contain flex-shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white font-bold text-xs">
                  {(branding?.agencyName || "S")[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-semibold text-sm truncate">
              {branding?.agencyName || "Client Portal"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-muted-foreground hover:text-foreground gap-1.5 hidden sm:flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-t bg-card px-4 py-3"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { logout.mutate(); setMobileMenuOpen(false); }}
                disabled={logout.isPending}
                className="w-full justify-start text-muted-foreground gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
