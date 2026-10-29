import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getDefaultModel, isAIConfigured } from '@/lib/ai/client';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId, model = getDefaultModel() } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error:
            'AI API Key is not configured. Please set a valid OPENAI_API_KEY in your .env.local file or server environment variables.',
          isConfigError: true,
        },
        { status: 503 }
      );
    }

    const openai = getOpenAIClient();

    // Verify session for optional persistence
    let userId: string | null = null;
    let supabaseClient: Awaited<ReturnType<typeof createClient>> | null = null;
    try {
      supabaseClient = await createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Supabase is optional in local guest/preview mode
    }

    // Save user message to database if conversationId and user are available
    const lastUserMessage = messages[messages.length - 1];
    if (userId && supabaseClient && conversationId && lastUserMessage?.role === 'user') {
      try {
        await supabaseClient.from('messages').insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'user',
          content: lastUserMessage.content,
        });
      } catch (err) {
        console.warn('Failed to persist user message:', err);
      }
    }

    // Prepare messages payload with system prompt
    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPTS.chat },
      ...messages.map((m: { role: 'user' | 'assistant' | 'system'; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Create stream
    const responseStream = await openai.chat.completions.create({
      model,
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    let completeAssistantResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              completeAssistantResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Persist complete assistant message once streaming finishes
          if (userId && supabaseClient && conversationId && completeAssistantResponse) {
            try {
              await supabaseClient.from('messages').insert({
                conversation_id: conversationId,
                user_id: userId,
                role: 'assistant',
                content: completeAssistantResponse,
              });
            } catch (err) {
              console.warn('Failed to persist assistant message:', err);
            }
          }

          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; code?: string };
    console.error('Chat API Error:', err);

    let status = 500;
    let message = 'An unexpected error occurred while communicating with the AI service.';

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
