'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [isDBConnected, setIsDBConnected] = useState(false);
  const [isAIConnected, setIsAIConnected] = useState(true); // Native AI Engine is always active

  useEffect(() => {
    // 1. Check Auth & Profile
    const checkAuth = async () => {
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
            setUserName(user.user_metadata?.full_name || user.email.split('@')[0]);
            return;
          }
        } catch {
          // Fallback to local user
        }
      }

      // Check autonomous local account session
      const localUser = getCurrentUser();
      if (localUser) {
        setUserEmail(localUser.email);
        setUserName(localUser.fullName);
      }
    };

    // 2. Query Server AI Status
    const checkAI = async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          setIsAIConnected(Boolean(data.ai?.configured));
        }
      } catch (e) {
        console.warn('Status check warning:', e);
      }
    };

    checkAuth();
    checkAI();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userEmail={userEmail}
        userName={userName}
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
