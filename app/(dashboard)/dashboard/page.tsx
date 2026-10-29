'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Bookmark,
  Zap,
  Sparkles,
  Mail,
  Share2,
  Package,
  FileText,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Key,
  Database,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    conversationsCount: 0,
    savedContentCount: 0,
    automationsCount: 2, // Default built-in template tasks
  });
  const [recentSaved, setRecentSaved] = useState<Array<{ id: string; title: string; tool_type: string; created_at: string }>>([]);
  const [dbConfigured, setDbConfigured] = useState(false);

  useEffect(() => {
    const isDb = isSupabaseConfigured();
    setDbConfigured(isDb);

    if (isDb) {
      const loadStats = async () => {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const [convRes, contentRes] = await Promise.all([
              supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
              supabase.from('saved_content').select('id, title, tool_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
            ]);

            setStats((prev) => ({
              ...prev,
              conversationsCount: convRes.count || 0,
              savedContentCount: contentRes.data?.length || 0,
            }));

            if (contentRes.data) {
              setRecentSaved(contentRes.data);
            }
          }
        } catch (e) {
          console.warn('Could not load user stats:', e);
        }
      };

      loadStats();
    }
  }, []);

  const businessTools = [
    {
      title: 'Executive Email Drafter',
      description: 'Generate high-impact proposals, sales pitches, and follow-ups with customizable tones.',
      href: '/tools/email',
      icon: Mail,
      badge: 'Popular',
    },
    {
      title: 'Social Media Captions',
      description: 'Create engaging, platform-tailored posts with high-converting hooks for LinkedIn & X.',
      href: '/tools/social',
      icon: Share2,
      badge: 'Marketing',
    },
    {
      title: 'Product Copywriter',
      description: 'Convert raw product specifications into customer benefits and persuasive descriptions.',
      href: '/tools/product',
      icon: Package,
      badge: 'E-Commerce',
    },
    {
      title: 'Executive Summarizer',
      description: 'Condense documents, transcripts, and reports into bulleted action items and insights.',
      href: '/tools/summarize',
      icon: FileText,
      badge: 'Productivity',
    },
    {
      title: 'Strategy & Brainstormer',
      description: 'Generate market growth hypotheses, value propositions, and campaign concepts.',
      href: '/tools/brainstorm',
      icon: Lightbulb,
      badge: 'Strategy',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/30 p-6 sm:p-8 backdrop-blur-md">
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI Business Command Center
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome to ApexAI Assistant
            </h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Interact with your strategic business assistant, generate marketing assets, summarize intelligence briefs, and manage automated business tasks.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link href="/chat">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Launch Chat Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.conversationsCount}</div>
            <p className="mt-1 text-xs text-slate-500">Persistent chat threads</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Saved Tool Outputs</CardTitle>
            <Bookmark className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.savedContentCount}</div>
            <p className="mt-1 text-xs text-slate-500">In Content Library</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Automations</CardTitle>
            <Zap className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.automationsCount} Active</div>
            <p className="mt-1 text-xs text-slate-500">Human approval gated</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800/80 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Database & Security</CardTitle>
            <Database className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dbConfigured ? 'Supabase RLS' : 'Guest Mode'}
            </div>
            <p className="mt-1 text-xs text-slate-500">Multi-tenant isolation</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Business Tools Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">AI Business Generators</h3>
            <p className="text-xs text-slate-400">Select a specialized workflow to start generating high-impact assets</p>
          </div>
          <Link href="/tools" className="text-xs font-medium text-blue-400 hover:text-blue-300">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group block">
                <Card className="h-full border-slate-800 bg-slate-900/60 transition-all duration-200 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-blue-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="info">{tool.badge}</Badge>
                    </div>
                    <CardTitle className="mt-4 text-base font-semibold group-hover:text-blue-400 transition-colors">
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-400">
                      <span>Launch Generator</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Recent Saved Outputs or Empty State */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Assistant Launcher */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-white">Instant AI Copilot</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have a custom request or complex business question? Engage directly with the general AI Assistant with streaming answers and session history.
            </p>
          </div>
          <Link href="/chat" className="mt-6 block">
            <Button className="w-full" variant="primary" size="md">
              Start New Chat
            </Button>
          </Link>
        </div>

        {/* Recent Library Items */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-base font-semibold text-white">Recent Saved Content</h4>
              <p className="text-xs text-slate-400">Quickly review your latest generated deliverables</p>
            </div>
            <Link href="/library" className="text-xs text-blue-400 hover:text-blue-300">
              Go to Library →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentSaved.length > 0 ? (
              recentSaved.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 hover:border-slate-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Bookmark className="h-4 w-4 shrink-0 text-blue-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{item.tool_type}</p>
                    </div>
                  </div>
                  <Link href="/library">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                <Bookmark className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-sm text-slate-400">No saved documents yet</p>
                <p className="text-xs text-slate-500">
                  Generate copy using any AI Business Tool and click &quot;Save to Library&quot;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
