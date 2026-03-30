export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 30, 2026</p>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">1. Information We Collect</h2>
          <p><strong>Account Data:</strong> Email address, display name, and hashed password (we never store plain-text passwords).</p>
          <p className="mt-2"><strong>Card Images:</strong> Images you upload for scanning. These are processed through the Anthropic API for analysis, then deleted from the scan folder upon successful draft creation or moved to the &quot;unknown&quot; folder.</p>
          <p className="mt-2"><strong>Usage Data:</strong> Scan counts, listing activity, and timestamps for enforcing tier limits.</p>
          <p className="mt-2"><strong>Payment Data:</strong> Handled entirely by Stripe. We store your Stripe customer ID but never your credit card details.</p>
          <p className="mt-2"><strong>eBay Data:</strong> OAuth tokens for API access. We never see or store your eBay password.</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Card images are sent to Anthropic&apos;s Claude API for analysis — not for model training</li>
            <li>Card data and pricing are stored in our Supabase database to power your dashboard</li>
            <li>eBay API tokens are used solely to create listings on your behalf</li>
            <li>Email is used for account authentication and critical service communications</li>
            <li>Usage data tracks your scan/listing counts against tier limits</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">3. Third-Party Services</h2>
          <p>CardFlow integrates with:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Anthropic (Claude API)</strong> — AI image analysis. Subject to Anthropic&apos;s privacy policy.</li>
            <li><strong>eBay API</strong> — Listing creation and pricing data. Subject to eBay&apos;s privacy policy.</li>
            <li><strong>Stripe</strong> — Payment processing. Subject to Stripe&apos;s privacy policy.</li>
            <li><strong>Supabase</strong> — Database hosting. Data stored in US-East region.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">4. Data Retention</h2>
          <p>
            Card records and listing data are retained while your account is active. You may
            request deletion of your data at any time by contacting us. Upon account deletion,
            all personal data is removed within 30 days. Anonymized usage statistics may be
            retained for analytics.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">5. Data Security</h2>
          <p>
            Passwords are hashed with bcrypt (12 rounds). API tokens are stored server-side only.
            All connections use HTTPS. Session tokens are HTTP-only cookies. We do not sell or
            share your personal data with third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">6. Your Rights</h2>
          <p>You may:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Request a copy of your stored data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Revoke eBay API access through your eBay account settings</li>
            <li>Cancel your subscription at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-900 text-base mb-2">7. Contact</h2>
          <p>
            For privacy questions or data requests:{' '}
            <a href="mailto:aethercoreai@outlook.com" className="text-blue-600 hover:underline">
              aethercoreai@outlook.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
