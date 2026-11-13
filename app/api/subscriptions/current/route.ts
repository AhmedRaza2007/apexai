import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let userId = 'guest-user';
    let tier: SubscriptionTier = 'free';
    let interval: 'month' | 'year' = 'month';
    let videoCredits = 0;
    let dailyMessagesUsed = 0;
    let status = 'active';

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        // Check subscriptions table in Supabase if exists
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subData) {
          tier = subData.tier || 'free';
          interval = subData.interval || 'month';
          status = subData.status || 'active';
          videoCredits = subData.video_credits ?? (tier === 'pro' ? 50 : tier === 'business' ? 200 : 0);
        }
      }
    } catch {
      // In local mode without Supabase
    }

    const plan = SUBSCRIPTION_PLANS[tier];

    return NextResponse.json({
      subscription: {
        userId,
        tier,
        interval,
        status,
        planName: plan.name,
        dailyMessageLimit: plan.dailyMessageLimit,
        dailyMessagesUsed,
        videoCreditsBalance: videoCredits,
        allowedModelTiers: plan.allowedModelTiers,
      },
      providers: {
        lemonSqueezy: Boolean(process.env.LEMON_SQUEEZY_API_KEY?.trim()),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        paddle: Boolean(process.env.PADDLE_API_KEY?.trim()),
        sandboxActive: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
