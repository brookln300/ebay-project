'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/utils/api';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    loadListing();
  }, [params.id]);

  async function loadListing() {
    const res = await fetch(api(`/api/listings/${params.id}`));
    const data = await res.json();
    if (data.listing) {
      setListing(data.listing);
      setTitle(data.listing.title);
      setPrice(
        String(data.listing.start_price || data.listing.buy_it_now_price || '')
      );
    }
    setLoading(false);
  }

  async function saveEdits() {
    const updates: Record<string, unknown> = { title };
    if (listing?.listing_type === 'auction') {
      updates.start_price = parseFloat(price);
    } else {
      updates.buy_it_now_price = parseFloat(price);
    }

    await fetch(api(`/api/listings/${params.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setEditing(false);
    loadListing();
  }

  async function publish() {
    if (!confirm('Publish this listing to eBay?')) return;
    setPublishing(true);
    const res = await fetch(api(`/api/listings/${params.id}/publish`), { method: 'POST' });
    const data = await res.json();
    if (data.ebay_item_id) {
      alert(`Published! eBay Item ID: ${data.ebay_item_id}`);
      loadListing();
    } else {
      alert(`Failed: ${data.error}`);
    }
    setPublishing(false);
  }

  async function deleteListing() {
    if (!confirm('Delete this listing?')) return;
    await fetch(api(`/api/listings/${params.id}`), { method: 'DELETE' });
    router.push('/listings');
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
  if (!listing) return <div className="text-center py-12 text-slate-400">Listing not found</div>;

  const card = listing.card as Record<string, unknown> | undefined;

  return (
    <div className="max-w-3xl">
      <Link href="/listings" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
        &larr; Back to Listings
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              listing.ebay_status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
              listing.ebay_status === 'active' ? 'bg-green-100 text-green-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {listing.ebay_status as string}
            </span>
            <span className="ml-2 text-xs text-slate-400 capitalize">
              {(listing.listing_type as string)?.replace('_', ' ')}
            </span>
          </div>
          <div className="flex gap-2">
            {listing.ebay_status === 'draft' && (
              <>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish to eBay'}
                </button>
                <button
                  onClick={deleteListing}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title (max 80 chars)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">{title.length}/80</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {listing.listing_type === 'auction' ? 'Start Price' : 'Buy It Now Price'}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={saveEdits}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{listing.title as string}</h2>
            <p className="text-2xl font-bold text-green-600">
              ${((listing.start_price || listing.buy_it_now_price) as number)?.toFixed(2)}
            </p>
            {listing.ebay_item_id && (
              <p className="text-xs text-slate-400 mt-2 font-mono">
                eBay Item ID: {listing.ebay_item_id as string}
              </p>
            )}
          </>
        )}
      </div>

      {/* Description Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Listing Description Preview</h3>
        <div
          className="border border-slate-200 rounded p-4"
          dangerouslySetInnerHTML={{ __html: listing.description_html as string }}
        />
      </div>

      {/* Card Info */}
      {card && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Card Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Player:</span> <span className="font-medium">{card.player_name as string}</span></div>
            <div><span className="text-slate-500">Year:</span> <span className="font-medium">{card.year as number}</span></div>
            <div><span className="text-slate-500">Brand:</span> <span className="font-medium">{card.brand as string}</span></div>
            <div><span className="text-slate-500">Set:</span> <span className="font-medium">{card.set_name as string}</span></div>
            <div><span className="text-slate-500">Card #:</span> <span className="font-medium">{card.card_number as string}</span></div>
            <div><span className="text-slate-500">Condition:</span> <span className="font-medium">{card.condition_grade as string}</span></div>
          </div>
          <Link
            href={`/cards/${card.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm mt-3 inline-block"
          >
            View Full Card Details
          </Link>
        </div>
      )}
    </div>
  );
}
