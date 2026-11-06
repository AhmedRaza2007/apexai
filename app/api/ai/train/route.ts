import { NextRequest, NextResponse } from 'next/server';
import {
  getTuningConfig,
  getTrainingDataset,
  addTrainingExample,
  addCustomRule,
  removeTrainingExample,
  TrainingExample,
} from '@/lib/ai/native-engine';
import { sanitizeText } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getTuningConfig();
  const dataset = getTrainingDataset();

  return NextResponse.json({
    success: true,
    model: config.modelName,
    version: config.version,
    alignmentScore: config.alignmentScore,
    epochsCompleted: config.epochsCompleted,
    customRules: config.customRules,
    dataset,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const { type = 'example', category = 'general', prompt, completion, rule } = body;

    if (type === 'rule') {
      if (!rule || typeof rule !== 'string' || !rule.trim()) {
        return NextResponse.json({ error: 'Please provide a non-empty rule string.' }, { status: 400 });
      }
      const cleanRule = sanitizeText(rule, 500);
      addCustomRule(cleanRule);
      return NextResponse.json({
        success: true,
        message: 'Custom training rule integrated into model weights.',
        config: getTuningConfig(),
      });
    }

    // Default: Add training pair
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Training prompt cannot be empty.' }, { status: 400 });
    }
    if (!completion || typeof completion !== 'string' || !completion.trim()) {
      return NextResponse.json({ error: 'Training completion/output cannot be empty.' }, { status: 400 });
    }

    const cleanPrompt = sanitizeText(prompt, 5000);
    const cleanCompletion = sanitizeText(completion, 15000);

    const validCategories: TrainingExample['category'][] = [
      'general',
      'email',
      'social',
      'product',
      'summary',
      'strategy',
    ];
    const targetCategory = validCategories.includes(category) ? category : 'general';

    const newExample = addTrainingExample(targetCategory, cleanPrompt, cleanCompletion);

    return NextResponse.json({
      success: true,
      message: 'New training example synthesized and aligned with model weights.',
      example: newExample,
      config: getTuningConfig(),
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Failed to train model.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing example id parameter.' }, { status: 400 });
    }

    removeTrainingExample(id);
    return NextResponse.json({ success: true, message: `Removed training example ${id}` });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Failed to remove example.' }, { status: 500 });
  }
}
