'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isDBConnected, setIsDBConnected] = useState(false);
  const [isAIConnected, setIsAIConnected] = useState(false);

  useEffect(() => {
    // 1. Check Supabase DB Status
    const checkDB = async () => {
      const configured = isSupabaseConfigured();
      setIsDBConnected(configured);

      if (configured) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.email) {
            setUserEmail(user.email);
          }
        } catch {
          // Fallback to guest mode
        }
      }
    };

    // 2. Query Server AI Configuration Status
    const checkAI = async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          setIsAIConnected(Boolean(data.ai?.configured));
        }
      } catch (e) {
        console.warn('Could not retrieve AI status:', e);
      }
    };

    checkDB();
    checkAI();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isDBConnected={isDBConnected}
          isAIConnected={isAIConnected}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
