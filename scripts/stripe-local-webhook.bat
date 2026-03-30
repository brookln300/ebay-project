@echo off
echo ============================================
echo  CardFlow - Stripe Local Webhook Forwarding
echo ============================================
echo.
echo This forwards Stripe webhooks to your local dev server.
echo Copy the whsec_ signing secret printed below into .env.local
echo.
echo Starting Stripe CLI listener...
echo.
stripe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted
