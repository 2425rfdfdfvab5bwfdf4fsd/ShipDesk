import { Link } from "wouter";
import { useSEO } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";

export function TermsOfServicePage() {
  useSEO({
    title: "Terms of Service | ShipDesk",
    description: "Read the terms and conditions governing your use of ShipDesk.",
  });

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 24, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ShipDesk ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              ShipDesk is an AI-native client portal platform designed for freelance developers and small development agencies. The Service enables you to connect GitHub repositories, generate automated AI status reports, manage client portals, send invoices, exchange messages, and handle scope change requests.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Account Registration</h2>
            <p className="mb-3">To use the Service you must:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Be at least 16 years of age</li>
              <li>Register for an account using accurate, complete, and current information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorised access to your account</li>
              <li>Take responsibility for all activity that occurs under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Violate any applicable law or regulation</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Transmit spam, malware, or any harmful content</li>
              <li>Attempt to gain unauthorised access to the Service or related systems</li>
              <li>Use the Service for any fraudulent or deceptive purpose</li>
              <li>Scrape, crawl, or systematically extract data from the Service</li>
              <li>Reverse engineer or attempt to derive source code from the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Subscriptions and Billing</h2>
            <p>
              Certain features of the Service are available on a subscription basis. By subscribing, you agree to pay the applicable fees as described at the time of purchase. Subscriptions automatically renew unless cancelled before the renewal date. Payment processing is handled by Lemon Squeezy and is subject to their terms. All fees are non-refundable except as required by law or as expressly stated in these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Your Content</h2>
            <p>
              You retain all rights to content you upload or create within the Service ("Your Content"), including project files, messages, and reports. By using the Service, you grant us a limited, non-exclusive, royalty-free licence to store, process, and transmit Your Content solely as necessary to provide the Service. You represent that you have all rights required to grant this licence and that Your Content does not violate these Terms or any applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. GitHub Integration</h2>
            <p>
              When you connect your GitHub account, you authorise us to read repository data (commits, pull requests, releases) on your behalf to generate reports. We do not write to your repositories, delete content, or store your GitHub data beyond what is necessary to operate the Service. Your GitHub credentials are stored encrypted and can be revoked at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. AI-Generated Content</h2>
            <p>
              ShipDesk uses Google Gemini to generate status reports based on your GitHub activity. AI-generated content is provided "as is" and may not always be accurate, complete, or suitable for your purposes. You are responsible for reviewing, editing, and approving any AI-generated reports before sharing them with clients. We make no warranty regarding the accuracy or quality of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding Your Content), features, and functionality are and will remain the exclusive property of ShipDesk and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Termination</h2>
            <p>
              We may suspend or terminate your account at our discretion if you violate these Terms, with or without notice. Upon termination, your right to use the Service ceases immediately. You may also terminate your account at any time by contacting us. Sections that by their nature should survive termination will survive, including intellectual property, disclaimers, and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ShipDesk and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our total liability to you for any claim arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ShipDesk is registered, without regard to its conflict of law provisions. Any disputes shall be resolved through binding arbitration or in the competent courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide at least 14 days' notice of material changes by email or prominent notice within the Service. Your continued use after changes take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">15. Contact</h2>
            <p>
              Questions about these Terms? Reach us at{" "}
              <a href="mailto:legal@shipdesk.io" className="text-indigo-400 hover:text-indigo-300 transition-colors">legal@shipdesk.io</a>{" "}
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
