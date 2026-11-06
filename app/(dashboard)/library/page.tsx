'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Copy,
  Check,
  Eye,
  Calendar,
  Download,
  Database,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { getLocalSavedContent, deleteLocalContentItem, LocalSavedItem } from '@/lib/storage';

export default function ContentLibraryPage() {
  const [items, setItems] = useState<LocalSavedItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<LocalSavedItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDBMode, setIsDBMode] = useState(false);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsDBMode(true);
          const { data, error } = await supabase
            .from('saved_content')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            setItems(data as LocalSavedItem[]);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load from Supabase:', e);
      }
    }

    // Guest Mode / LocalStorage fallback
    setIsDBMode(false);
    const local = getLocalSavedContent();

    if (local.length > 0) {
      setItems(local);
    } else {
      // Sample starter items if storage is totally empty
      const sampleItems: LocalSavedItem[] = [
        {
          id: 'sample-1',
          title: 'Q4 Enterprise Demo Proposal',
          tool_type: 'email',
          generated_content: `### Subject Line Options\n- **Direct**: Accelerating Fulfillment Operations at Acme Corp with ApexAI\n- **Curiosity**: 40% reduction in manual drafting overhead for Acme's units\n\n### Email Body\nDear Mr. Roberts,\n\nI hope your week is off to a productive start.\n\nFollowing our brief conversation regarding workflow bottlenecks in your regional fulfillment units, I am pleased to share that ApexAI helps operations teams compress routine drafting and reporting overhead by over **40%**.\n\nWould you have 15 minutes next Tuesday at 2:00 PM EST for a focused walkthrough tailored to Acme's infrastructure?\n\nWarm regards,\n**Alex Morgan**  \nHead of Business Development, ApexAI`,
          input_params: { recipient: 'COO, Acme Corp', tone: 'professional' },
          tags: ['email', 'sales', 'q4'],
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'sample-2',
          title: 'Executive Briefing — Operations Transition',
          tool_type: 'summarize',
          generated_content: `### 1-Sentence Executive Summary\nQ3 database migration achieved a **32% latency reduction** and **$14k monthly savings**, while mobile growth prompted the deployment of an AI triage pipeline for support operations.\n\n### Key Takeaways & Strategic Findings\n- **Infrastructure**: PostgreSQL migration to Supabase completed with zero data loss.\n- **Support Velocity**: Customer ticket volume expanded 45%; peak response times rose to 48 minutes.\n- **AI Triage**: Pilot copilot deployed to assist reps with draft answers and automated categorization.\n\n### Action Items & Ownership Matrix\n| Item | Priority | Recommended Owner |\n| :--- | :--- | :--- |\n| Finalize automated triage pipeline testing | High | Sarah Jenkins |\n| Recruit two Senior DevOps Engineers for failover | High | Marcus Vance |\n| Review cloud vendor licensing commitments | Medium | FP&A Team |`,
          input_params: { length: 'concise' },
          tags: ['summary', 'operations', 'infrastructure'],
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ];
      setItems(sampleItems);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);

    if (isDBMode && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('saved_content').delete().eq('id', id);
      } catch (err) {
        console.warn('Delete failed:', err);
      }
    } else {
      deleteLocalContentItem(id);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportText = (item: LocalSavedItem) => {
    const element = document.createElement('a');
    const file = new Blob([item.generated_content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = filterType === 'all' || item.tool_type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.generated_content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Saved Content Library</h1>
            <Badge variant={isDBMode ? 'success' : 'default'} className="flex items-center gap-1">
              {isDBMode ? <Database className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
              <span>{isDBMode ? 'PostgreSQL RLS' : 'Local Storage Mode'}</span>
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Search, export, view, and organize deliverables generated by your AI Business Tools.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deliverables by keyword or title..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'email', 'social', 'product', 'summarize', 'brainstorm'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="info" className="capitalize">
                    {item.tool_type}
                  </Badge>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <CardTitle className="mt-3 text-base text-white line-clamp-1">{item.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-xs text-slate-400 line-clamp-4 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                  {item.generated_content.replace(/[#*`]/g, '')}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <Button
                    onClick={() => setSelectedItem(item)}
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                  >
                    View
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(item.id, item.generated_content)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                      title="Copy content"
                      aria-label="Copy document"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleExportText(item)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                      title="Download as .txt"
                      aria-label="Download document as text file"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                      title="Delete document"
                      aria-label="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-base font-medium text-white">No documents matched your criteria</h3>
          <p className="mt-1 text-xs text-slate-400">
            Generate deliverables using the Business Tools Suite and click &quot;Save&quot; to populate your library.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          description={`Tool: ${selectedItem.tool_type.toUpperCase()} • Created on ${formatDate(
            selectedItem.created_at
          )}`}
          className="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-200 leading-relaxed selection:bg-blue-600/30">
              <MarkdownRenderer content={selectedItem.generated_content} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                onClick={() => handleExportText(selectedItem)}
                variant="secondary"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export .txt
              </Button>

              <Button
                onClick={() => handleCopy(selectedItem.id, selectedItem.generated_content)}
                variant="primary"
                size="sm"
                leftIcon={
                  copiedId === selectedItem.id ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
              >
                {copiedId === selectedItem.id ? 'Copied' : 'Copy Output'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
