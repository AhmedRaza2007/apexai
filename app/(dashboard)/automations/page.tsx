'use client';

import React, { useState } from 'react';
import {
  Zap,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Play,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Mail,
  FileSpreadsheet,
  Calendar,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actionSummary: string;
  requiresConfirmation: boolean;
  status: 'idle' | 'awaiting_confirmation' | 'executing' | 'completed';
  lastRun?: string;
  icon: React.ElementType;
}

export default function AutomationsPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>([
    {
      id: 'task-email-batch',
      name: 'Executive Client Outreach Batch',
      description: 'Prepares personalized follow-up emails for high-priority inbound enterprise leads.',
      trigger: 'Manual Dispatch / Scheduled Monday 9:00 AM',
      actionSummary: 'Prepares 12 personalized outreach drafts. High-consequence: requires human sign-off before dispatch.',
      requiresConfirmation: true,
      status: 'idle',
      lastRun: 'Oct 27, 2026, 09:15 AM',
      icon: Mail,
    },
    {
      id: 'task-weekly-digest',
      name: 'Weekly Operations KPI Synthesis',
      description: 'Aggregates team performance logs and summarizes blocker items for the leadership meeting.',
      trigger: 'Scheduled Weekly on Friday 4:00 PM',
      actionSummary: 'Extracts critical blockers and drafts executive briefing document.',
      requiresConfirmation: false,
      status: 'idle',
      lastRun: 'Oct 24, 2026, 04:00 PM',
      icon: FileSpreadsheet,
    },
    {
      id: 'task-social-calendar',
      name: 'Thought Leadership Content Queue',
      description: 'Generates 3 weekly draft posts for LinkedIn based on recent company milestone updates.',
      trigger: 'Bi-weekly on Wednesday',
      actionSummary: 'Generates 3 tailored LinkedIn drafts and saves them to the Content Library.',
      requiresConfirmation: true,
      status: 'idle',
      lastRun: 'Oct 22, 2026, 11:30 AM',
      icon: Calendar,
    },
  ]);

  const [confirmTask, setConfirmTask] = useState<AutomationTask | null>(null);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<string | null>(null);

  const handleTrigger = (task: AutomationTask) => {
    if (task.requiresConfirmation) {
      setConfirmTask(task);
    } else {
      executeTask(task);
    }
  };

  const executeTask = (task: AutomationTask) => {
    setConfirmTask(null);
    setExecutingTaskId(task.id);
    setExecutionLog(`Initializing "${task.name}"... Validating workflow rules and safeguards.`);

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'executing' } : t))
    );

    setTimeout(() => {
      setExecutionLog(
        `Action verified: "${task.name}" completed successfully. Output logged and stored safely.`
      );
      setExecutingTaskId(null);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'completed', lastRun: 'Just now' }
            : t
        )
      );
    }, 1800);
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
            Automate recurring business tasks with strict human approval gates prior to executing consequential actions.
          </p>
        </div>
      </div>

      {/* Security Architecture Explainer Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 text-xs text-blue-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Automations Policy & Safeguard Notice</p>
            <p className="text-slate-300 leading-relaxed">
              In accordance with enterprise safety standards, AI automations that involve external communications or state alterations require explicit human verification before execution. No message or batch operation is dispatched autonomously without your confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Execution Feedback Notification */}
      {executionLog && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{executionLog}</span>
          </div>
          <button
            onClick={() => setExecutionLog(null)}
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
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">{task.name}</h3>
                      {task.requiresConfirmation ? (
                        <Badge variant="warning">Approval Required</Badge>
                      ) : (
                        <Badge variant="success">Safe Background Task</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">{task.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Trigger: {task.trigger}
                      </span>
                      {task.lastRun && <span>Last Executed: {task.lastRun}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
          description="Consequential action approval required"
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
              By confirming, you authorize ApexAI to run this task pipeline and apply the designated state change.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmTask(null)}
              >
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
    </div>
  );
}
