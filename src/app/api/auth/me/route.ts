import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkUsage } from '@/lib/auth/usage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const scanUsage = await checkUsage(user.id, user.tier, 'scan');

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      tier: user.tier,
    },
    usage: {
      scans_today: scanUsage.used_today,
      scans_this_month: scanUsage.used_this_month,
      daily_limit: scanUsage.limit_daily,
      monthly_limit: scanUsage.limit_monthly,
    },
  });
}
