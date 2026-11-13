'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Video,
  Cpu,
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SUBSCRIPTION_PLANS, SubscriptionTier, BillingInterval, getClientSubscription } from '@/lib/subscription';

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const currentSub = getClientSubscription();

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === currentSub.tier) {
      router.push('/subscription');
      return;
    }

    setLoadingTier(tier);

    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval, provider: 'auto' }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to initiate checkout.');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Could not start checkout process.');
    } finally {
      setLoadingTier(null);
    }
  };

  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="space-y-10 pb-12">
      {/* Header & Plan Toggle */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <Badge variant="info" className="px-3 py-1 text-xs">
          Flexible & Transparent Pricing
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Predictable AI leverage for high-performing teams
        </h1>
        <p className="text-base text-slate-400">
          Unlock flagship AI models, custom document RAG, and AI Video Studio generation. Upgrade or downgrade anytime.
        </p>

        {/* Billing Switch */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm mt-4">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              interval === 'month'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              interval === 'year'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 border border-emerald-500/30">
              Save 16%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = currentSub.tier === plan.id;
          const price = interval === 'year' ? plan.priceYearly : plan.priceMonthly;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 transition-all ${
                isPopular
                  ? 'border-blue-500/60 bg-gradient-to-b from-blue-950/30 to-slate-900/90 shadow-xl shadow-blue-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider shadow-md shadow-blue-600/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Title & Price */}
              <div className="border-b border-slate-800 pb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-400 min-h-[32px]">{plan.tagline}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">${price}</span>
                  <span className="text-xs text-slate-400">
                    {plan.id === 'free' ? 'forever' : interval === 'year' ? '/ year' : '/ month'}
                  </span>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="flex-1 py-6 space-y-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Included Capabilities:
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs">
                      {feat.included ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-slate-700 text-slate-600 flex items-center justify-center text-[10px] mt-0.5">
                          ×
                        </span>
                      )}
                      <span
                        className={
                          feat.included
                            ? feat.highlight
                              ? 'font-semibold text-white'
                              : 'text-slate-300'
                            : 'text-slate-500 line-through'
                        }
                      >
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800">
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingTier !== null}
                  variant={isPopular ? 'primary' : 'outline'}
                  size="md"
                  className="w-full justify-center"
                >
                  {loadingTier === plan.id ? (
                    'Processing...'
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Downgrade to Free'
                  ) : (
                    <>
                      <span>Upgrade to {plan.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Payment Compatibility & Merchant of Record Note */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Shield className="h-4 w-4 text-blue-400" />
          <span>Global Merchant Compliance & Regional Payment Gateways</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          ApexAI utilizes standard Merchant of Record (MoR) architectures via <strong>Lemon Squeezy</strong> and <strong>Stripe</strong>. Lemon Squeezy handles global sales tax, VAT, and payments across 135+ countries (including Pakistan, UAE, UK, US, and Europe) with local currency cards, Apple Pay, Google Pay, and PayPal.
        </p>
        <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Bank-grade 256-bit SSL encryption
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime with 1 click
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Instant activation & invoice generation
          </span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <h2 className="text-xl font-bold text-white text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-white">What are AI Video Credits?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Video credits let you synthesize custom video clips in our AI Video Studio. A standard 5-second 720p render uses 5 credits, while 10-second 1080p clips use 10 credits.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-white">Can I change plans or cancel at any time?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes! You can upgrade, downgrade, or cancel directly from your Subscription Management Dashboard at any time without fees or lock-ins.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-white">How does the free tier daily limit work?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Free plan includes 15 messages every day, which resets at midnight UTC. Pro provides 250 daily messages, and Business offers unlimited messaging.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-white">Which payment methods are accepted?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and international cards. All transactions are securely processed by our Merchant of Record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
