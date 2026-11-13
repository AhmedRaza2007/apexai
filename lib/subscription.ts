// ApexAI Subscription & Usage Management Engine
// Supports Free, Pro, and Business tiers with daily message limits, video credits, and multi-gateway billing

export type SubscriptionTier = 'free' | 'pro' | 'business';
export type BillingInterval = 'month' | 'year';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanDefinition {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number; // billed annually
  dailyMessageLimit: number; // e.g. 15, 250, 99999 (unlimited)
  videoCreditsMonthly: number; // e.g. 0, 50, 200
  allowedModelTiers: Array<'free' | 'pro' | 'business'>;
  features: PlanFeature[];
  badge?: string;
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Core intelligence for casual users and explorers.',
    priceMonthly: 0,
    priceYearly: 0,
    dailyMessageLimit: 15,
    videoCreditsMonthly: 0,
    allowedModelTiers: ['free'],
    features: [
      { text: '15 AI messages per day', included: true },
      { text: 'Google Gemini 1.5 Flash & OpenRouter Free models', included: true },
      { text: 'ApexAI Autonomous Native Engine', included: true },
      { text: 'Standard Business Tools (Email, Social, Copy)', included: true },
      { text: 'Local conversation history', included: true },
      { text: 'AI Video Studio access & credits', included: false },
      { text: 'Flagship GPT-4o & Gemini Pro models', included: false },
      { text: 'Custom AI Knowledge Base & RAG', included: false },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Ideal for professionals, founders, and power creators.',
    priceMonthly: 19,
    priceYearly: 190, // ~16% discount
    dailyMessageLimit: 250,
    videoCreditsMonthly: 50,
    allowedModelTiers: ['free', 'pro'],
    popular: true,
    badge: 'Most Popular',
    features: [
      { text: '250 AI messages per day', included: true, highlight: true },
      { text: 'Flagship GPT-4o & Google Gemini 1.5 Pro', included: true },
      { text: '50 Video Generation Credits / month', included: true, highlight: true },
      { text: 'AI Video Studio (Text-to-Video & Image-to-Video)', included: true },
      { text: 'Custom AI Knowledge Studio & Document RAG', included: true },
      { text: 'Priority low-latency inference', included: true },
      { text: 'Cloud Supabase synchronization', included: true },
      { text: 'Dedicated team workspace', included: false },
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'Maximum leverage, unlimited bandwidth, and shared workspaces.',
    priceMonthly: 49,
    priceYearly: 490,
    dailyMessageLimit: 9999, // effectively unlimited
    videoCreditsMonthly: 200,
    allowedModelTiers: ['free', 'pro', 'business'],
    badge: 'Enterprise Grade',
    features: [
      { text: 'Unlimited daily AI messages', included: true, highlight: true },
      { text: 'All AI models with dedicated high-concurrency routing', included: true },
      { text: '200 Video Generation Credits / month', included: true, highlight: true },
      { text: 'Full AI Video Studio with 1080p rendering', included: true },
      { text: 'Enterprise Knowledge Studio (Unlimited document uploads)', included: true },
      { text: 'Team workspaces and shared prompt library', included: true },
      { text: 'Automations & custom workflow webhooks', included: true },
      { text: '24/7 Priority SLA support', included: true },
    ],
  },
};

export interface UserSubscriptionState {
  userId: string;
  tier: SubscriptionTier;
  interval: BillingInterval;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: 'lemon_squeezy' | 'stripe' | 'paddle' | 'sandbox';
  dailyMessagesUsed: number;
  lastUsageDate: string; // YYYY-MM-DD
  videoCreditsBalance: number;
}

const STORAGE_KEY_SUBSCRIPTION = 'apexai_user_subscription';
const STORAGE_KEY_INVOICES = 'apexai_user_invoices';

export interface InvoiceRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'refunded';
  tier: SubscriptionTier;
  interval: BillingInterval;
  provider: string;
  date: string;
  receiptUrl?: string;
}

// Get user subscription state from client storage or Supabase fallback
export function getClientSubscription(): UserSubscriptionState {
  if (typeof window === 'undefined') {
    return createDefaultSubscription('guest');
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
    if (raw) {
      const parsed: UserSubscriptionState = JSON.parse(raw);
      // Reset daily usage counter if on a new calendar day
      const today = new Date().toISOString().slice(0, 10);
      if (parsed.lastUsageDate !== today) {
        parsed.dailyMessagesUsed = 0;
        parsed.lastUsageDate = today;
        localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read subscription from localStorage:', e);
  }

  const defaultSub = createDefaultSubscription('local-user');
  saveClientSubscription(defaultSub);
  return defaultSub;
}

export function saveClientSubscription(sub: UserSubscriptionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(sub));
  } catch (e) {
    console.warn('Could not save subscription to localStorage:', e);
  }
}

export function createDefaultSubscription(userId: string): UserSubscriptionState {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    userId,
    tier: 'free',
    interval: 'month',
    status: 'active',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    cancelAtPeriodEnd: false,
    paymentProvider: 'sandbox',
    dailyMessagesUsed: 0,
    lastUsageDate: now.toISOString().slice(0, 10),
    videoCreditsBalance: 0,
  };
}

// Client helper: increment message count and check if limit reached
export function checkAndIncrementDailyUsage(): { allowed: boolean; remaining: number; limit: number } {
  const sub = getClientSubscription();
  const plan = SUBSCRIPTION_PLANS[sub.tier];
  const today = new Date().toISOString().slice(0, 10);

  if (sub.lastUsageDate !== today) {
    sub.dailyMessagesUsed = 0;
    sub.lastUsageDate = today;
  }

  if (sub.dailyMessagesUsed >= plan.dailyMessageLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: plan.dailyMessageLimit,
    };
  }

  sub.dailyMessagesUsed += 1;
  saveClientSubscription(sub);

  return {
    allowed: true,
    remaining: Math.max(0, plan.dailyMessageLimit - sub.dailyMessagesUsed),
    limit: plan.dailyMessageLimit,
  };
}

// Client helper: deduct video credits
export function deductVideoCredits(amount: number): { success: boolean; remaining: number; error?: string } {
  const sub = getClientSubscription();
  if (sub.videoCreditsBalance < amount) {
    return {
      success: false,
      remaining: sub.videoCreditsBalance,
      error: `Insufficient video credits. You need ${amount} credits, but have ${sub.videoCreditsBalance} remaining. Upgrade to Pro or Business for more credits.`,
    };
  }

  sub.videoCreditsBalance -= amount;
  saveClientSubscription(sub);

  return {
    success: true,
    remaining: sub.videoCreditsBalance,
  };
}

// Manage user invoices for the subscription dashboard
export function getClientInvoices(): InvoiceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read invoices:', e);
  }
  return [];
}

export function addClientInvoice(invoice: InvoiceRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getClientInvoices();
    list.unshift(invoice);
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save invoice:', e);
  }
}
