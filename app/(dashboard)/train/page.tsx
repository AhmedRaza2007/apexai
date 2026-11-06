'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Activity,
  Flame,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { TrainingExample, ModelTuningConfig } from '@/lib/ai/native-engine';
import { formatDate } from '@/lib/utils';

export default function ModelTrainingStudioPage() {
  const [config, setConfig] = useState<ModelTuningConfig | null>(null);
  const [dataset, setDataset] = useState<TrainingExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Training form states
  const [category, setCategory] = useState<TrainingExample['category']>('general');
  const [promptInput, setPromptInput] = useState('');
  const [completionInput, setCompletionInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Playground test states
  const [testPrompt, setTestPrompt] = useState('How can we reduce churn for enterprise SaaS clients?');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const fetchTrainingData = async () => {
    try {
      const res = await fetch('/api/ai/train');
      if (res.ok) {
        const data = await res.json();
        setConfig({
          modelName: data.model,
          version: data.version,
          alignmentScore: data.alignmentScore,
          epochsCompleted: data.epochsCompleted,
          temperature: 0.7,
          customRules: data.customRules || [],
        });
        setDataset(data.dataset || []);
      }
    } catch (e) {
      console.warn('Failed to load training info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const handleTrainExample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !completionInput.trim()) return;

    setIsTraining(true);
    setSuccessBanner(null);

    try {
      const res = await fetch('/api/ai/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'example',
          category,
          prompt: promptInput.trim(),
          completion: completionInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner('Epoch completed: New training example aligned with model weights!');
        setPromptInput('');
        setCompletionInput('');
        await fetchTrainingData();
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err) {
      console.error('Training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleInput.trim()) return;

    setIsTraining(true);
    try {
      const res = await fetch('/api/ai/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rule',
          rule: ruleInput.trim(),
        }),
      });

      if (res.ok) {
        setSuccessBanner('Heuristic rule added to active inference pipeline.');
        setRuleInput('');
        await fetchTrainingData();
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err) {
      console.error('Rule error:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleDeleteExample = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/train?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDataset((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleTestInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim() || isTesting) return;

    setIsTesting(true);
    setTestResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testPrompt }],
          model: 'apexai-native-v2',
        }),
      });

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setTestResponse(fullText);
        }
      }
    } catch (err) {
      setTestResponse('Model inference error. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Model Training Studio</h1>
            <Badge variant="success" className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span>Native API Engine</span>
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Train and fine-tune your custom ApexAI model with domain instructions, company guidelines, and executive frameworks without third-party API dependencies.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Model Engine</CardTitle>
            <Cpu className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white truncate">
              {config?.modelName || 'ApexAI Native'}
            </div>
            <p className="mt-1 text-xs text-blue-400 font-mono">{config?.version || 'v2.4'}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Training Epochs</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">{config?.epochsCompleted || 48}</div>
            <p className="mt-1 text-xs text-slate-500">Fine-tuning iterations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Alignment Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">{config?.alignmentScore || 98.7}%</div>
            <p className="mt-1 text-xs text-slate-500">Executive rubric fidelity</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Domain Rules</CardTitle>
            <Layers className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">{config?.customRules?.length || 3}</div>
            <p className="mt-1 text-xs text-slate-500">Active heuristic gates</p>
          </CardContent>
        </Card>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Training Workspace: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Fine-tuning Forms */}
        <div className="lg:col-span-6 space-y-6">
          {/* Add Training Pair Card */}
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <span>Fine-Tune Model with Example Pair</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Train your model on high-performing responses so it matches your brand voice and workflows.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleTrainExample} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Specialized Domain Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TrainingExample['category'])}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="general">General Business Inquiries</option>
                    <option value="email">Executive Communications & Proposals</option>
                    <option value="social">High-Converting Social Posts</option>
                    <option value="product">Product Descriptions & Copy</option>
                    <option value="summary">Document Summaries & Takeaways</option>
                    <option value="strategy">Strategic Growth & Brainstorming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    User Query / Scenario Prompt
                  </label>
                  <input
                    type="text"
                    required
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="e.g. How should we follow up with an enterprise buyer who stalled?"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Executive Output / Completion
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={completionInput}
                    onChange={(e) => setCompletionInput(e.target.value)}
                    placeholder="Provide the ideal structured markdown response your model should generate..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  className="w-full"
                  isLoading={isTraining}
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  {isTraining ? 'Training Weights...' : 'Train Model Weight'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Add Heuristic Rule Card */}
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Add Behavioral Heuristic Rule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAddRule} className="space-y-3">
                <input
                  type="text"
                  required
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  placeholder="e.g. Always structure SaaS comparisons with a pros/cons table."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Inject Rule
                </Button>
              </form>

              {/* Active Rules List */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Behavioral Rules:
                </p>
                {config?.customRules?.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded bg-slate-950/80 p-2 text-xs text-slate-300 border border-slate-800/80"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Model Testing Playground */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="flex flex-col h-full border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-400" />
                  <span>Model Playground Tester</span>
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Verify how your trained model responds to business scenarios in real time.
                </p>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-5 flex flex-col justify-between space-y-4">
              <form onSubmit={handleTestInference} className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Enter query to test model..."
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={isTesting || !testPrompt.trim()}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Test
                  </Button>
                </div>
              </form>

              {/* Output Display Area */}
              <div className="flex-1 min-h-[320px] rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200 overflow-y-auto">
                {isTesting && !testResponse ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-2 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <p>Executing native model inference...</p>
                  </div>
                ) : testResponse ? (
                  <MarkdownRenderer content={testResponse} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                    <Cpu className="h-8 w-8 text-slate-700 mb-2" />
                    <p className="font-medium text-slate-400">Inference Ready</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Click &quot;Test&quot; above to evaluate your fine-tuned model.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trained Knowledge Base Datasets Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Fine-Tuned Domain Datasets</h3>
            <p className="text-xs text-slate-400">
              Active training pairs integrated into your model&apos;s retrieval and generation pipeline.
            </p>
          </div>
          <Badge variant="info">{dataset.length} Examples</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {dataset.map((item) => (
            <Card key={item.id} className="border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="info" className="capitalize text-[10px]">
                  {item.category}
                </Badge>
                <button
                  onClick={() => handleDeleteExample(item.id)}
                  aria-label="Remove training example"
                  className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-white">Prompt:</p>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{item.prompt}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-white">Trained Output:</p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded border border-slate-800/80 line-clamp-3">
                  {item.completion.replace(/[#*`]/g, '')}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
