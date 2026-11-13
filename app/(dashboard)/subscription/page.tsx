'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  Video,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Download,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  getClientSubscription,
  saveClientSubscription,
  SUBSCRIPTION_PLANS,
  SubscriptionTier,
  getClientInvoices,
  addClientInvoice,
  InvoiceRecord,
} from '@/lib/subscription';

function SubscriptionDashboardContent() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState(getClientSubscription());
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    // Check if user just returned from a checkout activation
    const status = searchParams.get('status');
    const tierParam = searchParams.get('tier') as SubscriptionTier | null;
    const intervalParam = (searchParams.get('interval') as 'month' | 'year') || 'month';
    const amountParam = searchParams.get('amount');
    const providerParam = searchParams.get('provider') || 'lemon_squeezy';

    if (status === 'success' && tierParam && SUBSCRIPTION_PLANS[tierParam]) {
      const plan = SUBSCRIPTION_PLANS[tierParam];
      const now = new Date();
      const end = new Date(now);
      if (intervalParam === 'year') {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }

      const updated = {
        ...sub,
        tier: tierParam,
        interval: intervalParam,
        status: 'active' as const,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: end.toISOString(),
        videoCreditsBalance:
          tierParam === 'business' ? 200 : tierParam === 'pro' ? 50 : 0,
        paymentProvider: providerParam as any,
      };

      saveClientSubscription(updated);
      setSub(updated);

      // Add invoice receipt
      const newInvoice: InvoiceRecord = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        amount: Number(amountParam) || (intervalParam === 'year' ? plan.priceYearly : plan.priceMonthly),
        currency: 'USD',
        status: 'paid',
        tier: tierParam,
        interval: intervalParam,
        provider: providerParam === 'sandbox' ? 'Sandbox Gateway' : 'Merchant of Record',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      };
      addClientInvoice(newInvoice);

      setSuccessBanner(
        `Your subscription has been upgraded to ${plan.name} (${intervalParam}ly). All features & ${updated.videoCreditsBalance} video credits have been credited to your account!`
      );
    } else if (status === 'downgraded') {
      const updated = {
        ...sub,
        tier: 'free' as const,
        videoCreditsBalance: 0,
      };
      saveClientSubscription(updated);
      setSub(updated);
      setSuccessBanner('Your account has been moved to the Free tier.');
    }

    setInvoices(getClientInvoices());
  }, [searchParams]);

  const plan = SUBSCRIPTION_PLANS[sub.tier];
  const messagesPercent =
    plan.dailyMessageLimit >= 9999
      ? 5
      : Math.min(100, Math.round((sub.dailyMessagesUsed / plan.dailyMessageLimit) * 100));

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your paid plan? You will retain access until the end of your billing cycle.')) {
      const updated = { ...sub, cancelAtPeriodEnd: true };
      saveClientSubscription(updated);
      setSub(updated);
      alert('Subscription set to cancel at the end of the billing period.');
    }
  };

  const handleImmediateDowngrade = () => {
    if (confirm('Downgrade to the Free plan immediately?')) {
      const updated = {
        ...sub,
        tier: 'free' as SubscriptionTier,
        cancelAtPeriodEnd: false,
        videoCreditsBalance: 0,
      };
      saveClientSubscription(updated);
      setSub(updated);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">Subscription Management</h1>
            <Badge variant={sub.tier === 'business' ? 'warning' : sub.tier === 'pro' ? 'info' : 'default'}>
              {plan.name} Plan
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Monitor daily message usage, video credits, invoices, and billing preferences.
          </p>
        </div>

        <Link href="/pricing">
          <Button variant="primary" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
            Change Plan
          </Button>
        </Link>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-300">Plan Updated Successfully</p>
            <p className="leading-relaxed text-emerald-200/90">{successBanner}</p>
          </div>
        </div>
      )}

      {/* Plan Overview & Usage Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Plan Card */}
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Tier
              </span>
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-2">{plan.name}</CardTitle>
            <CardDescription className="text-xs">
              {sub.tier === 'free'
                ? 'Free standard tier'
                : `$${sub.interval === 'year' ? plan.priceYearly : plan.priceMonthly} / ${sub.interval}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            <div className="text-xs text-slate-300 space-y-1">
              <p className="text-slate-400">Period Renewal:</p>
              <p className="font-medium text-white">
                {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            {sub.cancelAtPeriodEnd && (
              <p className="text-[11px] text-amber-400 font-medium">
                Plan will cancel at period end.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Daily Messages Quota */}
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Daily Messages
              </span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-2">
              {sub.dailyMessagesUsed}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {plan.dailyMessageLimit >= 9999 ? 'Unlimited' : plan.dailyMessageLimit}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">Resets every 24 hours at 00:00 UTC</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${messagesPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {plan.dailyMessageLimit >= 9999
                ? 'Unmetered high-capacity messaging active.'
                : `${Math.max(0, plan.dailyMessageLimit - sub.dailyMessagesUsed)} queries remaining today`}
            </p>
          </CardContent>
        </Card>

        {/* AI Video Credits */}
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Video Studio Credits
              </span>
              <Video className="h-4 w-4 text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-2">
              {sub.videoCreditsBalance}{' '}
              <span className="text-xs font-normal text-slate-400">credits</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {sub.tier === 'free'
                ? 'Upgrade to Pro to unlock video studio'
                : `${plan.videoCreditsMonthly} monthly allowance`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link href="/video">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Open AI Video Studio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Plan Actions & Cancellation */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Modify Subscription</p>
          <p className="text-xs text-slate-400">
            Switch your plan anytime. Prorated adjustments take effect immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sub.tier !== 'free' && (
            <Button variant="ghost" size="sm" onClick={handleCancelSubscription} className="text-xs text-slate-400 hover:text-red-400">
              Cancel Renewal
            </Button>
          )}
          <Link href="/pricing">
            <Button variant="primary" size="sm" className="text-xs">
              Browse All Plans
            </Button>
          </Link>
        </div>
      </div>

      {/* Billing & Invoices Table */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Billing History & Invoices</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <th className="p-3 font-semibold">Invoice ID</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Plan Description</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="p-3 font-mono text-[11px] text-blue-400">{inv.id}</td>
                    <td className="p-3 text-slate-400">{inv.date}</td>
                    <td className="p-3 font-medium text-white capitalize">
                      ApexAI {inv.tier} ({inv.interval}ly)
                    </td>
                    <td className="p-3 font-semibold text-white">${inv.amount}.00 USD</td>
                    <td className="p-3">
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20 uppercase">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{inv.provider}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No payment invoices recorded yet. Upgrades will generate downloadable receipts here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading subscription...</div>}>
      <SubscriptionDashboardContent />
    </Suspense>
  );
}
