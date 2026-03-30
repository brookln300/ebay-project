import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email, password, display_name, antibot } = await req.json();

  // Antibot: honeypot field must be empty, math challenge must be correct
  if (antibot?.honeypot) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
  }
  if (!antibot?.answer || antibot.answer !== antibot.expected) {
    return NextResponse.json({ error: 'Please solve the verification challenge' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check if user exists
  const { data: existing } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);
  const { data: user, error } = await supabase
    .from('app_users')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      display_name: display_name || email.split('@')[0],
      tier: 'free',
    })
    .select('id')
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  // Create session
  await createSession(user.id);

  return NextResponse.json({ success: true, redirect: '/' });
}
