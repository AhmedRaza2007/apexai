'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Plus, Key, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuToggle: () => void;
  title?: string;
  isAIConnected?: boolean;
  isDBConnected?: boolean;
}

export function Navbar({
  onMenuToggle,
  title = 'AI Business Dashboard',
  isAIConnected = true,
  isDBConnected = true,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0B0F19]/80 px-4 backdrop-blur-md lg:px-8">
      {/* Left: Mobile Menu & Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
        </div>
      </div>

      {/* Right: Status Indicators & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* System Badges */}
        <div className="hidden sm:flex items-center gap-2">
          <div
            title={isAIConnected ? 'AI Service Connected' : 'AI API Key Not Set (Using Safe Fallback)'}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border ${
              isAIConnected
                ? 'bg-blue-950/60 text-blue-400 border-blue-800/50'
                : 'bg-amber-950/60 text-amber-400 border-amber-800/50'
            }`}
          >
            <Key className="h-3 w-3" />
            <span>{isAIConnected ? 'AI Ready' : 'Key Needed'}</span>
          </div>

          <div
            title={isDBConnected ? 'Supabase Connected' : 'Local / Guest Mode'}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border ${
              isDBConnected
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Database className="h-3 w-3" />
            <span>{isDBConnected ? 'PostgreSQL' : 'Guest Mode'}</span>
          </div>
        </div>

        {/* Quick New Chat Button */}
        <Link href="/chat">
          <Button size="sm" variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            <span className="hidden sm:inline">New Assistant Chat</span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
