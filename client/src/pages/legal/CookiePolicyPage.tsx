import { Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";

export function CookiePolicyPage() {
  useSEO({
    title: "Cookie Policy | ShipDesk",
    description: "Learn how ShipDesk uses cookies and similar tracking technologies.",
  });

  const cookieTable = [
    {
      name: "shipdesk_client_session",
      type: "Strictly necessary",
      purpose: "Authenticates client portal sessions after magic-link sign-in",
      duration: "30 days",
    },
    {
      name: "__clerk_*",
      type: "Strictly necessary",
      purpose: "Manages developer authentication state via Clerk",
      duration: "Session / 1 year",
    },
    {
      name: "__session",
      type: "Strictly necessary",
      purpose: "Clerk session token for JWT verification",
      duration: "Session",
    },
    {
      name: "_ga, _gid",
      type: "Analytics (optional)",
      purpose: "Google Analytics — helps us understand traffic patterns",
      duration: "2 years / 24 hours",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Cookie Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 24, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work correctly, improve efficiency, and provide information to website owners. We also use similar technologies such as local storage and session storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Cookies</h2>
            <p className="mb-3">ShipDesk uses cookies for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white/90">Authentication:</strong> To keep you signed in to your developer account (via Clerk) and to maintain client portal sessions after magic-link login.</li>
              <li><strong className="text-white/90">Security:</strong> To protect against cross-site request forgery (CSRF) and other attack vectors.</li>
              <li><strong className="text-white/90">Preferences:</strong> To remember your settings and preferences within the app.</li>
              <li><strong className="text-white/90">Analytics:</strong> To understand how visitors interact with the Service so we can improve it (optional, requires your consent).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Cookies We Use</h2>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 font-semibold text-white/80">Cookie</th>
                    <th className="text-left py-2 pr-4 font-semibold text-white/80">Type</th>
                    <th className="text-left py-2 pr-4 font-semibold text-white/80">Purpose</th>
                    <th className="text-left py-2 font-semibold text-white/80">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieTable.map((row) => (
                    <tr key={row.name} className="border-b border-white/5">
                      <td className="py-2.5 pr-4 font-mono text-xs text-indigo-300 align-top">{row.name}</td>
                      <td className="py-2.5 pr-4 align-top whitespace-nowrap">{row.type}</td>
                      <td className="py-2.5 pr-4 align-top">{row.purpose}</td>
                      <td className="py-2.5 align-top whitespace-nowrap">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Cookies</h2>
            <p className="mb-3">Some of our service providers may also set cookies on your device:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white/90">Clerk</strong> — Authentication provider. Sets cookies to manage sign-in sessions for the developer dashboard.</li>
              <li><strong className="text-white/90">Lemon Squeezy</strong> — Payment processor. May set cookies during the checkout flow.</li>
              <li><strong className="text-white/90">Cloudinary</strong> — File storage and delivery. May set cookies for optimised media delivery.</li>
            </ul>
            <p className="mt-3">These third parties have their own privacy and cookie policies, which we encourage you to review.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Strictly Necessary Cookies</h2>
            <p>
              Some cookies are essential for the Service to function correctly — for example, keeping you logged in to your account. These cookies cannot be disabled without significantly impairing your experience, and they do not require your consent under applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Your Choices</h2>
            <p className="mb-3">You can control cookies in the following ways:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white/90">Browser settings:</strong> Most browsers allow you to refuse or delete cookies through their settings. Note that disabling essential cookies will affect the functionality of the Service.</li>
              <li><strong className="text-white/90">Opt-out tools:</strong> For analytics cookies, you can opt out via the Google Analytics opt-out browser add-on.</li>
              <li><strong className="text-white/90">Do Not Track:</strong> We respect Do Not Track (DNT) signals where technically feasible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or applicable law. We will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
            <p>
              Questions about our use of cookies? Contact us at{" "}
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
