'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Mail,
  Share2,
  Package,
  FileText,
  Lightbulb,
  Bookmark,
  Zap,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  User,
  X,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { logoutLocalUser } from '@/lib/auth';

interface SidebarProps {
  userEmail?: string;
  userName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userEmail, userName, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      logoutLocalUser();
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Sign out error:', e);
      logoutLocalUser();
      router.push('/login');
    }
  };

  const mainNavigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Chat Assistant', href: '/chat', icon: MessageSquare },
  ];

  const toolsNavigation = [
    { name: 'Email Drafter', href: '/tools/email', icon: Mail },
    { name: 'Social Captions', href: '/tools/social', icon: Share2 },
    { name: 'Product Copy', href: '/tools/product', icon: Package },
    { name: 'Text Summarizer', href: '/tools/summarize', icon: FileText },
    { name: 'Strategy Brainstorm', href: '/tools/brainstorm', icon: Lightbulb },
  ];

  const secondaryNavigation = [
    { name: 'Saved Library', href: '/library', icon: Bookmark },
    { name: 'Model Training Studio', href: '/train', icon: Cpu, badge: 'Native API' },
    { name: 'Automations', href: '/automations', icon: Zap, badge: 'Safeguarded' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-[#0B0F19] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">ApexAI</span>
              <span className="block text-[10px] font-medium text-blue-400 uppercase tracking-wider">
                Business Suite
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation scrollable area */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {/* Main Core Links */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Workspace
            </div>
            <nav className="space-y-1">
              {mainNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose && onClose()}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* AI Business Tools */}
          <div>
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                AI Business Tools
              </span>
              <Link
                href="/tools"
                onClick={() => onClose && onClose()}
                className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                All Tools
              </Link>
            </div>
            <nav className="space-y-1">
              {toolsNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose && onClose()}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-400" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Operations & Model Engine */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Operations & Engine
            </div>
            <nav className="space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose && onClose()}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="flex items-center gap-1 rounded bg-blue-950/80 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-800/50">
                        {item.name === 'Model Training Studio' ? (
                          <Cpu className="h-3 w-3" />
                        ) : (
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Footer & Signout */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                {userName
                  ? userName.slice(0, 2).toUpperCase()
                  : userEmail
                  ? userEmail.slice(0, 2).toUpperCase()
                  : <User className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {userName || userEmail || 'Guest Explorer'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {userEmail || 'Local Persistence Mode'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title={userEmail ? 'Sign Out' : 'Switch Account / Login'}
              aria-label="Account sign out or login"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
