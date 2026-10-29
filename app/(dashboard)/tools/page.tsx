import React from 'react';
import Link from 'next/link';
import { Mail, Share2, Package, FileText, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ToolsCatalogPage() {
  const tools = [
    {
      title: 'Executive Email Drafter',
      description:
        'Generate compelling business emails tailored to investors, enterprise clients, or team updates. Supports multiple tones and structured follow-up advice.',
      href: '/tools/email',
      icon: Mail,
      category: 'Communications',
      badge: 'High Impact',
    },
    {
      title: 'Social Media Captions',
      description:
        'Create high-converting thought leadership and promotional posts for LinkedIn, Twitter/X, and Instagram with platform-optimized hooks and hashtags.',
      href: '/tools/social',
      icon: Share2,
      category: 'Marketing',
      badge: 'Viral Hooks',
    },
    {
      title: 'Product Description Copywriter',
      description:
        'Transform feature specifications into benefit-driven, high-converting product descriptions for e-commerce, SaaS landing pages, or product launches.',
      href: '/tools/product',
      icon: Package,
      category: 'Sales & Copy',
      badge: 'Conversion Focused',
    },
    {
      title: 'Executive Document Summarizer',
      description:
        'Condense lengthy reports, meeting minutes, research briefs, and contracts into executive summaries, bullet highlights, and owners for action items.',
      href: '/tools/summarize',
      icon: FileText,
      category: 'Intelligence',
      badge: 'Time Saver',
    },
    {
      title: 'Strategy & Brainstormer',
      description:
        'Brainstorm business models, new market positioning, marketing campaign concepts, and revenue growth strategies with structured matrices.',
      href: '/tools/brainstorm',
      icon: Lightbulb,
      category: 'Strategy',
      badge: 'Innovation',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">AI Business Tools Suite</h1>
        <p className="mt-1 text-sm text-slate-400">
          Specialized prompt pipelines designed for rapid business operations, communications, and strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className="group block">
              <Card className="h-full border-slate-800 bg-slate-900/60 transition-all duration-200 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-blue-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="info">{tool.badge}</Badge>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      {tool.category}
                    </span>
                    <CardTitle className="mt-1 text-base font-semibold group-hover:text-blue-400 transition-colors">
                      {tool.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-400 leading-relaxed">{tool.description}</p>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-blue-400">
                    <span>Open Generator</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
