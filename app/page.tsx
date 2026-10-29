import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  Share2,
  FileText,
  Package,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const features = [
    {
      icon: Mail,
      title: 'Executive Email Drafter',
      description: 'Craft pitch-perfect proposals, follow-ups, and negotiation emails in seconds.',
    },
    {
      icon: Share2,
      title: 'Multi-Channel Social Captions',
      description: 'Generate high-converting LinkedIn, Twitter, and Instagram posts with tailored hooks.',
    },
    {
      icon: Package,
      title: 'Product Copywriter',
      description: 'Turn feature lists into benefit-driven, high-converting product descriptions.',
    },
    {
      icon: FileText,
      title: 'Executive Document Summarizer',
      description: 'Condense reports, contracts, and briefs into actionable bullet points and key takeaways.',
    },
    {
      icon: Lightbulb,
      title: 'Strategy & Brainstorming',
      description: 'Brainstorm business growth initiatives, marketing angles, and revenue models.',
    },
    {
      icon: Zap,
      title: 'Safeguarded Automations',
      description: 'Automate repetitive workflows with strict human-in-the-loop confirmation gates.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">ApexAI</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Launch Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 lg:pt-32">
        {/* Ambient Gradient Glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-cyan-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3.5 py-1.5 text-xs font-medium text-blue-400 shadow-inner">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Generation AI Business Suite
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
            Work smarter with an enterprise-grade{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              AI Business Assistant
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
            Streamline business operations, draft high-stakes communications, synthesize documents, and execute automated tasks with strict human approval controls.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Open Assistant Workspace
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Value Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span>PostgreSQL & Supabase RLS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span>Real-time Response Streaming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Zero-exposure Server AI Keys</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-slate-800/80 bg-slate-950/60 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Engineered for Real-World Business Workflows
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Replace fragmented tools with a consolidated, production-ready AI command center.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-8 text-center text-xs text-slate-500">
        <p>© 2026 ApexAI Business Assistant. Production-ready AI application with Supabase & OpenAI.</p>
      </footer>
    </div>
  );
}
