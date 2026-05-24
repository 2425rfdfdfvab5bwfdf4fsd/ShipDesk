import { useState } from "react";
import { Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { ArrowLeft, Mail, MessageSquare, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactUsPage() {
  useSEO({
    title: "Contact Us | ShipDesk",
    description: "Get in touch with the ShipDesk team for support, questions, or feedback.",
  });

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:support@shipdesk.io?subject=${encodeURIComponent(form.subject || "ShipDesk enquiry")}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  const contactOptions = [
    {
      icon: Mail,
      title: "Email support",
      description: "For billing, account, or technical issues",
      action: "support@shipdesk.io",
      href: "mailto:support@shipdesk.io",
      color: "from-indigo-500/20 to-violet-500/20",
      iconColor: "text-indigo-400",
    },
    {
      icon: MessageSquare,
      title: "General enquiries",
      description: "Partnership, press, or anything else",
      action: "hello@shipdesk.io",
      href: "mailto:hello@shipdesk.io",
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      icon: Github,
      title: "Bug reports",
      description: "Found a bug? Open an issue on GitHub",
      action: "github.com/shipdesk",
      href: "https://github.com",
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
        <p className="text-white/50 mb-10 leading-relaxed">
          Have a question, feedback, or need help? We'd love to hear from you. We typically respond within one business day.
        </p>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {contactOptions.map((opt) => (
            <a
              key={opt.title}
              href={opt.href}
              target={opt.href.startsWith("http") ? "_blank" : undefined}
              rel={opt.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`group relative rounded-xl border border-white/10 bg-gradient-to-br ${opt.color} p-5 hover:border-white/20 transition-all duration-200`}
            >
              <div className={`mb-3 ${opt.iconColor}`}>
                <opt.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-sm text-white mb-1">{opt.title}</p>
              <p className="text-xs text-white/40 mb-3 leading-relaxed">{opt.description}</p>
              <p className="text-xs font-mono text-white/60 group-hover:text-white/80 transition-colors">{opt.action}</p>
            </a>
          ))}
        </div>

        {/* Contact form */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-6">Send us a message</h2>

          {submitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-4">
                <Mail className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="font-medium text-white mb-1">Message opened in your email client</p>
              <p className="text-sm text-white/40">If nothing opened, email us directly at{" "}
                <a href="mailto:support@shipdesk.io" className="text-indigo-400 hover:text-indigo-300 transition-colors">support@shipdesk.io</a>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setSubmitted(false)}
              >
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Name</label>
                  <input
                    data-testid="input-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
                  <input
                    data-testid="input-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Subject</label>
                <input
                  data-testid="input-subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Message</label>
                <textarea
                  data-testid="input-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your question or issue in as much detail as possible..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-white/30">We'll get back to you within 1 business day.</p>
                <Button
                  data-testid="button-submit-contact"
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                >
                  Send message
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© 2026 ShipDesk. Built for freelance developers.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
