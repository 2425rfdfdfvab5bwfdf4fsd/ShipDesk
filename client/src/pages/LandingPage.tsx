import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { useSEO } from "@/lib/seo";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Github, FileText, DollarSign, MessageSquare, Shield,
  ArrowRight, CheckCircle, Clock, Users, BarChart3,
  Mail, Star, TrendingUp, Layers, Menu, X, Sparkles,
  GitPullRequest, Bell, ChevronRight, Lock, Globe,
  LayoutDashboard, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Github,
    title: "GitHub-powered reports",
    description: "Connect your repos. ShipDesk reads your commits, PRs, and releases and turns them into plain-English updates clients actually understand.",
    accent: "from-violet-500/20 to-indigo-500/20",
  },
  {
    icon: FileText,
    title: "Branded client portal",
    description: "Every client gets a white-label portal at your subdomain with your logo and brand color. Looks like your own product.",
    accent: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: DollarSign,
    title: "Invoicing & payments",
    description: "Create milestone invoices and collect payment through an embedded checkout. Clients pay directly from the portal.",
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: MessageSquare,
    title: "Async messaging",
    description: "Keep all client communication in a per-project thread. No more scattered email chains and Slack DMs.",
    accent: "from-orange-500/20 to-amber-500/20",
  },
  {
    icon: Shield,
    title: "Magic link access",
    description: "Clients sign in with a single email link — no passwords, no friction. Secure 30-day sessions.",
    accent: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: TrendingUp,
    title: "Scope change flow",
    description: "Clients submit change requests through a structured form. You quote, they approve, and a payment link is generated automatically.",
    accent: "from-purple-500/20 to-violet-500/20",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect your GitHub",
    description: "Link your repositories with OAuth in seconds. ShipDesk automatically syncs commits, pull requests, and releases.",
    icon: Github,
    color: "bg-violet-500",
  },
  {
    step: "02",
    title: "AI writes the update",
    description: "Every Friday at 9AM, Google Gemini transforms raw GitHub activity into a polished, plain-English status report.",
    icon: Zap,
    color: "bg-indigo-500",
  },
  {
    step: "03",
    title: "Client reads it in their portal",
    description: "Your client receives a branded email, clicks one link, and sees their report — no password required.",
    icon: Users,
    color: "bg-blue-500",
  },
];

const TESTIMONIALS = [
  {
    quote: "I used to spend Sunday evenings writing status emails. Now I just check that the report looks good and hit publish. Saves me 3+ hours every week.",
    name: "Marcus T.",
    title: "Freelance Full-Stack Developer",
    initials: "MT",
    color: "from-violet-500 to-indigo-500",
  },
  {
    quote: "My clients love the portal. One told me I 'seemed more professional than agencies he'd worked with.' That was worth the subscription alone.",
    name: "Priya K.",
    title: "Independent Web Developer",
    initials: "PK",
    color: "from-blue-500 to-cyan-500",
  },
  {
    quote: "The scope change flow has been a game-changer. Clients submit a request, I send a quote, they approve and pay. Zero informal scope creep.",
    name: "Daniel R.",
    title: "Dev Agency Owner",
    initials: "DR",
    color: "from-emerald-500 to-teal-500",
  },
];

const STATS = [
  { value: "7.4h", label: "saved per week" },
  { value: "$12k+", label: "scope creep captured" },
  { value: "60%", label: "fewer status emails" },
  { value: "2 min", label: "portal setup time" },
];

