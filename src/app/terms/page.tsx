export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 30, 2026</p>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CardFlow (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Service. The Service is operated by AetherCore AI
            (contact: aethercoreai@outlook.com).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">2. Description of Service</h2>
          <p>
            CardFlow is a tool that uses AI image recognition to analyze sports trading card images,
            retrieve market pricing data from publicly available eBay sold listings, and generate
            draft eBay listings on your behalf through the official eBay API. The Service acts as
            a listing tool — all eBay transactions occur directly between you and your buyers through
            eBay&apos;s platform.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">3. eBay API Compliance</h2>
          <p>
            CardFlow accesses eBay services through the official eBay Developer Program APIs in
            compliance with the{' '}
            <strong>eBay API License Agreement</strong> and{' '}
            <strong>eBay Developer Program policies</strong>. By using CardFlow to create eBay listings, you agree to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Comply with all eBay listing policies and seller requirements</li>
            <li>Maintain an active eBay seller account in good standing</li>
            <li>Review and approve all draft listings before publishing to eBay</li>
            <li>Accept responsibility for the accuracy of your listings</li>
            <li>Not use the Service to create listings for prohibited or restricted items</li>
            <li>Not exceed eBay API call rate limits through automated or abusive usage</li>
          </ul>
          <p className="mt-2">
            CardFlow does not store your eBay password. Authentication is handled through eBay&apos;s
            OAuth 2.0 flow. You may revoke CardFlow&apos;s access at any time through your eBay account
            settings.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">4. User Accounts</h2>
          <p>
            You must create an account to use CardFlow. You are responsible for maintaining the
            security of your account credentials. You must provide accurate information and keep it
            up to date. One account per person — automated account creation is prohibited.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">5. Subscription and Billing</h2>
          <p>
            CardFlow offers Free, Premium, and Pro tiers. Paid subscriptions are billed monthly
            through Stripe. You may cancel at any time; access continues until the end of the
            billing period. Refunds are handled on a case-by-case basis — contact
            aethercoreai@outlook.com.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">6. Usage Limits</h2>
          <p>
            Each tier has daily and monthly scan limits. Exceeding limits requires upgrading your
            plan. We reserve the right to throttle or suspend accounts exhibiting abusive usage
            patterns, including but not limited to: automated scripting against our APIs,
            circumventing tier limits, or generating spam listings.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">7. AI-Generated Content</h2>
          <p>
            Card analysis and listing descriptions are generated using AI. While we strive for
            accuracy, AI-generated content may contain errors. You are responsible for reviewing
            all card details, pricing recommendations, and listing content before publishing.
            CardFlow is not liable for inaccurate card identification or pricing.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">8. Pricing Data</h2>
          <p>
            Pricing recommendations are based on publicly available eBay sold listing data and are
            provided for informational purposes only. They do not constitute financial or
            investment advice. Market conditions change rapidly — always verify pricing before
            listing.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">9. Intellectual Property</h2>
          <p>
            You retain ownership of your card images and listing content. CardFlow retains
            ownership of the Service, its code, design, and AI models. Card images are processed
            for analysis only and are not used for training or shared with third parties beyond
            the Anthropic API (for analysis) and eBay API (for listing creation).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">10. Limitation of Liability</h2>
          <p>
            CardFlow is provided &quot;as is&quot; without warranties. We are not liable for: lost sales,
            inaccurate pricing, failed listings, eBay account issues, or any indirect damages
            arising from use of the Service. Our total liability is limited to the amount you
            paid for the Service in the preceding 12 months.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">11. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these terms, eBay policies, or
            applicable law. You may delete your account at any time by contacting
            aethercoreai@outlook.com.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">12. Contact</h2>
          <p>
            For questions about these terms, contact:{' '}
            <a href="mailto:aethercoreai@outlook.com" className="text-blue-600 hover:underline">
              aethercoreai@outlook.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
