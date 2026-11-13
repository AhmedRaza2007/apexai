import { NextRequest, NextResponse } from 'next/server';
import { getDefaultModel, formatAIError } from '@/lib/ai/client';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, sanitizeText } from '@/lib/security';
import { dispatchStreamInference, getModelDescriptor } from '@/lib/ai/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    configured: true,
    model: getDefaultModel(),
    status: 'ready',
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-client';
    const rateLimit = checkRateLimit(`chat-${ip}`, 60, 60000);
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

    const { messages, conversationId, model, knowledgeContext } = body;

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

    const targetModel = typeof model === 'string' && model ? model : getDefaultModel();

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

    // Prepare system prompt, appending knowledge context if provided
    let systemPrompt = SYSTEM_PROMPTS.chat;
    if (knowledgeContext && typeof knowledgeContext === 'string' && knowledgeContext.trim()) {
      systemPrompt += `\n\n### Attached Knowledge Base Context:\n${knowledgeContext.slice(0, 8000)}\n\nPlease ground your response in the provided knowledge base context where relevant. Cite specific references where appropriate.`;
    }

    // 4. Multi-Provider Streaming Inference Dispatch
    const { readable, modelUsed, providerUsed, fallbackTriggered } = await dispatchStreamInference(
      sanitizedMessages,
      targetModel,
      req.signal,
      systemPrompt
    );

    const descriptor = getModelDescriptor(modelUsed);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Transfer-Encoding': 'chunked',
        'X-Model-Used': modelUsed,
        'X-Model-Name': descriptor.name,
        'X-Provider-Used': providerUsed,
        'X-Fallback-Triggered': fallbackTriggered ? 'true' : 'false',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const { status, message, isConfigError } = formatAIError(error);
    return NextResponse.json({ error: message, isConfigError }, { status });
  }
}
