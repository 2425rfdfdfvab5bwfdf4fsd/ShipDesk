import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/lib/seo";

export function NotFoundPage() {
  useSEO({
    title: "Page Not Found",
    description: "The page you were looking for doesn't exist. Head back to ShipDesk to manage your client portals.",
    noindex: true,
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-muted-foreground/30 mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline">Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
