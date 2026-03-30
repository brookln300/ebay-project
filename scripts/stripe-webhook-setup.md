# Stripe Webhook Setup Guide

## When to do this
After your site is deployed and accessible at a public URL (e.g., https://cardflow.yourdomain.com).

## Step 1: Create Webhook Endpoint in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://YOUR_DOMAIN/api/stripe/webhook
   ```
4. Under **Select events to listen to**, click **+ Select events** and add:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**

## Step 2: Copy the Signing Secret

1. On the webhook endpoint page, click **Reveal** under **Signing secret**
2. Copy the value (starts with `whsec_`)
3. Add it to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```
4. Redeploy your app (or restart the dev server) so the new env var takes effect

## Step 3: Test the Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed` and click **Send test webhook**
4. You should see a `200` response in the dashboard

## Local Development Testing (Optional)

Instead of a public URL, use the Stripe CLI to forward webhooks locally:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a temporary `whsec_` signing secret — use that in `.env.local` for local testing.

## What the webhook handles

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrades user tier, saves subscription ID |
| `customer.subscription.updated` | Syncs status (active/past_due), downgrades to free on cancel |
| `customer.subscription.deleted` | Downgrades to free, clears subscription ID |

## Env vars checklist

```
STRIPE_SECRET_KEY=sk_live_...        # already set
STRIPE_WEBHOOK_SECRET=whsec_...      # set after creating endpoint
STRIPE_PREMIUM_PRICE_ID=price_1TGc.. # already set
STRIPE_PRO_PRICE_ID=price_1TGc..     # already set
```
