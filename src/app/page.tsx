'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/utils/api';

interface Stats {
  totalCards: number;
  draftListings: number;
  activeListings: number;
  soldListings: number;
}

interface ScanResult {
  total: number;
  processed: number;
  unknown: number;
  errors: number;
  cards: Array<{ id: string; player_name: string | null; status: string }>;
  errorDetails: string[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCards: 0,
    draftListings: 0,
    activeListings: 0,
    soldListings: 0,
  });
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [recentCards, setRecentCards] = useState<Record<string, unknown>[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadStats();
    loadRecentCards();
  }, []);

  async function loadStats() {
    try {
      const [cardsRes, draftsRes, activeRes, soldRes] = await Promise.all([
        fetch(api('/api/cards?limit=1')),
        fetch(api('/api/listings?status=draft&limit=1')),
        fetch(api('/api/listings?status=active&limit=1')),
        fetch(api('/api/listings?status=sold&limit=1')),
      ]);
      const [cards, drafts, active, sold] = await Promise.all([
        cardsRes.json(),
        draftsRes.json(),
        activeRes.json(),
        soldRes.json(),
      ]);
      setStats({
        totalCards: cards.total || 0,
        draftListings: drafts.total || 0,
        activeListings: active.total || 0,
        soldListings: sold.total || 0,
      });
    } catch {
      // Stats will show 0 on error
    }
  }

  async function loadRecentCards() {
    try {
      const res = await fetch(api('/api/cards?limit=10'));
      const data = await res.json();
      setRecentCards(data.cards || []);
    } catch {
      // No recent cards
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    if (files.length === 0) return;

    setScanning(true);
    setScanResult(null);
    setScanError(null);

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append('images', file);
    }

    try {
      const res = await fetch(api('/api/scan/upload'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setScanResult(data.result);
        loadStats();
        loadRecentCards();
      } else {
        setScanError(data.error || 'Scan failed');
      }
    } catch (err) {
      setScanError(`Upload error: ${err}`);
    }
    setScanning(false);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    uploadFiles(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      uploadFiles(e.target.files);
      e.target.value = ''; // Reset so same file can be re-selected
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sports card scanner &amp; eBay listing manager
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : scanning
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
        }`}
        onClick={() => !scanning && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
        {scanning ? (
          <div>
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-700 font-medium">Analyzing cards...</p>
            <p className="text-slate-400 text-sm mt-1">Claude is identifying your cards and looking up pricing</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">&#x1F4F7;</div>
            <p className="text-slate-700 font-medium">
              Drop card images here or click to upload
            </p>
            <p className="text-slate-400 text-sm mt-1">
              JPG, PNG, WebP, GIF &mdash; up to 10MB each
            </p>
          </div>
        )}
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-800 font-medium mb-1">
            Scan complete: {scanResult.processed} identified, {scanResult.unknown} unknown, {scanResult.errors} errors ({scanResult.total} total)
          </p>
          {scanResult.cards.length > 0 && (
            <div className="mt-2 space-y-1">
              {scanResult.cards.map((c) => (
                <p key={c.id} className="text-blue-700">
                  &#10003; {c.player_name || 'Card'} &mdash; drafts created
                </p>
              ))}
            </div>
          )}
          {scanResult.errorDetails.length > 0 && (
            <div className="mt-2 space-y-1">
              {scanResult.errorDetails.map((e, i) => (
                <p key={i} className="text-red-600">&#10007; {e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {scanError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {scanError}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Cards" value={stats.totalCards} color="blue" />
        <StatCard label="Draft Listings" value={stats.draftListings} color="yellow" />
        <StatCard label="Active Listings" value={stats.activeListings} color="green" />
        <StatCard label="Sold" value={stats.soldListings} color="purple" />
      </div>

      {/* Recent Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Cards</h2>
        {recentCards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-400 text-lg mb-2">No cards scanned yet</p>
            <p className="text-slate-400 text-sm">
              Upload card images above to start scanning
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium text-slate-600">Player</th>
                  <th className="text-left p-3 font-medium text-slate-600">Year</th>
                  <th className="text-left p-3 font-medium text-slate-600">Brand / Set</th>
                  <th className="text-left p-3 font-medium text-slate-600">Sport</th>
                  <th className="text-left p-3 font-medium text-slate-600">Status</th>
                  <th className="text-left p-3 font-medium text-slate-600">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentCards.map((card: Record<string, unknown>) => (
                  <tr key={card.id as string} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{(card.player_name as string) || 'Unknown'}</td>
                    <td className="p-3">{(card.year as number) || '-'}</td>
                    <td className="p-3">
                      {(card.brand as string) || '-'} {(card.set_name as string) ? `/ ${card.set_name}` : ''}
                    </td>
                    <td className="p-3 capitalize">{(card.sport as string) || '-'}</td>
                    <td className="p-3">
                      <StatusBadge status={card.status as string} />
                    </td>
                    <td className="p-3">
                      {card.analysis_confidence
                        ? `${Math.round((card.analysis_confidence as number) * 100)}%`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-75">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scanned: 'bg-blue-100 text-blue-700',
    reviewed: 'bg-yellow-100 text-yellow-700',
    listed: 'bg-green-100 text-green-700',
    sold: 'bg-purple-100 text-purple-700',
    unknown: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
