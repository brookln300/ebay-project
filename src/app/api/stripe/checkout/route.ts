import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getStripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';
import { TIERS } from '@/lib/tiers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { tier } = await req.json();
  const tierConfig = TIERS[tier];
  if (!tierConfig || !tierConfig.stripe_price_id) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const stripe = getStripe();
  const supabase = createServerClient();

  // Get or create Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from('app_users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: tierConfig.stripe_price_id, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/settings?upgraded=${tier}`,
    cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
    metadata: { user_id: user.id, tier },
  });

  return NextResponse.json({ url: session.url });
}
