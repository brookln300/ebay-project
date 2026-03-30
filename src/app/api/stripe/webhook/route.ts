import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier;
      if (userId && tier) {
        await supabase
          .from('app_users')
          .update({
            tier,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const customerId = sub.customer as string;
      const status = sub.status;

      const updates: Record<string, string> = {
        subscription_status: status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'canceled',
        updated_at: new Date().toISOString(),
      };

      // If canceled, downgrade to free
      if (status === 'canceled' || status === 'unpaid') {
        updates.tier = 'free';
        updates.stripe_subscription_id = '';
      }

      await supabase
        .from('app_users')
        .update(updates)
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const customerId = sub.customer as string;
      await supabase
        .from('app_users')
        .update({
          tier: 'free',
          stripe_subscription_id: '',
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
