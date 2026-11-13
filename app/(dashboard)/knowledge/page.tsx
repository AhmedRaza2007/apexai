'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  KnowledgeCollection,
  KnowledgeDocument,
  DEFAULT_COLLECTION,
  chunkDocumentText,
  searchKnowledgeBase,
  getLocalKnowledgeCollections,
  saveLocalKnowledgeCollections,
} from '@/lib/ai/knowledge';

export default function KnowledgeStudioPage() {
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('col-default');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const list = getLocalKnowledgeCollections();
    setCollections(list);
    if (list.length > 0) {
      setActiveCollectionId(list[0].id);
      setCustomInstructions(list[0].customInstructions);
    }
  }, []);

  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) || collections[0] || DEFAULT_COLLECTION;

  const handleSearchTest = () => {
    if (!searchQuery.trim() || !activeCollection) return;
    const results = searchKnowledgeBase(searchQuery, activeCollection.documents, 3);
    setSearchResults(results);
  };

  const handleAddManualDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    const chunks = chunkDocumentText(newDocContent);
    const newDoc: KnowledgeDocument = {
      id: `doc-${Date.now()}`,
      name: newDocTitle.trim().endsWith('.md') ? newDocTitle.trim() : `${newDocTitle.trim()}.md`,
      type: 'md',
      sizeBytes: new Blob([newDocContent]).size,
      content: newDocContent.trim(),
      chunks,
      tags: ['manual-upload', 'company-doc'],
      uploadedAt: new Date().toISOString(),
    };

    const updated = collections.map((col) => {
      if (col.id === activeCollection.id) {
        return {
          ...col,
          documents: [newDoc, ...col.documents],
          updatedAt: new Date().toISOString(),
        };
      }
      return col;
    });

    setCollections(updated);
    saveLocalKnowledgeCollections(updated);
    setNewDocTitle('');
    setNewDocContent('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const chunks = chunkDocumentText(text);
        const newDoc: KnowledgeDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: (file.name.split('.').pop() as any) || 'txt',
          sizeBytes: file.size,
          content: text,
          chunks,
          tags: ['file-import'],
          uploadedAt: new Date().toISOString(),
        };

        const updated = collections.map((col) => {
          if (col.id === activeCollection.id) {
            return {
              ...col,
              documents: [newDoc, ...col.documents],
              updatedAt: new Date().toISOString(),
            };
          }
          return col;
        });

        setCollections(updated);
        saveLocalKnowledgeCollections(updated);
      }
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = collections.map((col) => {
      if (col.id === activeCollection.id) {
        return {
          ...col,
          documents: col.documents.filter((d) => d.id !== docId),
        };
      }
      return col;
    });
    setCollections(updated);
    saveLocalKnowledgeCollections(updated);
  };

  const handleSaveInstructions = () => {
    const updated = collections.map((col) => {
      if (col.id === activeCollection.id) {
        return { ...col, customInstructions, updatedAt: new Date().toISOString() };
      }
      return col;
    });
    setCollections(updated);
    saveLocalKnowledgeCollections(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Custom AI Knowledge Studio</h1>
            <Badge variant="info">RAG Grounding</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Upload enterprise documents, policy memos, and manuals to ground AI responses in verified corporate facts.
          </p>
        </div>

        <Link href="/chat">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Open Chat with RAG
          </Button>
        </Link>
      </div>

      {/* Critical Educational Disclosure Alert */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 text-xs text-blue-200">
        <Info className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">How Knowledge Studio Works (Retrieval-Augmented Generation)</p>
          <p className="leading-relaxed text-slate-300">
            Uploading documents does <strong>not</strong> re-train or alter the underlying foundation weights of OpenAI or Gemini. Instead, our semantic retrieval engine chunks your documents and injects the most relevant excerpts directly into the inference prompt when answering queries. For parameter tuning, visit the <Link href="/train" className="text-blue-400 underline">Model Training Studio</Link>.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Collection Documents & Custom Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Documents List & Upload */}
        <div className="lg:col-span-7 space-y-6">
          {/* Document Upload Area */}
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Add Knowledge Sources</CardTitle>
              <CardDescription className="text-xs">
                Upload Markdown, TXT, or paste document contents directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Drop Box */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-6 cursor-pointer bg-slate-950/60 transition-colors">
                <UploadCloud className="h-8 w-8 text-blue-400 mb-2" />
                <span className="text-xs font-semibold text-white">
                  {isUploading ? 'Chunking document...' : 'Click to upload document'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">Supports .md, .txt, .csv, .docx files</span>
                <input
                  type="file"
                  accept=".md,.txt,.csv,.json,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Manual Document Entry Form */}
              <form onSubmit={handleAddManualDocument} className="space-y-3 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Document Title</label>
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="e.g. Q4_Expansion_Playbook.md"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Document Text Content</label>
                  <textarea
                    rows={4}
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Paste guidelines, policy clauses, product specifications..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!newDocTitle.trim() || !newDocContent.trim()}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Index Document into Knowledge Base
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Documents List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Indexed Documents ({activeCollection.documents.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                {activeCollection.documents.reduce((acc, d) => acc + d.chunks.length, 0)} total chunks
              </span>
            </div>

            <div className="space-y-2">
              {activeCollection.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white">{doc.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {doc.chunks.length} chunks • {(doc.sizeBytes / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    aria-label="Delete document"
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Custom System Instructions & Semantic Search Test */}
        <div className="lg:col-span-5 space-y-6">
          {/* Custom System Grounding Rules */}
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Collection Grounding Instructions</CardTitle>
              <CardDescription className="text-xs">
                Directives that govern how the assistant utilizes this knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Always verify claims against the uploaded SLA policy..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <Button onClick={handleSaveInstructions} size="sm" variant="outline" className="text-xs">
                  Save Directives
                </Button>
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Saved!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Semantic Retrieval Search Tester */}
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Live RAG Retrieval Tester</CardTitle>
              <CardDescription className="text-xs">
                Test which document chunks will be retrieved for a given prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchTest()}
                  placeholder="e.g. What is our breach notification SLA?"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <Button onClick={handleSearchTest} size="sm" variant="primary" className="text-xs">
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-semibold text-slate-400">
                    Retrieved Excerpts ({searchResults.length}):
                  </p>
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed"
                    >
                      {res}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 pt-1">
                  Type a query above to inspect what context chunks are provided to the AI model.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
