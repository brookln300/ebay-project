'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [watchDir, setWatchDir] = useState(
    process.env.NEXT_PUBLIC_CARD_WATCH_DIR || 'C:\\Users\\knati\\Documents\\card-scans'
  );
  const [ebayConnected, setEbayConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function connectEbay() {
    setConnecting(true);
    try {
      const res = await fetch('/api/ebay/auth');
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
    setConnecting(false);
  }

  // Check URL params for eBay connection status
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ebay') === 'connected' && !ebayConnected) {
      setEbayConnected(true);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      {/* API Keys Section */}
      <Section title="API Keys" description="Configure in .env.local file on the server">
        <div className="space-y-3">
          <KeyStatus label="Anthropic API Key" envVar="ANTHROPIC_API_KEY" />
          <KeyStatus label="eBay App ID" envVar="EBAY_APP_ID" />
          <KeyStatus label="eBay Cert ID" envVar="EBAY_CERT_ID" />
          <KeyStatus label="Supabase URL" envVar="NEXT_PUBLIC_SUPABASE_URL" />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Edit <code className="bg-slate-100 px-1 rounded">.env.local</code> in the project root
          and restart the dev server.
        </p>
      </Section>

      {/* eBay Account */}
      <Section title="eBay Account" description="Connect your eBay seller account">
        <div className="flex items-center gap-3">
          {ebayConnected ? (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              Connected
            </span>
          ) : (
            <button
              onClick={connectEbay}
              disabled={connecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect eBay Account'}
            </button>
          )}
        </div>
      </Section>

      {/* Watch Directory */}
      <Section title="Watch Directory" description="Where card images are dropped for scanning">
        <input
          type="text"
          value={watchDir}
          onChange={(e) => setWatchDir(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
          placeholder="C:\Users\knati\Documents\card-scans"
        />
        <p className="text-xs text-slate-400 mt-2">
          Set <code className="bg-slate-100 px-1 rounded">CARD_WATCH_DIR</code> in .env.local.
          Images in this directory get scanned daily. Unidentified cards move to <code className="bg-slate-100 px-1 rounded">\unknown</code> subfolder.
          Successfully drafted cards are deleted from the source folder.
        </p>
      </Section>

      {/* Listing Defaults */}
      <Section title="Listing Defaults" description="Default values for new eBay listings">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Shipping Cost</label>
            <input
              type="number"
              defaultValue={1.00}
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
            <input
              type="text"
              defaultValue="Dallas, TX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Auction Duration</label>
            <select defaultValue="7" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="3">3 Days</option>
              <option value="5">5 Days</option>
              <option value="7">7 Days</option>
              <option value="10">10 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Auction Start %</label>
            <input
              type="number"
              defaultValue={70}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">% of median sold price</p>
          </div>
        </div>
      </Section>

      {/* Template Info */}
      <Section title="Templates" description="How auction and buy-it-now listings are configured">
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-sm text-slate-900">Auction Template</h4>
            <ul className="text-xs text-slate-500 mt-1 space-y-0.5">
              <li>Start price = 70% of median recent sold price</li>
              <li>7-day duration (configurable)</li>
              <li>No reserve price</li>
              <li>Standard shipping + top loader protection</li>
            </ul>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-sm text-slate-900">Buy It Now Template</h4>
            <ul className="text-xs text-slate-500 mt-1 space-y-0.5">
              <li>Price = median sold price (or +10% if trending up)</li>
              <li>Good &apos;Til Cancelled duration</li>
              <li>Best Offer enabled</li>
              <li>Standard shipping + top loader protection</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      {children}
    </div>
  );
}

function KeyStatus({ label, envVar }: { label: string; envVar: string }) {
  // In client component, we can only check NEXT_PUBLIC_ vars
  const isPublic = envVar.startsWith('NEXT_PUBLIC_');
  const hasValue = isPublic ? !!process.env[envVar] : null;

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`text-xs font-medium ${
        hasValue === null ? 'text-slate-400' : hasValue ? 'text-green-600' : 'text-red-500'
      }`}>
        {hasValue === null ? 'Server-side' : hasValue ? 'Configured' : 'Missing'}
      </span>
    </div>
  );
}
