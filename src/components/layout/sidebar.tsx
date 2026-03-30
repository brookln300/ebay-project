'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/cards', label: 'Cards', icon: '🃏' },
  { href: '/listings', label: 'Listings', icon: '🏷️' },
  { href: '/pricing', label: 'Pricing', icon: '💳' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface User {
  email: string;
  display_name: string | null;
  tier: string;
}

interface Usage {
  scans_today: number;
  daily_limit: number;
  scans_this_month: number;
  monthly_limit: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  // Don't show sidebar on login/signup pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (isAuthPage) return;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setUsage(data.usage);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {});
  }, [pathname, isAuthPage, router]);

  if (isAuthPage) return null;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const tierColors: Record<string, string> = {
    free: 'bg-slate-600',
    premium: 'bg-yellow-600',
    pro: 'bg-purple-600',
  };

  return (
    <aside className="w-56 bg-slate-800 text-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">CardFlow</h1>
        <p className="text-xs text-slate-400 mt-1">Sports Card Lister</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Usage indicator */}
      {usage && (
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Today&apos;s Scans</p>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (usage.scans_today / usage.daily_limit) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {usage.scans_today} / {usage.daily_limit}
          </p>
        </div>
      )}

      {/* Legal links */}
      <div className="px-4 py-2 border-t border-slate-700 flex gap-3">
        <Link href="/faq" className="text-xs text-slate-500 hover:text-slate-300">FAQ</Link>
        <Link href="/terms" className="text-xs text-slate-500 hover:text-slate-300">Terms</Link>
        <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-300">Privacy</Link>
      </div>

      {/* User info */}
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-slate-300 truncate">
              {user.display_name || user.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${tierColors[user.tier] || 'bg-slate-600'}`}>
              {user.tier.toUpperCase()}
            </span>
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