const PRICING = [
  {
    name: "Starter",
    price: "$10",
    period: "/month",
    description: "Get your first client portal live in minutes.",
    features: [
      { label: "3 client projects" },
      { label: "10 AI status reports/month" },
      { label: "Magic link client portal" },
      { label: "GitHub webhook integration" },
      { label: "Invoice + payment links" },
      { label: "File uploads & sharing" },
      { label: "Async client messaging" },
    ],
    highlight: false,
  },
  {
    name: "Solo",
    price: "$29",
    period: "/month",
    description: "Everything a freelancer needs to look like a studio.",
    features: [
      { label: "Up to 10 client projects" },
      { label: "Unlimited AI reports" },
      { label: "GitHub webhook integration" },
      { label: "Branded portal + client invites" },
      { label: "Invoice + payment collection" },
      { label: "Scope change requests & quoting" },
      { label: "File sharing & async messaging" },
    ],
    highlight: false,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/month",
    description: "Scale your client operations without the overhead.",
    features: [
      { label: "Unlimited projects" },
      { label: "Unlimited AI reports" },
      { label: "Custom domain client portal" },
      { label: "GitHub integration + DNS verification" },
      { label: "Everything in Solo" },
      { label: "Priority support" },
      { label: "Team seats", soon: true },
      { label: "Linear & Vercel sync", soon: true },
    ],
    highlight: true,
  },
];

