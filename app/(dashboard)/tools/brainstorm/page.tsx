'use client';

import React from 'react';
import { ToolRunner } from '@/components/tools/ToolRunner';

export default function BrainstormToolPage() {
  const initialData = {
    challenge: 'Expand enterprise software sales to mid-market healthcare providers',
    industry: 'Healthcare Technology & Compliance',
    budgetOrScale: 'growth_scaleup',
    primaryGoal: 'Acquire 25 pilot clinic networks and achieve HIPAA proof-of-concept within 6 months',
  };

  return (
    <ToolRunner
      toolType="brainstorm"
      title="Strategic Brainstorming & Growth Engine"
      description="Develop high-potential business models, go-to-market strategies, and marketing campaigns."
      badge="Strategic Ideation"
      defaultTitle="Healthcare Market Expansion Strategy"
      initialFormData={initialData}
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
                Company Stage / Budget
              </label>
              <select
                value={(formData.budgetOrScale as string) || 'growth_scaleup'}
                onChange={(e) => setFormData((prev) => ({ ...prev, budgetOrScale: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="low_budget_startup">Early Bootstrapped Startup</option>
                <option value="growth_scaleup">Funded Growth Scaleup</option>
                <option value="enterprise">Established Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Primary Goal / KPI Metric
            </label>
            <input
              type="text"
              value={(formData.primaryGoal as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, primaryGoal: e.target.value }))}
              placeholder="e.g. 30% reduction in customer acquisition cost (CAC)"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </>
      )}
    />
  );
}
