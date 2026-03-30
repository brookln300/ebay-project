'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/utils/api';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [card, setCard] = useState<Record<string, unknown> | null>(null);
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [pricing, setPricing] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadCard();
  }, [params.id]);

  async function loadCard() {
    const res = await fetch(api(`/api/cards/${params.id}`));
    const data = await res.json();
    if (data.card) {
      setCard(data.card);
      setListings(data.card.listings || []);
      setPricing(data.card.pricing_history || []);
    }
    setLoading(false);
  }

  async function reanalyze() {
    setAnalyzing(true);
    await fetch(api(`/api/cards/${params.id}/analyze`), { method: 'POST' });
    await loadCard();
    setAnalyzing(false);
  }

  async function deleteCard() {
    if (!confirm('Delete this card and all its listings?')) return;
    await fetch(api(`/api/cards/${params.id}`), { method: 'DELETE' });
    router.push('/cards');
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
  if (!card) return <div className="text-center py-12 text-slate-400">Card not found</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cards" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Back to Cards
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Card Details */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {(card.player_name as string) || 'Unknown Card'}
          </h2>
          <div className="space-y-3 text-sm">
            <DetailRow label="Year" value={card.year as number} />
            <DetailRow label="Brand" value={card.brand as string} />
            <DetailRow label="Set" value={card.set_name as string} />
            <DetailRow label="Card #" value={card.card_number as string} />
            <DetailRow label="Parallel" value={card.parallel as string} />
            <DetailRow label="Sport" value={card.sport as string} />
            <DetailRow label="Condition" value={card.condition_grade as string} />
            <DetailRow
              label="Confidence"
              value={
                card.analysis_confidence
                  ? `${Math.round((card.analysis_confidence as number) * 100)}%`
                  : null
              }
            />
            <div className="flex gap-2 pt-3">
              {Boolean(card.is_rookie) && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Rookie</span>}
              {Boolean(card.is_auto) && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Auto</span>}
              {Boolean(card.is_numbered) && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  /{String(card.numbered_to)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={reanalyze}
              disabled={analyzing}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Re-Analyze'}
            </button>
            <button
              onClick={deleteCard}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Draft Listings</h3>
          {listings.length === 0 ? (
            <p className="text-slate-400 text-sm">No listings created</p>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id as string} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{listing.title as string}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      listing.ebay_status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      listing.ebay_status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {listing.ebay_status as string}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="capitalize">{listing.listing_type as string}</span>
                    <span>
                      ${((listing.start_price || listing.buy_it_now_price) as number)?.toFixed(2)}
                    </span>
                  </div>
                  {listing.ebay_status === 'draft' && (
                    <Link
                      href={`/listings/${listing.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs mt-2 inline-block"
                    >
                      Edit & Publish
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pricing History */}
      {pricing.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Comparable Sales</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2 font-medium text-slate-600">Title</th>
                <th className="text-left p-2 font-medium text-slate-600">Price</th>
                <th className="text-left p-2 font-medium text-slate-600">Date</th>
                <th className="text-left p-2 font-medium text-slate-600">Condition</th>
              </tr>
            </thead>
            <tbody>
              {pricing.slice(0, 10).map((p, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-2">{p.listing_title as string}</td>
                  <td className="p-2 font-medium">${(p.sale_price as number)?.toFixed(2)}</td>
                  <td className="p-2">{p.sale_date as string}</td>
                  <td className="p-2">{p.item_condition as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value ? String(value) : '-'}</span>
    </div>
  );
}