function MockDashboard() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f1117]">
      <div className="bg-[#1a1d27] border-b border-white/10 px-4 py-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="flex-1 mx-2 sm:mx-4 min-w-0">
          <div className="bg-white/5 border border-white/10 rounded-md px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-white/40 font-mono truncate max-w-[120px] sm:max-w-[200px]">
            shipdesk-nine.vercel.app/portal/acme
          </div>
        </div>
        <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
          <Bell className="w-3 h-3 text-indigo-400" />
        </div>
      </div>
      <div className="flex min-h-[240px] sm:min-h-[280px]">
        <div className="w-40 sm:w-48 border-r border-white/10 bg-[#0f1117] p-3 hidden sm:block flex-shrink-0">
          <div className="flex items-center gap-2 mb-5 px-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-none">Acme Studio</p>
              <p className="text-white/30 text-[10px] mt-0.5">Developer</p>
            </div>
          </div>
          {[
            { label: "Dashboard", active: true },
            { label: "Invoices", active: false },
            { label: "Scope Changes", active: false },
            { label: "Settings", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-2.5 py-1.5 rounded-lg text-xs mb-0.5 font-medium ${
                item.active
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 bg-[#0f1117] space-y-3">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[
              { label: "Active Projects", value: "4", color: "text-white" },
              { label: "Unpaid Invoices", value: "2", color: "text-amber-400" },
              { label: "Pending Scope", value: "1", color: "text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-1.5 sm:p-2">
                <p className="text-white/40 text-[9px] sm:text-[10px] mb-1 leading-tight">{stat.label}</p>
                <p className={`text-sm sm:text-base font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">Active Projects</p>
          <div className="space-y-1.5">
            {[
              { name: "Acme Corp Website", repo: "acme/website", badge: "Active", dot: "bg-emerald-500" },
              { name: "Mobile App v2", repo: "acme/mobile", badge: "Active", dot: "bg-emerald-500" },
              { name: "Admin Dashboard", repo: "acme/admin", badge: "Paused", dot: "bg-amber-500" },
            ].map((p) => (
              <div key={p.name} className="bg-white/5 border border-white/10 rounded-lg p-2 sm:p-2.5 flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.dot} flex-shrink-0`} />
                  <div className="min-w-0">
                    <div className="text-white/80 text-xs font-medium truncate">{p.name}</div>
                    <div className="text-white/30 text-[10px] font-mono truncate">{p.repo}</div>
                  </div>
                </div>
                <span className="text-[10px] text-white/40 font-medium flex-shrink-0">{p.badge}</span>
              </div>
            ))}
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5 flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse mt-1 flex-shrink-0" />
            <div>
              <p className="text-indigo-300 text-[11px] font-medium">New report generated</p>
              <p className="text-white/40 text-[10px] mt-0.5">Acme Corp Website · Week of May 19, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useSEO({
    title: "ShipDesk — AI Client Portal for Freelance Developers",
    description:
      "ShipDesk connects to GitHub and uses AI to write your weekly client status reports. Give every client a branded portal with files, invoices, and messaging. Free trial, no card required.",
    canonical: "https://shipdesk-nine.vercel.app/",
    noindex: false,
  });

  return (
    <div className="min-h-screen bg-[#06080f] text-white [overflow-x:clip]">
      {/* Nav */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-[#06080f]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_1px_40px_rgba(0,0,0,0.5)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <img src="/favicon.svg" alt="" className="w-5 h-5" />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white">ShipDesk</span>
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Pricing", href: "#pricing" },
              { label: "Reviews", href: "#testimonials" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="relative px-3.5 py-1.5 text-sm font-medium text-white/55 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/[0.06] group"
              >
                {label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-4 bg-indigo-400/70 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="gap-2 bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/20 h-9 px-4 text-sm font-semibold"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.06]">
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/25 h-9 px-4 text-sm font-semibold"
                  >
                    Try free for 14 days
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            data-testid="button-mobile-menu"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileMenuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-[#0c0e1a] border-l border-white/[0.08] flex flex-col shadow-2xl"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-5 h-[68px] border-b border-white/[0.07] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <img src="/favicon.svg" alt="" className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-[17px] tracking-tight text-white">ShipDesk</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {[
                  { label: "Features", href: "#features" },
                  { label: "How it works", href: "#how-it-works" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Reviews", href: "#testimonials" },
                ].map(({ label, href }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 px-3 rounded-xl text-[15px] font-medium text-white/65 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {label}
                    <ChevronRight className="h-4 w-4 text-white/25" />
                  </a>
                ))}
              </nav>

              {/* Bottom CTA */}
              <div className="px-4 pb-8 pt-4 border-t border-white/[0.07] space-y-2.5">
                {isSignedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full h-12 gap-2 bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20">
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-12 gap-2 bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25">
                        Try free for 14 days
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium text-white/55 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]">
                        <LogIn className="h-4 w-4" />
                        Sign in to your account
                      </button>
                    </Link>
                  </>
                )}
                <p className="text-center text-xs text-white/25 pt-1">
                  14-day free trial · No credit card required
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 pb-14 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[400px] sm:h-[500px] bg-indigo-600/20 rounded-full blur-[100px] sm:blur-[120px]" />
          <div className="absolute top-24 left-0 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-violet-600/15 rounded-full blur-[60px] sm:blur-[80px]" />
          <div className="absolute top-12 right-0 w-[180px] sm:w-[250px] h-[180px] sm:h-[250px] bg-blue-600/15 rounded-full blur-[60px] sm:blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium mb-5 sm:mb-6 max-w-[calc(100vw-2rem)] flex-wrap justify-center">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              Powered by Google Gemini AI + GitHub
            </div>
            <h1 className="text-[2.4rem] leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight sm:leading-[1.05] mb-5 sm:mb-6">
              Stop writing
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                status emails.
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed max-w-xl sm:max-w-2xl mx-auto mb-7 sm:mb-8 px-2 sm:px-0">
              ShipDesk connects to GitHub, generates polished weekly reports with AI, and gives
              every client a branded portal for files, invoices, and messaging.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center px-2 sm:px-0">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="gap-2 w-full sm:w-auto px-7 h-12 bg-indigo-500 hover:bg-indigo-400 text-base shadow-xl shadow-indigo-500/25"
                >
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 hover:text-white"
                >
                  Sign in to your workspace
                </Button>
              </Link>
            </div>
            <p className="text-xs text-white/35 mt-4">
              No credit card required · Set up in under 2 minutes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/20 to-white/5 blur-sm" />
            <div className="absolute -inset-4 sm:-inset-8 bg-indigo-600/10 rounded-3xl blur-2xl" />
            <div className="relative hidden md:block">
              <MockDashboard />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/10">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="text-center px-4"
              >
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-white/45">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 text-white/50 border border-white/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <Layers className="h-3.5 w-3.5" />
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Set up once. Run automatically.
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Connect GitHub, invite your clients, and ShipDesk handles the rest — every week, forever.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-[2.6rem] left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-px bg-gradient-to-r from-white/20 via-white/10 to-white/20" />
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="relative text-center group"
                >
                  <div className="relative inline-flex mb-6">
                    <div className={`w-20 h-20 rounded-2xl ${step.color} bg-opacity-20 border border-white/15 shadow-lg flex items-center justify-center`}
                      style={{ background: `rgba(99,102,241,${0.1 + i * 0.03})` }}
                    >
                      <Icon className="h-8 w-8 text-white/80" />
                    </div>
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-indigo-500/40">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-white">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 text-white/50 border border-white/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <BarChart3 className="h-3.5 w-3.5" />
              Everything you need
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              One tool. Every client touchpoint.
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Replace your email client, Google Drive, PayPal, and Notion with one professional portal.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.accent} border border-white/10 flex items-center justify-center mb-4`}>
                    <Icon className="h-5 w-5 text-white/80" />
                  </div>
                  <h3 className="font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 text-white/50 border border-white/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <DollarSign className="h-3.5 w-3.5" />
              Simple pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Every feature. Fully working. Right now.
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              14-day free trial, no credit card required. Cancel any time.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.highlight
                    ? "bg-indigo-500/10 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10"
                    : "bg-white/[0.03] border border-white/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-white/50 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-white/50 text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-center gap-2.5 text-sm">
                      {feature.soon ? (
                        <span className="h-4 w-4 flex-shrink-0 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        </span>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className={feature.soon ? "text-white/30" : "text-white/70"}>
                        {feature.label}
                      </span>
                      {feature.soon && (
                        <span className="ml-auto text-[10px] font-medium text-white/25 border border-white/10 rounded px-1 py-0.5 leading-none flex-shrink-0">
                          soon
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button
                    data-testid={`button-pricing-${plan.name.toLowerCase()}`}
                    className={`w-full h-11 ${
                      plan.highlight
                        ? "bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/25"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                    }`}
                  >
                    {plan.name === "Starter" ? "Try free for 14 days" : "Get started"}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/15 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 text-white/50 border border-white/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <Star className="h-3.5 w-3.5" />
              Developer reviews
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Loved by freelancers
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Developers billing $3K–$15K/month use ShipDesk to look bigger than they are.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to stop writing
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                status emails forever?
              </span>
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Join hundreds of freelance developers who've automated their client communication with ShipDesk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 px-8 h-12 bg-indigo-500 hover:bg-indigo-400 text-base shadow-xl shadow-indigo-500/25"
                >
                  Try free for 14 days <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Sign in
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-white/35">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Cancel any time</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <img src="/favicon.svg" alt="ShipDesk" className="w-7 h-7" />
                <span className="font-bold text-white">ShipDesk</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                AI-native client portal for freelance developers and small dev agencies. Automate your client communication stack.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold mb-4 text-white/80">Product</p>
                <div className="space-y-2.5 text-white/40">
                  <a href="#features" className="block hover:text-white/70 transition-colors">Features</a>
                  <a href="#how-it-works" className="block hover:text-white/70 transition-colors">How it works</a>
                  <a href="#pricing" className="block hover:text-white/70 transition-colors">Pricing</a>
                  <a href="#testimonials" className="block hover:text-white/70 transition-colors">Reviews</a>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-4 text-white/80">Account</p>
                <div className="space-y-2.5 text-white/40">
                  <Link href="/sign-up" className="block hover:text-white/70 transition-colors">Sign up free</Link>
                  <Link href="/sign-in" className="block hover:text-white/70 transition-colors">Sign in</Link>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-4 text-white/80">Legal</p>
                <div className="space-y-2.5 text-white/40">
                  <a href="/privacy" className="block hover:text-white/70 transition-colors">Privacy Policy</a>
                  <a href="/terms" className="block hover:text-white/70 transition-colors">Terms of Service</a>
                  <a href="/cookies" className="block hover:text-white/70 transition-colors">Cookie Policy</a>
                  <Link href="/contact" className="block hover:text-white/70 transition-colors">Contact Us</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>© 2026 ShipDesk. Built for freelance developers.</p>
            <p>Made with ♥ by developers, for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
