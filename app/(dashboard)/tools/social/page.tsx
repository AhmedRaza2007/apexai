'use client';

import React from 'react';
import { ToolRunner } from '@/components/tools/ToolRunner';

export default function SocialToolPage() {
  const initialData = {
    platform: 'linkedin',
    topic: 'How AI business assistants transform team productivity without eliminating jobs',
    tone: 'thought_leadership',
    audience: 'Startup founders, C-level executives, and operations managers',
    language: 'English',
    hashtagStyle: 'trending',
    callToAction: 'How is your company integrating AI into daily routines? Drop your thoughts below.',
  };

  return (
    <ToolRunner
      toolType="social"
      title="Social Media Caption Creator"
      description="Generate viral hooks, thought leadership frameworks, and platform-optimized copy."
      badge="Multi-Platform"
      defaultTitle="AI Productivity Post"
      initialFormData={initialData}
      renderForm={(formData, setFormData) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Platform</label>
              <select
                value={(formData.platform as string) || 'linkedin'}
                onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="linkedin">LinkedIn (Executive / B2B)</option>
                <option value="twitter">Twitter / X (Thread or Post)</option>
                <option value="instagram">Instagram Caption</option>
                <option value="facebook">Facebook Business Update</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Post Tone</label>
              <select
                value={(formData.tone as string) || 'thought_leadership'}
                onChange={(e) => setFormData((prev) => ({ ...prev, tone: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="thought_leadership">Thought Leadership</option>
                <option value="engaging">Conversational & Engaging</option>
                <option value="promotional">Product Launch / Promotional</option>
                <option value="storytelling">Vulnerable Storytelling</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Language</label>
              <select
                value={(formData.language as string) || 'English'}
                onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Portuguese">Portuguese</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Hashtags</label>
              <select
                value={(formData.hashtagStyle as string) || 'trending'}
                onChange={(e) => setFormData((prev) => ({ ...prev, hashtagStyle: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="trending">Trending & Algorithm-Targeted (5-7)</option>
                <option value="minimal">Minimalist (2-3)</option>
                <option value="none">No Hashtags</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Core Topic / Lesson
            </label>
            <input
              type="text"
              value={(formData.topic as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g. 3 lessons learned scaling ARR to $1M"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={(formData.audience as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value }))}
              placeholder="e.g. B2B Founders, CMOs, Product Designers"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Call-To-Action (CTA)
            </label>
            <input
              type="text"
              value={(formData.callToAction as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, callToAction: e.target.value }))}
              placeholder="e.g. Link in comments to register for the live demo"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </>
      )}
    />
  );
}
