import { Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
  useSEO({
    title: "Privacy Policy | ShipDesk",
    description: "Learn how ShipDesk collects, uses, and protects your personal information.",
  });

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 24, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              ShipDesk ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website and services (collectively, the "Service"). Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information in the following ways:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white/90">Account information:</strong> Name, email address, and profile data when you register via Clerk authentication.</li>
              <li><strong className="text-white/90">GitHub data:</strong> Repository names, commit messages, pull request titles, and release notes when you connect your GitHub account to generate reports.</li>
              <li><strong className="text-white/90">Project data:</strong> Project details, invoices, messages, files, and scope change requests you create within the platform.</li>
              <li><strong className="text-white/90">Client data:</strong> Your clients' email addresses and names when you invite them to your portal.</li>
              <li><strong className="text-white/90">Usage data:</strong> Log data, IP addresses, browser type, pages visited, and timestamps to improve the Service.</li>
              <li><strong className="text-white/90">Payment data:</strong> Payment processing is handled by Lemon Squeezy. We do not store your full payment card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, and maintain the Service</li>
              <li>Generate AI-powered status reports using Google Gemini</li>
              <li>Send transactional emails (magic links, report notifications) via Resend</li>
              <li>Process payments via Lemon Squeezy</li>
              <li>Store and serve files via Cloudinary</li>
              <li>Improve and personalise your experience</li>
              <li>Communicate with you about updates, security, and support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white/90">Service providers:</strong> Third-party vendors (Clerk, Google Gemini, Resend, Cloudinary, Lemon Squeezy, Neon) that help us operate the Service, bound by data processing agreements.</li>
              <li><strong className="text-white/90">Your clients:</strong> Information you choose to share in your workspace portal is visible to the clients you invite.</li>
              <li><strong className="text-white/90">Legal requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong className="text-white/90">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, where we will notify you before your data is transferred.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide the Service. If you close your account, we will delete or anonymise your data within 90 days, except where retention is required by law or legitimate business purposes such as resolving disputes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Security</h2>
            <p>
              We implement industry-standard security measures including TLS encryption in transit, encrypted storage for sensitive credentials (e.g. GitHub tokens), and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability — receive your data in a machine-readable format</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:privacy@shipdesk.io" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@shipdesk.io</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies. Please see our <Link href="/cookies" className="text-indigo-400 hover:text-indigo-300 transition-colors">Cookie Policy</Link> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 16. We do not knowingly collect personal data from children. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@shipdesk.io" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@shipdesk.io</a>{" "}
              or visit our <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">Contact page</Link>.
            </p>
          </section>
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
