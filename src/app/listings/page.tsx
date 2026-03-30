'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/utils/api';

interface Listing {
  id: string;
  card_id: string;
  listing_type: string;
  title: string;
  start_price: number | null;
  buy_it_now_price: number | null;
  ebay_status: string;
  ebay_item_id: string | null;
  created_at: string;
  card?: { player_name: string; year: number };
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, [statusFilter, typeFilter]);

  async function loadListings() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    params.set('limit', '100');

    const res = await fetch(api(`/api/listings?${params}`));
    const data = await res.json();
    setListings(data.listings || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function publishListing(id: string) {
    if (!confirm('Publish this listing to eBay?')) return;
    setPublishing(id);
    try {
      const res = await fetch(api(`/api/listings/${id}/publish`), { method: 'POST' });
      const data = await res.json();
      if (data.ebay_item_id) {
        alert(`Published! eBay Item ID: ${data.ebay_item_id}`);
        loadListings();
      } else {
        alert(`Publish failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    }
    setPublishing(null);
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this draft listing?')) return;
    await fetch(api(`/api/listings/${id}`), { method: 'DELETE' });
    loadListings();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total listings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
          <option value="sold">Sold</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All Types</option>
          <option value="auction">Auction</option>
          <option value="buy_it_now">Buy It Now</option>
        </select>
      </div>

      {/* Listings Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-400">No listings found</p>
          <p className="text-slate-400 text-sm mt-1">Scan cards to auto-generate draft listings</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Title</th>
                <th className="text-left p-3 font-medium text-slate-600">Type</th>
                <th className="text-left p-3 font-medium text-slate-600">Price</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">eBay ID</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/listings/${listing.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {listing.title}
                    </Link>
                  </td>
                  <td className="p-3 capitalize">{listing.listing_type.replace('_', ' ')}</td>
                  <td className="p-3 font-medium">
                    ${(listing.start_price || listing.buy_it_now_price || 0).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      listing.ebay_status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      listing.ebay_status === 'active' ? 'bg-green-100 text-green-700' :
                      listing.ebay_status === 'sold' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {listing.ebay_status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-400 font-mono">
                    {listing.ebay_item_id || '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {listing.ebay_status === 'draft' && (
                        <>
                          <button
                            onClick={() => publishListing(listing.id)}
                            disabled={publishing === listing.id}
                            className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                          >
                            {publishing === listing.id ? 'Publishing...' : 'Publish'}
                          </button>
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
