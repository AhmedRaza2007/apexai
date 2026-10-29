import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getDefaultModel, isAIConfigured } from '@/lib/ai/client';
import { buildToolPrompt, SYSTEM_PROMPTS, ToolType } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolType, inputData, title, saveToLibrary = false } = body;

    if (!toolType || !inputData) {
      return NextResponse.json(
        { error: 'Missing required fields: toolType and inputData are mandatory.' },
        { status: 400 }
      );
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error:
            'AI API Key is not configured. Please add your OPENAI_API_KEY to .env.local to generate content.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[toolType as ToolType] || SYSTEM_PROMPTS.chat;
    const userPrompt = buildToolPrompt(toolType as ToolType, inputData);

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const generatedContent = completion.choices[0]?.message?.content || '';

    // If user requested to save to library and is authenticated
    let savedRecord = null;
    if (saveToLibrary) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('saved_content')
            .insert({
              user_id: user.id,
              title: title || `${toolType.toUpperCase()} Draft - ${new Date().toLocaleDateString()}`,
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
        console.warn('Error saving to library:', saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      modelUsed: completion.model,
      savedRecord,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; code?: string };
    console.error('Tools API Error:', err);

    let status = 500;
    let message = 'An unexpected error occurred while generating content.';

    if (err.status === 401 || err.code === 'invalid_api_key') {
      status = 401;
      message = 'Invalid OpenAI API key. Please check your credentials in .env.local.';
    } else if (err.status === 429) {
      status = 429;
      message = 'OpenAI rate limit or quota exceeded. Please check your billing or quota.';
    } else if (err.message) {
      message = err.message;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
