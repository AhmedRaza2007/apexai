'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      // In guest / demo mode when Supabase credentials are not populated
      setTimeout(() => {
        setIsLoading(false);
        router.push(redirectedFrom);
      }, 500);
      return;
    }

    try {
      const supabase = createClient();

      if (isSignUpMode) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.session) {
          router.push(redirectedFrom);
          router.refresh();
        } else {
          setSuccessMessage(
            'Account created! If email confirmation is enabled, check your inbox to confirm your account.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
        } else {
          router.push(redirectedFrom);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">ApexAI</span>
        </Link>
        <h2 className="mt-4 text-xl font-semibold text-white">
          {isSignUpMode ? 'Create your business account' : 'Welcome back to your workspace'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          {isSignUpMode
            ? 'Start automating everyday tasks and drafting high-impact content.'
            : 'Sign in to access your chat history, business tools, and automations.'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl backdrop-blur-md">
        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-slate-950/80 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsSignUpMode(false);
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              !isSignUpMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUpMode(true);
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              isSignUpMode
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">Work Email</label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="executive@company.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/90 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">Password</label>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/90 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            size="md"
            variant="primary"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {isSignUpMode ? 'Sign Up for ApexAI' : 'Sign In'}
          </Button>
        </form>

        {/* Guest / Direct Explorer Mode */}
        <div className="mt-5 border-t border-slate-800/80 pt-4 text-center">
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
          >
            Continue in Guest Demo Mode →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center text-sm text-slate-400">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
