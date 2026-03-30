import { createServerClient } from '../supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'cf_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
}

export async function createSession(userId: string): Promise<string> {
  const supabase = createServerClient();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await supabase.from('user_sessions').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false, // localhost
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return token;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const supabase = createServerClient();
  const { data: session } = await supabase
    .from('user_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('user_sessions').delete().eq('token', token);
    return null;
  }

  const { data: user } = await supabase
    .from('app_users')
    .select('id, email, display_name, tier, stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', session.user_id)
    .single();

  return user || null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const supabase = createServerClient();
    await supabase.from('user_sessions').delete().eq('token', token);
    cookieStore.delete(SESSION_COOKIE);
  }
}
