import { NextRequest, NextResponse } from 'next/server';
import {
  getOpenAIClient,
  getDefaultModel,
  isOpenAIConfigured,
  sanitizeModel,
  formatAIError,
} from '@/lib/ai/client';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
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
    const rateLimit = checkRateLimit(`chat-${ip}`, 45, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetInSec} seconds before sending another message.`,
        },
        { status: 429 }
      );
    }

    // 2. Payload Validation
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request: Request body must be valid JSON.' }, { status: 400 });
    }

    const { messages, conversationId, model } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: "messages" array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (messages.length > 50) {
      return NextResponse.json(
        { error: 'Message history exceeds the maximum supported length (50 messages).' },
        { status: 400 }
      );
    }

    const targetModel = sanitizeModel(model);

    // 3. Verify User Session for optional DB persistence
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
      // In guest/local mode
    }

    // Sanitize user messages
    const sanitizedMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    let totalCharCount = 0;

    for (const msg of messages) {
      if (!msg || typeof msg !== 'object' || typeof msg.content !== 'string') continue;
      const role = msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system' ? msg.role : 'user';
      const cleanContent = sanitizeText(msg.content, 12000);
      totalCharCount += cleanContent.length;
      sanitizedMessages.push({ role, content: cleanContent });
    }

    if (totalCharCount > 60000) {
      return NextResponse.json(
        { error: 'Conversation content exceeds safety limits. Please start a new session.' },
        { status: 400 }
      );
    }

    // Save latest user message to database if conversationId is valid and user is signed in
    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1];
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

    const encoder = new TextEncoder();

    // 4. Check if external third-party provider is configured and requested
    if (isOpenAIConfigured() && targetModel !== 'apexai-native-v2') {
      try {
        const openai = getOpenAIClient();
        const apiMessages = [
          { role: 'system' as const, content: SYSTEM_PROMPTS.chat },
          ...sanitizedMessages,
        ];

        const responseStream = await openai.chat.completions.create({
          model: targetModel,
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 3000,
        });

        let completeAssistantResponse = '';

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of responseStream) {
                if (req.signal.aborted) {
                  controller.close();
                  return;
                }
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  completeAssistantResponse += content;
                  controller.enqueue(encoder.encode(content));
                }
              }

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
              if (req.signal.aborted) {
                try { controller.close(); } catch {}
                return;
              }
              console.error('Streaming chunk error:', streamError);
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
      } catch (openaiErr) {
        console.warn('External API call failed or quota exceeded, switching to Native Trained Engine:', openaiErr);
        // Fall through to native model!
      }
    }

    // 5. Native Autonomous Trained Model Inference (Zero-cost, 100% offline-ready)
    const nativeOutput = await runNativeInference(sanitizedMessages, targetModel);

    // Group text into natural token chunks (2-4 words per chunk) for smooth, non-blocking delivery
    const rawTokens = nativeOutput.split(/(\s+)/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < rawTokens.length; i++) {
      currentChunk += rawTokens[i];
      // Flush every 2 words or on newlines
      if (rawTokens[i].includes('\n') || i % 4 === 3 || i === rawTokens.length - 1) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < chunks.length; i++) {
            if (req.signal.aborted) {
              controller.close();
              return;
            }

            controller.enqueue(encoder.encode(chunks[i]));

            // Smooth 20ms cadence between token chunks
            await new Promise((resolve) => setTimeout(resolve, 20));
          }

          if (userId && supabaseClient && conversationId && nativeOutput) {
            try {
              await supabaseClient.from('messages').insert({
                conversation_id: conversationId,
                user_id: userId,
                role: 'assistant',
                content: nativeOutput,
              });
            } catch (err) {
              console.warn('Failed to persist assistant message:', err);
            }
          }

          controller.close();
        } catch (streamErr) {
          if (req.signal.aborted) {
            try { controller.close(); } catch {}
            return;
          }
          controller.error(streamErr);
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
    console.error('Chat API Error:', error);
    const { status, message, isConfigError } = formatAIError(error);
    return NextResponse.json({ error: message, isConfigError }, { status });
  }
}
