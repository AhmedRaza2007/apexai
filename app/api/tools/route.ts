import { NextRequest, NextResponse } from 'next/server';
import {
  getOpenAIClient,
  getDefaultModel,
  isOpenAIConfigured,
  formatAIError,
} from '@/lib/ai/client';
import { buildToolPrompt, SYSTEM_PROMPTS, ToolType } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, sanitizeText } from '@/lib/security';
import { runNativeInference } from '@/lib/ai/native-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    configured: true,
    model: getDefaultModel(),
    status: 'ready',
    isOpenAIConfigured: isOpenAIConfigured(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-client';
    const rateLimit = checkRateLimit(`tools-${ip}`, 45, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetInSec} seconds before generating more business assets.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate Body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const { toolType, inputData, title, saveToLibrary = false } = body;

    const validTools: ToolType[] = ['email', 'social', 'product', 'summarize', 'brainstorm'];
    if (!toolType || !validTools.includes(toolType as ToolType)) {
      return NextResponse.json(
        { error: `Invalid or missing toolType. Must be one of: ${validTools.join(', ')}` },
        { status: 400 }
      );
    }

    if (!inputData || typeof inputData !== 'object') {
      return NextResponse.json(
        { error: 'Missing required inputData object for this tool generator.' },
        { status: 400 }
      );
    }

    // Specific validation for document summarizer
    if (toolType === 'summarize') {
      const text = inputData.textToSummarize;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Please provide document text to summarize.' },
          { status: 400 }
        );
      }
      if (text.length > 50000) {
        return NextResponse.json(
          { error: 'Input text exceeds maximum document size (50,000 characters). Please provide a shorter excerpt.' },
          { status: 400 }
        );
      }
    }

    const systemPrompt = SYSTEM_PROMPTS[toolType as ToolType] || SYSTEM_PROMPTS.chat;
    const userPrompt = buildToolPrompt(toolType as ToolType, inputData);

    let generatedContent = '';
    let modelUsed = 'ApexAI Native Enterprise Model';

    // 3. Try external OpenAI provider if configured
    if (isOpenAIConfigured()) {
      try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
          model: getDefaultModel(),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        });

        generatedContent = completion.choices[0]?.message?.content || '';
        modelUsed = completion.model;
      } catch (externalErr) {
        console.warn('External API call failed, generating via Native Trained Engine:', externalErr);
      }
    }

    // 4. Fallback to Native Trained Model if external API is unconfigured or failed
    if (!generatedContent) {
      generatedContent = await runNativeInference([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
      modelUsed = 'ApexAI Native Model (Trained)';
    }

    // 5. Save to Supabase if authenticated
    let savedRecord = null;
    if (saveToLibrary) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const cleanTitle = sanitizeText(title || `${toolType.toUpperCase()} Draft`, 120);
          const { data, error } = await supabase
            .from('saved_content')
            .insert({
              user_id: user.id,
              title: cleanTitle,
              tool_type: toolType,
              input_params: inputData,
              generated_content: generatedContent,
              tags: [toolType, 'ai-generated'],
            })
            .select()
            .single();

          if (!error) {
            savedRecord = data;
          }
        }
      } catch (saveErr) {
        console.warn('Error saving to Supabase library:', saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      modelUsed,
      savedRecord,
    });
  } catch (error: unknown) {
    console.error('Tools API Error:', error);
    const { status, message, isConfigError } = formatAIError(error);
    return NextResponse.json({ error: message, isConfigError }, { status });
  }
}
