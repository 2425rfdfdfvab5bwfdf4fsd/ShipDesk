import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Github, FileText, DollarSign, MessageSquare, Shield,
  ArrowRight, CheckCircle, Clock, Users, BarChart3,
  Mail, Star, TrendingUp, Layers, Menu, X, Sparkles,
  GitPullRequest, Bell, ChevronRight, Lock, Globe
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
    name: "Solo",
    price: "$29",
    period: "/month",
    description: "Perfect for freelancers managing a handful of clients.",
    features: [
      "Up to 10 active projects",
      "Unlimited AI reports",
      "Branded client portal",
      "Invoice + payment links",
      "Scope change flow",
      "File sharing",
      "Async messaging",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/month",
    description: "For growing agencies with more projects and clients.",
    features: [
      "Unlimited projects",
      "Unlimited AI reports",
      "Custom domain portal",
      "Everything in Solo",
      "Priority support",
      "Team seats (coming soon)",
      "Linear & Vercel integration",
    ],
    cta: "Start free trial",
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
        <div className="flex-1 mx-4">
          <div className="bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs text-white/40 font-mono w-52">
            acme.portal.shipdesk.io
          </div>
        </div>
        <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
          <Bell className="w-3 h-3 text-indigo-400" />
        </div>
      </div>
      <div className="flex min-h-[280px]">
        <div className="w-48 border-r border-white/10 bg-[#0f1117] p-3 hidden sm:block flex-shrink-0">
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
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Active Projects", value: "4", color: "text-white" },
              { label: "Unpaid Invoices", value: "2", color: "text-amber-400" },
              { label: "Pending Scope", value: "1", color: "text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2">
                <p className="text-white/40 text-[10px] mb-1">{stat.label}</p>
                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
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
              <div key={p.name} className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.dot} flex-shrink-0`} />
                  <div>
                    <div className="text-white/80 text-xs font-medium">{p.name}</div>
                    <div className="text-white/30 text-[10px] font-mono">{p.repo}</div>
                  </div>
                </div>
                <span className="text-[10px] text-white/40 font-medium">{p.badge}</span>
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

  return (
    <div className="min-h-screen bg-[#06080f] text-white overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06080f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ShipDesk</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="gap-1.5 bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/25">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <button
            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-[#06080f] px-4 py-4 space-y-1"
            >
              {["#features", "#how-it-works", "#pricing", "#testimonials"].map((href) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 capitalize"
                >
                  {href.replace("#", "").replace("-", " ")}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-white/70 hover:text-white hover:bg-white/10">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-indigo-500 hover:bg-indigo-400">
                    Get started free
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-32 left-1/4 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px]" />
          <div className="absolute top-16 right-1/4 w-[250px] h-[250px] bg-blue-600/15 rounded-full blur-[80px]" />
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
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full px-3.5 py-1.5 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Google Gemini AI + GitHub
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Stop writing
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                status emails.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto mb-8">
              ShipDesk connects to GitHub, generates polished weekly reports with AI, and gives
              every client a branded portal for files, invoices, and messaging.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="gap-2 w-full sm:w-auto px-7 h-12 bg-indigo-500 hover:bg-indigo-400 text-base shadow-xl shadow-indigo-500/25"
                >
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
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
            <div className="absolute -inset-8 bg-indigo-600/10 rounded-3xl blur-2xl" />
            <div className="relative">
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/5 text-white/50 border border-white/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <DollarSign className="h-3.5 w-3.5" />
              Simple pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Pay once. Save hours every week.
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              14-day free trial, no credit card required. Cancel any time.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 ${
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
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button
                    className={`w-full h-11 ${
                      plan.highlight
                        ? "bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/25"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-6">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto sm:max-w-none sm:inline-flex sm:gap-3 mb-8">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 px-8 h-12 bg-indigo-500 hover:bg-indigo-400 text-base shadow-xl shadow-indigo-500/25"
                >
                  Start free trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 border-white/20 bg-white/5 text-white hover:bg-white/10"
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
                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
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
                <p className="font-semibold mb-4 text-white/80">Integrations</p>
                <div className="space-y-2.5 text-white/40">
                  <span className="block">Google Gemini AI</span>
                  <span className="block">GitHub API</span>
                  <span className="block">Clerk Auth</span>
                  <span className="block">Lemon Squeezy</span>
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
