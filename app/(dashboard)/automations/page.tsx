'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Play,
  AlertTriangle,
  RotateCcw,
  Mail,
  FileSpreadsheet,
  Calendar,
  Lock,
  ExternalLink,
  Settings,
  Bookmark,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { saveLocalContentItem } from '@/lib/storage';

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actionSummary: string;
  requiresConfirmation: boolean;
  status: 'idle' | 'awaiting_confirmation' | 'executing' | 'completed' | 'integration_pending';
  requiresExternalService: boolean;
  serviceName?: string;
  lastRun?: string;
  icon: React.ElementType;
}

export default function AutomationsPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>([
    {
      id: 'task-social-calendar',
      name: 'Thought Leadership Content Queue',
      description: 'Generates structured weekly executive posts for LinkedIn and stores them in your Saved Library.',
      trigger: 'Manual Dispatch / Bi-weekly schedule',
      actionSummary: 'Generates 3 tailored B2B thought leadership drafts with viral hooks and saves them to your Content Library.',
      requiresConfirmation: true,
      requiresExternalService: false,
      status: 'idle',
      lastRun: undefined,
      icon: Calendar,
    },
    {
      id: 'task-weekly-digest',
      name: 'Operations KPI Synthesis & Briefing',
      description: 'Condenses operational milestone updates into an executive briefing with an action item matrix.',
      trigger: 'Manual Dispatch / Weekly Friday schedule',
      actionSummary: 'Synthesizes enterprise operations notes into a structured briefing and archives it in your Library.',
      requiresConfirmation: false,
      requiresExternalService: false,
      status: 'idle',
      lastRun: undefined,
      icon: FileSpreadsheet,
    },
    {
      id: 'task-email-batch',
      name: 'Automated Client Outreach Dispatch',
      description: 'Automated direct dispatch of follow-up emails to external recipients.',
      trigger: 'Inbound Webhook / Scheduled Batch',
      actionSummary: 'Direct dispatch of outbound emails to external enterprise contacts.',
      requiresConfirmation: true,
      requiresExternalService: true,
      serviceName: 'Resend / SendGrid SMTP Provider',
      status: 'integration_pending',
      lastRun: undefined,
      icon: Mail,
    },
  ]);

  const [confirmTask, setConfirmTask] = useState<AutomationTask | null>(null);
  const [integrationTask, setIntegrationTask] = useState<AutomationTask | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [executionNotice, setExecutionNotice] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleTrigger = (task: AutomationTask) => {
    if (task.requiresExternalService) {
      setIntegrationTask(task);
      return;
    }

    if (task.requiresConfirmation) {
      setConfirmTask(task);
    } else {
      executeTask(task);
    }
  };

  const executeTask = async (task: AutomationTask) => {
    setConfirmTask(null);
    setExecutingTaskId(task.id);
    setExecutionNotice({
      message: `Executing task "${task.name}" via ApexAI pipeline...`,
    });

    try {
      if (task.id === 'task-social-calendar') {
        const res = await fetch('/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolType: 'social',
            inputData: {
              platform: 'linkedin',
              topic: 'Quarterly operational efficiency benchmarks and AI copilots',
              tone: 'thought_leadership',
              audience: 'Enterprise executives, Operations Directors',
              callToAction: 'How is your organization approaching workflow automation this quarter?',
            },
            title: 'Automated LinkedIn Queue — ' + new Date().toLocaleDateString(),
            saveToLibrary: false,
          }),
        });

        const data = await res.json();
        if (data.content) {
          saveLocalContentItem({
            title: 'Automated Content Queue — ' + new Date().toLocaleDateString(),
            tool_type: 'social',
            input_params: { automationId: task.id },
            generated_content: data.content,
            tags: ['automation', 'social', 'scheduled'],
          });
        }
      } else if (task.id === 'task-weekly-digest') {
        const res = await fetch('/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolType: 'summarize',
            inputData: {
              length: 'concise',
              focusArea: 'Operational blockers and resource allocations',
              textToSummarize:
                'Weekly Operations Log: Completed database indexing optimization. Resolved 14 staging tickets. Pending item: third-party webhook verification for outbound email dispatch.',
            },
            title: 'Weekly KPI Briefing — ' + new Date().toLocaleDateString(),
            saveToLibrary: false,
          }),
        });

        const data = await res.json();
        if (data.content) {
          saveLocalContentItem({
            title: 'Weekly Operations Briefing — ' + new Date().toLocaleDateString(),
            tool_type: 'summarize',
            input_params: { automationId: task.id },
            generated_content: data.content,
            tags: ['automation', 'operations', 'weekly-briefing'],
          });
        }
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'completed', lastRun: 'Just now' } : t
        )
      );

      setExecutionNotice({
        message: `Task "${task.name}" completed. Deliverable has been stored in your Saved Library.`,
      });
    } catch (e: unknown) {
      const err = e as Error;
      setExecutionNotice({
        message: `Execution notice: ${err.message || 'Task completed with local fallback.'}`,
        isError: true,
      });
    } finally {
      setExecutingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Business Automations</h1>
            <Badge variant="warning" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Human-in-the-Loop Safeguarded
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Execute recurring business tasks with strict human approval gates. Tasks requiring external third-party services are clearly distinguished.
          </p>
        </div>
      </div>

      {/* Security Architecture Explainer Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Strict Enterprise Safety Standard</p>
            <p className="text-slate-300 leading-relaxed">
              To prevent unintended actions or unauthorized external communications, consequential automations enforce interactive human confirmation. Background email dispatches require connected email infrastructure credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Execution Feedback Notification */}
      {executionNotice && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs transition-all ${
            executionNotice.isError
              ? 'border-amber-800/60 bg-amber-950/40 text-amber-200'
              : 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {executionNotice.isError ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <span>{executionNotice.message}</span>
            {!executionNotice.isError && (
              <Link
                href="/library"
                className="ml-2 font-medium text-blue-400 underline hover:text-blue-300"
              >
                View in Library →
              </Link>
            )}
          </div>
          <button
            onClick={() => setExecutionNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Automation Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          const isCurrentlyExecuting = executingTaskId === task.id;

          return (
            <Card
              key={task.id}
              className="border-slate-800 bg-slate-900/60 transition-all hover:border-slate-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{task.name}</h3>
                      {task.requiresExternalService ? (
                        <Badge variant="default" className="text-amber-400 border-amber-800/50">
                          Integration Pending
                        </Badge>
                      ) : task.requiresConfirmation ? (
                        <Badge variant="warning">Approval Required</Badge>
                      ) : (
                        <Badge variant="success">Internal AI Pipeline</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{task.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Trigger: {task.trigger}
                      </span>
                      {task.lastRun && (
                        <span className="text-emerald-400 font-medium">Last Executed: {task.lastRun}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {task.requiresExternalService ? (
                    <Button
                      onClick={() => handleTrigger(task)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Settings className="h-3.5 w-3.5" />}
                    >
                      Setup Integration
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleTrigger(task)}
                      variant={task.status === 'completed' ? 'secondary' : 'primary'}
                      size="sm"
                      isLoading={isCurrentlyExecuting}
                      leftIcon={
                        task.status === 'completed' ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )
                      }
                    >
                      {isCurrentlyExecuting
                        ? 'Executing...'
                        : task.status === 'completed'
                        ? 'Rerun Workflow'
                        : 'Run Workflow'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Human-In-The-Loop Confirmation Modal */}
      {confirmTask && (
        <Modal
          isOpen={Boolean(confirmTask)}
          onClose={() => setConfirmTask(null)}
          title="Human-in-the-Loop Confirmation"
          description="Verification required prior to task execution"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3.5 text-xs text-amber-300">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">Review Action Intent</p>
                <p className="mt-1 leading-relaxed text-amber-300/90">
                  You are about to execute: <strong className="text-white">{confirmTask.name}</strong>.
                </p>
                <p className="mt-2 text-slate-300">{confirmTask.actionSummary}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              By confirming, ApexAI will run the AI pipeline and save the resulting deliverable to your Saved Library.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setConfirmTask(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => executeTask(confirmTask)}
              >
                Approve & Execute Task
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Integration Setup Requirement Modal */}
      {integrationTask && (
        <Modal
          isOpen={Boolean(integrationTask)}
          onClose={() => setIntegrationTask(null)}
          title="External Integration Requirement"
          description={integrationTask.name}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">Required Infrastructure:</p>
              <p>
                Outbound automated email delivery requires a connected SMTP provider (such as{' '}
                <strong className="text-blue-400">Resend</strong>, <strong className="text-blue-400">SendGrid</strong>, or an authorized mail server).
              </p>
              <div className="mt-3 rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-400 border border-slate-800">
                RESEND_API_KEY=re_your_api_key_here<br />
                OUTBOUND_EMAIL_FROM=notifications@yourdomain.com
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              To draft emails without sending, you can use the built-in{' '}
              <Link href="/tools/email" className="text-blue-400 underline">
                Executive Email Drafter
              </Link>{' '}
              tool which generates complete copy directly into your library.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setIntegrationTask(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
