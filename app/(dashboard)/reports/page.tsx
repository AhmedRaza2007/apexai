'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Share2,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Building2,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import {
  ExecutiveReport,
  ReportParameters,
  REPORT_FORMATS,
  getLocalReports,
  saveLocalReport,
} from '@/lib/ai/reports';
import { SUPPORTED_MODELS, getModelDescriptor } from '@/lib/ai/providers';

export default function ReportsStudioPage() {
  const [topic, setTopic] = useState('Enterprise Expansion Strategy into North American HealthTech (SOC2 & HIPAA Compliant)');
  const [industry, setIndustry] = useState('Enterprise B2B SaaS & HealthTech');
  const [targetAudience, setTargetAudience] = useState('Board of Directors & Executive Investment Committee');
  const [format, setFormat] = useState('strategic_playbook');
  const [depth, setDepth] = useState<'comprehensive' | 'board_briefing'>('comprehensive');
  const [selectedModel, setSelectedModel] = useState('apexai-native-v2');

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<ExecutiveReport | null>(null);
  const [savedReports, setSavedReports] = useState<ExecutiveReport[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const list = getLocalReports();
    setSavedReports(list);
    if (list.length > 0) {
      setActiveReport(list[0]);
    }
  }, []);

  const handleGenerateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setErrorNotice(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          industry,
          targetAudience,
          format,
          depth,
          model: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate executive report.');
      }

      const report: ExecutiveReport = data.report;
      setActiveReport(report);
      saveLocalReport(report);
      setSavedReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorNotice(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const presetTopics = [
    'SaaS Unit Economics & Churn Reduction Playbook',
    'Competitor Vulnerability Audit: Stripe vs Adyen in EU',
    'AI Multi-Agent Workflow Deployment Governance',
    'Series A Commercial Due Diligence Memo',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileText className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Executive Report Architect</h1>
            <Badge variant="info">Flagship US AI</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Synthesize exhaustive, board-level strategic briefs, due diligence audits, and market landscape analyses.
          </p>
        </div>

        {activeReport && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadMarkdown}
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Export .MD
            </Button>
            <Button
              onClick={handlePrintPDF}
              variant="primary"
              size="sm"
              leftIcon={<Printer className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Export to PDF
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorNotice && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-200 print:hidden">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Generation Notice</p>
            <p className="leading-relaxed text-amber-200/90">{errorNotice}</p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Generator Parameters (Left) & Report Reader (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Parameter Controls */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Report Specifications</CardTitle>
              <CardDescription className="text-xs">
                Configure your strategic scope, target readership, and analytical framework
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Executive Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetTopics.map((pt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopic(pt)}
                      className="rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors"
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Strategic Topic / Core Thesis
                </label>
                <textarea
                  rows={3}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter strategic objective, acquisition target, or market thesis..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Format Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-300">Document Framework</label>
                <div className="space-y-1.5">
                  {REPORT_FORMATS.map((rf) => (
                    <button
                      key={rf.id}
                      type="button"
                      onClick={() => setFormat(rf.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                        format === rf.id
                          ? 'border-blue-500 bg-blue-600/15 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-xs">{rf.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{rf.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry & Readership */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Target Readership</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Inference Model Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Reasoning Engine</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Anthropic US)</option>
                  <option value="gpt-4o">GPT-4o Omni (OpenAI US)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google Cloud US)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (OpenRouter Free)</option>
                  <option value="apexai-native-v2">ApexAI Native Model (Offline & Free)</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-800">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !topic.trim()}
                  variant="primary"
                  size="md"
                  className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Synthesizing Multi-Section Report...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Executive Report
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Reports History */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Archived Reports ({savedReports.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedReports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                    activeReport?.id === rep.id
                      ? 'border-blue-500/50 bg-blue-600/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-white truncate">{rep.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {rep.industry} • {new Date(rep.createdAt).toLocaleDateString()} • {rep.modelUsed}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Complete Report Reader & Print View */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
            {/* Report Header */}
            <div className="border-b border-slate-800/80 bg-slate-950/80 p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="info" className="text-[10px] uppercase tracking-wider">
                  {activeReport ? activeReport.format.replace(/_/g, ' ') : 'Executive Briefing'}
                </Badge>
                {activeReport && (
                  <span className="text-[11px] text-slate-400">
                    Engineered by <strong>{activeReport.modelUsed}</strong> • {new Date(activeReport.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                {activeReport ? activeReport.title : 'Ready to Synthesize Report'}
              </h2>

              {activeReport && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <span><strong>Industry:</strong> {activeReport.industry}</span>
                  <span><strong>Readership:</strong> {activeReport.targetAudience}</span>
                </div>
              )}
            </div>

            {/* Document Content View */}
            <CardContent className="p-6 sm:p-8 space-y-6">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 animate-pulse">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Synthesizing Executive Architecture...</p>
                    <p className="text-xs text-slate-400">Structuring market moats, financial metrics, and operational roadmap</p>
                  </div>
                </div>
              ) : activeReport ? (
                <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={activeReport.markdownContent} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-2">
                  <FileText className="h-10 w-10 text-slate-600" />
                  <p className="text-xs">Select options on the left and click Generate to produce a full report.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
