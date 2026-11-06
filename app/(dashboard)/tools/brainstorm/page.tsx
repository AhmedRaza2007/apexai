'use client';

import React from 'react';
import { ToolRunner } from '@/components/tools/ToolRunner';

export default function BrainstormToolPage() {
  const initialData = {
    challenge: 'Expand enterprise software sales to mid-market healthcare providers',
    industry: 'Healthcare Technology & Compliance',
    budgetOrScale: 'growth_scaleup',
    dimension: 'revenue_models',
    primaryGoal: 'Acquire 25 pilot clinic networks and achieve HIPAA proof-of-concept within 6 months',
  };

  return (
    <ToolRunner
      toolType="brainstorm"
      title="Strategic Brainstorming & Growth Engine"
      description="Develop high-potential business models, go-to-market strategies, and marketing campaigns with structured frameworks."
      badge="Strategic Ideation"
      defaultTitle="Healthcare Market Expansion Strategy"
      initialFormData={initialData}
      safetyNotice="Analytical Notice: AI-generated suggestions represent hypotheses. Validate all concepts with primary user discovery, financial unit economics, and legal compliance before capital deployment."
      renderForm={(formData, setFormData) => (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Core Strategic Challenge
            </label>
            <input
              type="text"
              value={(formData.challenge as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, challenge: e.target.value }))}
              placeholder="e.g. Increase customer retention for subscription box service"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Industry / Domain
              </label>
              <input
                type="text"
                value={(formData.industry as string) || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                placeholder="e.g. Fintech, Healthcare, D2C"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Focus Dimension
              </label>
              <select
                value={(formData.dimension as string) || 'revenue_models'}
                onChange={(e) => setFormData((prev) => ({ ...prev, dimension: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="revenue_models">New Revenue Models & Monetization</option>
                <option value="gtm_channels">GTM Channels & Virality</option>
                <option value="product_differentiation">Product Differentiation & Moats</option>
                <option value="cost_optimization">Operational Efficiency & Automation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Company Stage / Budget
              </label>
              <select
                value={(formData.budgetOrScale as string) || 'growth_scaleup'}
                onChange={(e) => setFormData((prev) => ({ ...prev, budgetOrScale: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="low_budget_startup">Bootstrapped Startup ($0 - $10k)</option>
                <option value="growth_scaleup">Funded Scaleup ($50k - $250k)</option>
                <option value="enterprise">Established Enterprise ($500k+)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Primary KPI Target
              </label>
              <input
                type="text"
                value={(formData.primaryGoal as string) || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryGoal: e.target.value }))}
                placeholder="e.g. 30% reduction in CAC"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}
    />
  );
}
