'use client';

import React from 'react';
import { ToolRunner } from '@/components/tools/ToolRunner';

export default function SummarizeToolPage() {
  const initialData = {
    length: 'concise',
    focusArea: 'Strategic milestones, deliverables, and financial implications',
    textToSummarize: `Executive Briefing — Q3 Operations & Technology Transition
Over the third quarter, the enterprise finalized the migration of our customer data warehouse to a partitioned PostgreSQL architecture hosted on Supabase, reducing query response times by 32% and cutting infrastructure expenses by $14,000 monthly. 

Simultaneously, customer support volume expanded 45% following the launch of the mobile application. While user ratings remained high at 4.7 stars, average time-to-first-response slipped from 12 minutes to 48 minutes during peak hours. In response, leadership has initiated a pilot program for an AI-assisted copilot to triage incoming support tickets and assist representatives with draft solutions. 

Action items for Q4 include:
1. Finalizing testing for the automated triage pipeline by November 15 (Owner: Sarah Jenkins).
2. Hiring two senior DevOps engineers to oversee multi-region failover (Owner: Marcus Vance).
3. Reviewing cloud vendor licensing commitments before annual renewal (Owner: Financial Planning Team).`,
  };

  return (
    <ToolRunner
      toolType="summarize"
      title="Executive Document & Text Summarizer"
      description="Extract key takeaways, executive summaries, and action item owners from any briefing or memo."
      badge="Information Synthesis"
      defaultTitle="Q3 Operations Transition Summary"
      initialFormData={initialData}
      renderForm={(formData, setFormData) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Summary Length
              </label>
              <select
                value={(formData.length as string) || 'concise'}
                onChange={(e) => setFormData((prev) => ({ ...prev, length: e.target.value }))}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="concise">Concise Executive Briefing</option>
                <option value="detailed">Comprehensive Analysis</option>
                <option value="bullet_points_only">Action Items & Highlights Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Specific Focus
              </label>
              <input
                type="text"
                value={(formData.focusArea as string) || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, focusArea: e.target.value }))}
                placeholder="e.g. Financial impact, Action items"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Source Text or Document Content
            </label>
            <textarea
              rows={8}
              value={(formData.textToSummarize as string) || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, textToSummarize: e.target.value }))}
              placeholder="Paste memo, report, contract clauses, or transcript here..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </>
      )}
    />
  );
}
