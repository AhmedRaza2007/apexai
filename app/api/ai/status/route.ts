import { NextResponse } from 'next/server';
import { isAIConfigured, isOpenAIConfigured, getDefaultModel, getActiveProvider } from '@/lib/ai/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getTuningConfig, getTrainingDataset } from '@/lib/ai/native-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const provider = getActiveProvider();
  const tuning = getTuningConfig();
  const dataset = getTrainingDataset();
  const dbReady = isSupabaseConfigured();

  return NextResponse.json({
    ai: {
      configured: true,
      provider: provider === 'openai' ? 'OpenAI Official API' : provider === 'custom-free' ? 'Custom Provider' : 'Native Trained Model',
      model: getDefaultModel(),
      isOpenAIConfigured: isOpenAIConfigured(),
      training: {
        modelName: tuning.modelName,
        version: tuning.version,
        alignmentScore: tuning.alignmentScore,
        epochsCompleted: tuning.epochsCompleted,
        trainedExamplesCount: dataset.length,
      },
    },
    database: {
      configured: dbReady,
      type: dbReady ? 'Supabase PostgreSQL' : 'Autonomous Client Engine',
    },
    timestamp: new Date().toISOString(),
  });
}
