import { createServerClient } from '../supabase/server';
import { getTierLimits } from '../tiers';

interface UsageCheck {
  allowed: boolean;
  reason?: string;
  used_today: number;
  used_this_month: number;
  limit_daily: number;
  limit_monthly: number;
}

export async function checkUsage(userId: string, tier: string, action: 'scan' | 'listing'): Promise<UsageCheck> {
  const supabase = createServerClient();
  const limits = getTierLimits(tier);
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 8) + '01';

  // Get today's usage
  const { data: todayUsage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('action', action)
    .eq('period_date', today);

  const usedToday = (todayUsage || []).reduce((sum, r) => sum + (r.count || 0), 0);

  // Get this month's usage
  const { data: monthUsage } = await supabase
    .from('usage_tracking')
    .select('count')
    .eq('user_id', userId)
    .eq('action', action)
    .gte('period_date', monthStart)
    .lte('period_date', today);

  const usedThisMonth = (monthUsage || []).reduce((sum, r) => sum + (r.count || 0), 0);

  const dailyLimit = action === 'scan' ? limits.scans_per_day : limits.listings_per_month;
  const monthlyLimit = action === 'scan' ? limits.scans_per_month : limits.listings_per_month;

  if (usedToday >= dailyLimit) {
    return {
      allowed: false,
      reason: `Daily ${action} limit reached (${dailyLimit}/day on ${tier} plan). Upgrade for more.`,
      used_today: usedToday,
      used_this_month: usedThisMonth,
      limit_daily: dailyLimit,
      limit_monthly: monthlyLimit,
    };
  }

  if (usedThisMonth >= monthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly ${action} limit reached (${monthlyLimit}/month on ${tier} plan). Upgrade for more.`,
      used_today: usedToday,
      used_this_month: usedThisMonth,
      limit_daily: dailyLimit,
      limit_monthly: monthlyLimit,
    };
  }

  return {
    allowed: true,
    used_today: usedToday,
    used_this_month: usedThisMonth,
    limit_daily: dailyLimit,
    limit_monthly: monthlyLimit,
  };
}

export async function recordUsage(userId: string, action: 'scan' | 'listing', count: number = 1): Promise<void> {
  const supabase = createServerClient();
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('usage_tracking').insert({
    user_id: userId,
    action,
    count,
    period_date: today,
  });
}
