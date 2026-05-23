import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { LogOut, ChevronLeft, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClientPortalLayoutProps {
  children: React.ReactNode;
  workspaceSlug: string;
}

function hexToHslVars(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  html.classList.toggle("dark", !isDark);
  localStorage.setItem("shipdesk-theme", isDark ? "light" : "dark");
}

export function ClientPortalLayout({ children, workspaceSlug }: ClientPortalLayoutProps) {
  const { data: branding } = usePortalBranding(workspaceSlug);
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const logout = useMutation({
    mutationFn: () => api.post("/api/portal/auth/logout").then((r) => r.data),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const primaryColor = branding?.primaryColor || "#6366F1";
  const isRoot = location === "/" || location === "";

  useEffect(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      const hslVars = hexToHslVars(primaryColor);
      document.documentElement.style.setProperty("--primary", hslVars);
      document.documentElement.style.setProperty("--ring", hslVars);
    }
    return () => {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
    };
  }, [primaryColor]);

  function handleToggleTheme() {
    toggleTheme();
    setIsDark((d) => !d);
  }

  return (
    <div className="min-h-screen bg-background portal-font">
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
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm bg-primary"
              >
                <span className="text-primary-foreground font-bold text-xs">
                  {(branding?.agencyName || "S")[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-semibold text-sm truncate">
              {branding?.agencyName || "Client Portal"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
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
              className="sm:hidden border-t bg-card px-4 py-3 space-y-1"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleTheme}
                className="w-full justify-start text-muted-foreground gap-2"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light mode" : "Dark mode"}
              </Button>
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
