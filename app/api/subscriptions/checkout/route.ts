import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS, SubscriptionTier, BillingInterval } from '@/lib/subscription';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { tier, interval = 'month', provider = 'auto' } = body as {
      tier: SubscriptionTier;
      interval: BillingInterval;
      provider?: 'lemon_squeezy' | 'stripe' | 'paddle' | 'sandbox' | 'auto';
    };

    if (!tier || !SUBSCRIPTION_PLANS[tier]) {
      return NextResponse.json({ error: 'Invalid subscription tier selected' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS[tier];

    // If Free plan, downgrade immediately
    if (tier === 'free') {
      return NextResponse.json({
        success: true,
        checkoutUrl: '/subscription?status=downgraded&tier=free',
        tier: 'free',
        message: 'Successfully switched to Free plan.',
      });
    }

    // Check user session
    let userId = 'user_' + Math.random().toString(36).slice(2, 9);
    let userEmail = 'user@example.com';
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || userEmail;
      }
    } catch {}

    const amount = interval === 'year' ? plan.priceYearly : plan.priceMonthly;

    // Check for Lemon Squeezy (Ideal MoR for Pakistan / global creators)
    if (
      (provider === 'lemon_squeezy' || provider === 'auto') &&
      process.env.LEMON_SQUEEZY_API_KEY?.trim() &&
      process.env.LEMON_SQUEEZY_STORE_ID?.trim()
    ) {
      // Connect to Lemon Squeezy checkout API
      try {
        const variantId =
          interval === 'year'
            ? process.env[`LEMON_SQUEEZY_${tier.toUpperCase()}_YEARLY_VARIANT`]
            : process.env[`LEMON_SQUEEZY_${tier.toUpperCase()}_MONTHLY_VARIANT`];

        if (variantId) {
          const lsRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
              Accept: 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json',
              Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY.trim()}`,
            },
            body: JSON.stringify({
              data: {
                type: 'checkouts',
                attributes: {
                  checkout_data: {
                    email: userEmail,
                    custom: { user_id: userId, tier, interval },
                  },
                },
                relationships: {
                  store: {
                    data: {
                      type: 'stores',
                      id: process.env.LEMON_SQUEEZY_STORE_ID.trim(),
                    },
                  },
                  variant: {
                    data: {
                      type: 'variants',
                      id: variantId.trim(),
                    },
                  },
                },
              },
            }),
          });

          if (lsRes.ok) {
            const lsData = await lsRes.json();
            const checkoutUrl = lsData.data?.attributes?.url;
            if (checkoutUrl) {
              return NextResponse.json({
                checkoutUrl,
                provider: 'lemon_squeezy',
                isSandbox: false,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Lemon Squeezy API failed, falling through:', err);
      }
    }

    // Check for Stripe if configured
    if (
      (provider === 'stripe' || provider === 'auto') &&
      process.env.STRIPE_SECRET_KEY?.trim()
    ) {
      try {
        const priceId =
          interval === 'year'
            ? process.env[`STRIPE_${tier.toUpperCase()}_YEARLY_PRICE_ID`]
            : process.env[`STRIPE_${tier.toUpperCase()}_MONTHLY_PRICE_ID`];

        if (priceId) {
          // Stripe checkout session creation
          const params = new URLSearchParams();
          params.append('payment_method_types[0]', 'card');
          params.append('mode', 'subscription');
          params.append('customer_email', userEmail);
          params.append('line_items[0][price]', priceId);
          params.append('line_items[0][quantity]', '1');
          params.append('metadata[user_id]', userId);
          params.append('metadata[tier]', tier);
          params.append('metadata[interval]', interval);
          params.append(
            'success_url',
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?session_id={CHECKOUT_SESSION_ID}&status=success&tier=${tier}`
          );
          params.append(
            'cancel_url',
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?status=canceled`
          );

          const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY.trim()}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          });

          if (stripeRes.ok) {
            const session = await stripeRes.json();
            return NextResponse.json({
              checkoutUrl: session.url,
              provider: 'stripe',
              isSandbox: false,
            });
          }
        }
      } catch (err) {
        console.warn('Stripe checkout failed, falling through:', err);
      }
    }

    // Developer / Sandbox Activation Mode
    // Allows immediate testing of the full subscription lifecycle with explicit sandbox disclaimer
    const sessionId = `sbx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const checkoutUrl = `/subscription?session_id=${sessionId}&status=success&tier=${tier}&interval=${interval}&provider=sandbox&amount=${amount}`;

    return NextResponse.json({
      checkoutUrl,
      provider: 'sandbox',
      isSandbox: true,
      amount,
      currency: 'USD',
      tier,
      interval,
      disclaimer: 'Sandbox Gateway Mode: Safe test environment active.',
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to initiate checkout.' }, { status: 500 });
  }
}
