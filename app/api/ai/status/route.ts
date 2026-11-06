import { NextResponse } from 'next/server';
import { isAIConfigured, getDefaultModel } from '@/lib/ai/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const aiReady = isAIConfigured();
  const dbReady = isSupabaseConfigured();
  const defaultModel = getDefaultModel();
  const hasCustomBaseUrl = Boolean(process.env.OPENAI_BASE_URL);

  return NextResponse.json({
    ai: {
      configured: aiReady,
      model: defaultModel,
      provider: hasCustomBaseUrl ? 'Custom / Compatible' : 'OpenAI Official API',
      hasCustomBaseUrl,
    },
    database: {
      configured: dbReady,
      type: dbReady ? 'Supabase PostgreSQL' : 'Local Storage (Guest Mode)',
    },
    timestamp: new Date().toISOString(),
  });
}
