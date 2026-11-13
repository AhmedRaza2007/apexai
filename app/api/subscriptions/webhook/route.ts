import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody || '{}');

    // Handle Lemon Squeezy subscription events
    if (event.meta?.event_name) {
      const eventName = event.meta.event_name;
      const customData = event.meta.custom_data;
      const userId = customData?.user_id;
      const tier = customData?.tier || 'pro';
      const interval = customData?.interval || 'month';

      if (userId && (eventName === 'subscription_created' || eventName === 'subscription_updated')) {
        try {
          const supabase = await createClient();
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            tier,
            interval,
            status: 'active',
            video_credits: tier === 'business' ? 200 : 50,
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('Webhook DB persistence warning:', dbErr);
        }
      }

      return NextResponse.json({ received: true, event: eventName });
    }

    // Handle Stripe webhook events
    if (event.type) {
      const eventType = event.type;
      if (eventType === 'checkout.session.completed') {
        const session = event.data?.object;
        const userId = session?.metadata?.user_id;
        const tier = session?.metadata?.tier || 'pro';
        const interval = session?.metadata?.interval || 'month';

        if (userId) {
          try {
            const supabase = await createClient();
            await supabase.from('subscriptions').upsert({
              user_id: userId,
              tier,
              interval,
              status: 'active',
              video_credits: tier === 'business' ? 200 : 50,
              updated_at: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.warn('Webhook DB persistence warning:', dbErr);
          }
        }
      }

      return NextResponse.json({ received: true, event: eventType });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
