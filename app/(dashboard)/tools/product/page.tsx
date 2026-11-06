'use client';

import React from 'react';
import { ToolRunner } from '@/components/tools/ToolRunner';

export default function ProductToolPage() {
  const initialData = {
    productName: 'ApexAI Enterprise Suite',
    category: 'Enterprise SaaS / AI Workflow Automation',
    targetAudience: 'Mid-sized e-commerce and professional service firms',
    features:
      'Multi-model AI integration, Supabase Row-Level-Security, automated email drafting, document summarization, team collaboration seats, sub-second latency streaming responses.',
    tone: 'premium',
    format: 'saas_landing',
  };

  return (
    <ToolRunner
      toolType="product"
      title="Product Description Copywriter"
      description="Translate features into irresistible benefits with high-converting buyer psychology."
      badge="E-Commerce & SaaS"
      defaultTitle="ApexAI Enterprise Product Copy"
      initialFormData={initialData}
      renderForm={(formData, setFormData) => (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Product / Service Name
            </label>
            <input
              type="text"
              value={(formData.productName as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
              placeholder="e.g. Ergonomic Smart Desk Pro"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Product Category / Industry
            </label>
            <input
              type="text"
              value={(formData.category as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. Office Ergonomics, SaaS B2B, Consumer Tech"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Brand Tone</label>
              <select
                value={(formData.tone as string) || 'premium'}
                onChange={(e) => setFormData((prev) => ({ ...prev, tone: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="premium">Luxury & Premium</option>
                <option value="innovative">Cutting-Edge & Modern</option>
                <option value="approachable">Warm & Approachable</option>
                <option value="bold">Bold & Disruptive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Format</label>
              <select
                value={(formData.format as string) || 'saas_landing'}
                onChange={(e) => setFormData((prev) => ({ ...prev, format: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="saas_landing">SaaS Landing Page (Hero + Pillars)</option>
                <option value="ecommerce">E-Commerce Product Page (Shopify)</option>
                <option value="amazon_listing">Amazon Listing (Title + 5 Bullets)</option>
                <option value="kickstarter">Crowdfunding / Launch Deck</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Ideal Customer Persona
            </label>
            <input
              type="text"
              value={(formData.targetAudience as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="e.g. Remote software engineers seeking ergonomic posture"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Key Features & Specs (Bulleted or Commas)
            </label>
            <textarea
              rows={4}
              value={(formData.features as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, features: e.target.value }))}
              placeholder="List raw dimensions, materials, integrations, speed, or guarantees..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </>
      )}
    />
  );
}
