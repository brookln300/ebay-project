'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Card {
  id: string;
  player_name: string | null;
  year: number | null;
  brand: string | null;
  set_name: string | null;
  card_number: string | null;
  parallel: string | null;
  sport: string;
  is_rookie: boolean;
  is_auto: boolean;
  is_numbered: boolean;
  numbered_to: number | null;
  condition_grade: string | null;
  analysis_confidence: number | null;
  status: string;
  created_at: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [statusFilter]);

  async function loadCards() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('limit', '100');

    const res = await fetch(`/api/cards?${params}`);
    const data = await res.json();
    setCards(data.cards || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCards();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cards</h1>
          <p className="text-slate-500 text-sm mt-1">{total} cards scanned</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by player name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="scanned">Scanned</option>
          <option value="reviewed">Reviewed</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Cards Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-400">No cards found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Player</th>
                <th className="text-left p-3 font-medium text-slate-600">Year</th>
                <th className="text-left p-3 font-medium text-slate-600">Brand / Set</th>
                <th className="text-left p-3 font-medium text-slate-600">Card #</th>
                <th className="text-left p-3 font-medium text-slate-600">Parallel</th>
                <th className="text-left p-3 font-medium text-slate-600">Features</th>
                <th className="text-left p-3 font-medium text-slate-600">Condition</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium">{card.player_name || 'Unknown'}</td>
                  <td className="p-3">{card.year || '-'}</td>
                  <td className="p-3">
                    {card.brand || '-'}{card.set_name ? ` / ${card.set_name}` : ''}
                  </td>
                  <td className="p-3">{card.card_number || '-'}</td>
                  <td className="p-3">{card.parallel || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {card.is_rookie && <Tag label="RC" color="green" />}
                      {card.is_auto && <Tag label="AUTO" color="blue" />}
                      {card.is_numbered && <Tag label={`/${card.numbered_to}`} color="purple" />}
                    </div>
                  </td>
                  <td className="p-3">{card.condition_grade || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      card.status === 'listed' ? 'bg-green-100 text-green-700' :
                      card.status === 'sold' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {card.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/cards/${card.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </Link>
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

function Tag({ label, color }: { label: string; color: string }) {
  const styles: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[color]}`}>
      {label}
    </span>
  );
}
