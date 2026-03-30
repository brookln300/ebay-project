import { NextResponse } from 'next/server';
import { scanDirectory } from '@/lib/watcher/file-watcher';
import { getSessionUser } from '@/lib/auth/session';
import { checkUsage, recordUsage } from '@/lib/auth/usage';

export const dynamic = 'force-dynamic';

export async function POST() {
  // Auth check
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 });
  }

  // Usage check
  const usage = await checkUsage(user.id, user.tier, 'scan');
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: usage.reason,
        usage: {
          used_today: usage.used_today,
          used_this_month: usage.used_this_month,
          daily_limit: usage.limit_daily,
          monthly_limit: usage.limit_monthly,
        },
        upgrade_url: '/pricing',
      },
      { status: 429 }
    );
  }

  const watchDir = process.env.CARD_WATCH_DIR;
  if (!watchDir) {
    return NextResponse.json(
      { error: 'CARD_WATCH_DIR not configured' },
      { status: 500 }
    );
  }

  try {
    const result = await scanDirectory(watchDir);

    // Record usage for each card processed
    if (result.processed > 0) {
      await recordUsage(user.id, 'scan', result.processed);
    }

    return NextResponse.json({
      success: true,
      result,
      usage: {
        used_today: usage.used_today + result.processed,
        daily_limit: usage.limit_daily,
        used_this_month: usage.used_this_month + result.processed,
        monthly_limit: usage.limit_monthly,
      },
    });
  } catch (err) {
    console.error('[API /scan] Error:', err);
    return NextResponse.json(
      { error: 'Scan failed', details: String(err) },
      { status: 500 }
    );
  }
}
