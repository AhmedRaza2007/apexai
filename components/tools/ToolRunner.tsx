'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Share2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToolType } from '@/lib/ai/prompts';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface ToolRunnerProps {
  toolType: ToolType;
  title: string;
  description: string;
  badge: string;
  defaultTitle: string;
  renderForm: (
    formData: Record<string, unknown>,
    setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  ) => React.ReactNode;
  initialFormData: Record<string, unknown>;
}

export function ToolRunner({
  toolType,
  title,
  description,
  badge,
  defaultTitle,
  renderForm,
  initialFormData,
}: ToolRunnerProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialFormData);
  const [outputTitle, setOutputTitle] = useState(defaultTitle);
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType,
          inputData: formData,
          title: outputTitle,
          saveToLibrary: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate output.');
      }

      setGeneratedOutput(data.content);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedOutput || isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType,
          inputData: formData,
          title: outputTitle || `${toolType} output`,
          saveToLibrary: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save to content library.');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            <Badge variant="info">{badge}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-800/60 bg-red-950/40 p-4 text-xs text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Generation Error</p>
            <p className="mt-1 leading-relaxed text-red-200/90">{errorMessage}</p>
            <p className="mt-2 text-slate-400">
              Ensure <code className="text-amber-300">OPENAI_API_KEY</code> is correctly set in your environment.
            </p>
          </div>
        </div>
      )}

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-5">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-white">Input Parameters</CardTitle>
              <CardDescription>Configure the requirements for this generation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Deliverable Name / Title
                  </label>
                  <input
                    type="text"
                    value={outputTitle}
                    onChange={(e) => setOutputTitle(e.target.value)}
                    placeholder="e.g. Q4 Client Follow-up"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {renderForm(formData, setFormData)}

                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  className="w-full mt-4"
                  isLoading={isGenerating}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Output Viewer (Right) */}
        <div className="lg:col-span-7">
          <Card className="flex flex-col h-full border-slate-800 bg-slate-900/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <CardTitle className="text-base text-white">Generated Deliverable</CardTitle>
                <CardDescription>Review, refine, and store your business copy</CardDescription>
              </div>

              {generatedOutput && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    leftIcon={
                      copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>

                  <Button
                    onClick={handleSaveToLibrary}
                    variant="secondary"
                    size="sm"
                    isLoading={isSaving}
                    leftIcon={
                      savedSuccess ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )
                    }
                  >
                    {savedSuccess ? 'Saved to Library' : 'Save'}
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-1 p-5">
              {isGenerating ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm font-medium text-slate-300">Crafting executive copy...</p>
                  <p className="text-xs text-slate-500">
                    Applying strategic business heuristics and formatting guidelines
                  </p>
                </div>
              ) : generatedOutput ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-blue-600/30">
                    {generatedOutput}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <span>
                      Words: {generatedOutput.split(/\s+/).filter(Boolean).length} | Characters:{' '}
                      {generatedOutput.length}
                    </span>
                    <span>Ready for business deployment</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 p-8 text-center text-slate-500">
                  <Sparkles className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-400">No output generated yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fill in the parameters on the left and click &quot;Generate with AI&quot;.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
