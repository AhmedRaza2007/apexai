'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Plus, Key, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuToggle: () => void;
  title?: string;
  isAIConnected: boolean;
  isDBConnected: boolean;
}

export function Navbar({
  onMenuToggle,
  title = 'AI Business Dashboard',
  isAIConnected,
  isDBConnected,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0B0F19]/80 px-4 backdrop-blur-md lg:px-8">
      {/* Left: Mobile Menu & Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Right: Status Indicators & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* System Status Badges */}
        <div className="flex items-center gap-2">
          <div
            title={
              isAIConnected
                ? 'AI API Connected & Ready for live inferences'
                : 'AI API Key Not Configured (Set OPENAI_API_KEY in .env.local)'
            }
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border transition-colors ${
              isAIConnected
                ? 'bg-blue-950/60 text-blue-400 border-blue-800/50'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/50'
            }`}
          >
            <Key className="h-3 w-3" />
            <span className="hidden sm:inline font-medium">
              {isAIConnected ? 'AI Ready' : 'Key Needed'}
            </span>
            <span className="sm:hidden font-medium">
              {isAIConnected ? 'Ready' : 'Setup'}
            </span>
          </div>

          <div
            title={
              isDBConnected
                ? 'Connected to Supabase PostgreSQL with Row Level Security'
                : 'Guest Mode: LocalStorage persistence active'
            }
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border transition-colors ${
              isDBConnected
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/80'
            }`}
          >
            <Database className="h-3 w-3" />
            <span className="hidden sm:inline font-medium">
              {isDBConnected ? 'PostgreSQL RLS' : 'Guest Mode'}
            </span>
            <span className="sm:hidden font-medium">
              {isDBConnected ? 'DB' : 'Guest'}
            </span>
          </div>
        </div>

        {/* Quick New Chat Button */}
        <Link href="/chat">
          <Button size="sm" variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            <span className="hidden sm:inline">New Chat</span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
