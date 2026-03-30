'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/utils/api';

const plans = [
  {
    name: 'Free',
    tier: 'free',
    price: '$0',
    period: '/mo',
    features: [
      '2 scans per day',
      '60 scans per month',
      'Auto-draft listings',
      'Basic card analysis',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Premium',
    tier: 'premium',
    price: '$9.99',
    period: '/mo',
    features: [
      '25 scans per day',
      '200 scans per month',
      'Auto-draft listings',
      'Pricing comp analysis',
      'Priority processing',
    ],
    cta: 'Upgrade to Premium',
    highlighted: true,
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$49.99',
    period: '/mo',
    features: [
      '100 scans per day',
      '1,000 listings per month',
      'Auto-draft listings',
      'Full pricing analytics',
      'Bulk scan support',
      'Priority processing',
    ],
    cta: 'Upgrade to Pro',
    highlighted: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch(api('/api/auth/me'))
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setCurrentTier(data.user.tier);
          setLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleUpgrade(tier: string) {
    if (!loggedIn) {
      router.push('/signup');
      return;
    }
    if (tier === 'free' || tier === currentTier) return;

    setLoading(tier);
    try {
      const res = await fetch(api('/api/stripe/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch {
      alert('Something went wrong');
    }
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900">Simple Pricing</h1>
          <p className="text-slate-500 mt-2">Scan cards. Generate listings. Sell faster.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            return (
              <div
                key={plan.tier}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border-blue-500 bg-white shadow-lg ring-2 ring-blue-500'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-green-500 mt-0.5">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isCurrent || loading === plan.tier}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-800 text-white hover:bg-slate-900'
                  } disabled:opacity-50`}
                >
                  {loading === plan.tier
                    ? 'Loading...'
                    : isCurrent
                    ? 'Current Plan'
                    : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
