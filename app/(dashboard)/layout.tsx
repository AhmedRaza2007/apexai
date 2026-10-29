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

  useEffect(() => {
    const checkUser = async () => {
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
          // Ignore error in fallback
        }
      }
    };

    checkUser();
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isDBConnected={isDBConnected}
          isAIConnected={true}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
