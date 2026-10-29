'use client';

import React from 'react';
import { ToolRunner } from '@/components/tools/ToolRunner';

export default function EmailToolPage() {
  const initialData = {
    recipient: 'Prospective Enterprise Client',
    purpose: 'Partnership & Product Demo Proposal',
    tone: 'professional',
    senderName: 'Alex Morgan, Head of Business Development',
    keyPoints:
      'We recently launched ApexAI to automate internal business workflows. Mention that our enterprise solution reduces manual task time by 40%. Request a brief 15-minute introductory call next Tuesday or Wednesday.',
  };

  return (
    <ToolRunner
      toolType="email"
      title="Executive Email Drafter"
      description="Craft persuasive, polished business communications with high response rates."
      badge="High Response"
      defaultTitle="Enterprise Demo Proposal"
      initialFormData={initialData}
      renderForm={(formData, setFormData) => (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Recipient Role / Company
            </label>
            <input
              type="text"
              value={(formData.recipient as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, recipient: e.target.value }))}
              placeholder="e.g. Chief Operating Officer, Acme Corp"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Core Objective / Purpose
            </label>
            <input
              type="text"
              value={(formData.purpose as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
              placeholder="e.g. Follow-up after introductory coffee chat"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Tone</label>
              <select
                value={(formData.tone as string) || 'professional'}
                onChange={(e) => setFormData((prev) => ({ ...prev, tone: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="professional">Professional & Direct</option>
                <option value="persuasive">Persuasive Pitch</option>
                <option value="friendly">Warm & Collaborative</option>
                <option value="urgent">Urgent Action Required</option>
                <option value="apologetic">Diplomatic & Apologetic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sign-off / Sender
              </label>
              <input
                type="text"
                value={(formData.senderName as string) || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, senderName: e.target.value }))}
                placeholder="Your Name & Title"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Key Points & Context
            </label>
            <textarea
              rows={4}
              value={(formData.keyPoints as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, keyPoints: e.target.value }))}
              placeholder="Outline specific metrics, dates, or topics to include..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </>
      )}
    />
  );
}
