import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getDefaultModel, isAIConfigured, sanitizeModel, formatAIError } from '@/lib/ai/client';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, sanitizeText } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isAIConfigured();
  return NextResponse.json({
    configured,
    model: getDefaultModel(),
    status: configured ? 'ready' : 'configuration_required',
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-client';
    const rateLimit = checkRateLimit(`chat-${ip}`, 30, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many chat requests. Please wait ${rateLimit.resetInSec} seconds before sending another message.`,
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

    // Guard against excessive message history size
    if (messages.length > 50) {
      return NextResponse.json(
        { error: 'Message history exceeds the maximum supported length (50 messages).' },
        { status: 400 }
      );
    }

    // 3. Configuration Check
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

    const targetModel = sanitizeModel(model);
    const openai = getOpenAIClient();

    // 4. Verify User Session for optional DB persistence
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
      // In guest mode or when Supabase is not configured
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
        { error: 'Conversation content exceeds maximum token payload safety limits. Please start a new session.' },
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

    // 5. Construct API Payload
    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPTS.chat },
      ...sanitizedMessages,
    ];

    // 6. Initiate Stream
    const responseStream = await openai.chat.completions.create({
      model: targetModel,
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 3000,
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

          // Persist completed assistant response in Supabase if authenticated
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
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const { status, message, isConfigError } = formatAIError(error);
    return NextResponse.json({ error: message, isConfigError }, { status });
  }
}
