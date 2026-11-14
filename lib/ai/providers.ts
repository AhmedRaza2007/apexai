// ApexAI Multi-Model Provider Architecture
// Seamlessly routes between Anthropic Claude, OpenAI, Google Gemini, OpenRouter, and ApexAI Native Engine

import OpenAI from 'openai';
import { SYSTEM_PROMPTS } from './prompts';
import { runNativeInference } from './native-engine';

export type AIProvider = 'anthropic' | 'openai' | 'google' | 'openrouter' | 'native';

export interface ModelDescriptor {
  id: string;
  name: string;
  provider: AIProvider;
  providerName: string;
  description: string;
  badge: string;
  isFree: boolean;
  tier: 'free' | 'pro' | 'business';
  contextWindow: string;
}

export const SUPPORTED_MODELS: ModelDescriptor[] = [
  // 1. ApexAI Native Engine (Always available, 100% offline & free)
  {
    id: 'apexai-native-v2',
    name: 'ApexAI Native Engine',
    provider: 'native',
    providerName: 'ApexAI Internal',
    description: 'Autonomous zero-cost engine with built-in intent classification and conversational intelligence.',
    badge: 'Autonomous',
    isFree: true,
    tier: 'free',
    contextWindow: '32k',
  },

  // 2. Anthropic (US Flagship)
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    providerName: 'Anthropic US',
    description: 'Premier reasoning and coding intelligence developed in San Francisco, CA.',
    badge: 'Anthropic US',
    isFree: false,
    tier: 'pro',
    contextWindow: '200k',
  },

  // 3. OpenAI Models (US Flagship)
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omni',
    provider: 'openai',
    providerName: 'OpenAI US',
    description: 'OpenAI’s flagship multi-modal model with advanced analytical capabilities.',
    badge: 'OpenAI Flagship',
    isFree: false,
    tier: 'pro',
    contextWindow: '128k',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    providerName: 'OpenAI US',
    description: 'OpenAI’s high-speed compact model for quick conversational queries and utility execution.',
    badge: 'OpenAI',
    isFree: false,
    tier: 'free',
    contextWindow: '128k',
  },

  // 4. Google Gemini Models (US Flagship)
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    providerName: 'Google Cloud US',
    description: 'High-speed multimodal model with a 1-million token context window, perfect for everyday tasks.',
    badge: 'Google US',
    isFree: true,
    tier: 'free',
    contextWindow: '1M',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    providerName: 'Google Cloud US',
    description: 'Google’s flagship 2M-token reasoning model for complex documents and coding.',
    badge: 'Google Pro',
    isFree: false,
    tier: 'pro',
    contextWindow: '2M',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    providerName: 'Google Cloud US',
    description: 'Next-generation Gemini 2.0 architecture with real-time agentic response latency.',
    badge: 'Google Gen-2',
    isFree: true,
    tier: 'free',
    contextWindow: '1M',
  },

  // 5. OpenRouter Free Models
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'openrouter',
    providerName: 'OpenRouter / Meta',
    description: 'Meta’s open-weights model rivaling GPT-4 class intelligence, hosted free via OpenRouter.',
    badge: 'OpenRouter Free',
    isFree: true,
    tier: 'free',
    contextWindow: '128k',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp (Free)',
    provider: 'openrouter',
    providerName: 'OpenRouter / Google',
    description: 'Experimental Gemini 2.0 Flash available with zero cost via OpenRouter.',
    badge: 'OpenRouter Free',
    isFree: true,
    tier: 'free',
    contextWindow: '1M',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    provider: 'openrouter',
    providerName: 'OpenRouter / Mistral',
    description: 'Fast, concise open European model ideal for quick queries and email drafting.',
    badge: 'OpenRouter Free',
    isFree: true,
    tier: 'free',
    contextWindow: '32k',
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen 2.5 Coder 32B (Free)',
    provider: 'openrouter',
    providerName: 'OpenRouter / Alibaba',
    description: 'State-of-the-art coding and math model hosted at no charge via OpenRouter.',
    badge: 'OpenRouter Coder',
    isFree: true,
    tier: 'free',
    contextWindow: '32k',
  },
];

// Helper to check valid configuration of individual API keys
export function isAnthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return Boolean(key && key.length > 10 && !key.includes('your-anthropic-key'));
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key.length > 8 && !key.includes('your-gemini-api-key'));
}

export function isOpenRouterConfigured(): boolean {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  return Boolean(key && key.length > 8 && !key.includes('your-openrouter-key'));
}

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key.length > 10 && !key.includes('your-openai-api-key'));
}

export function getProviderStatus() {
  return {
    anthropic: isAnthropicConfigured(),
    openai: isOpenAIConfigured(),
    gemini: isGeminiConfigured(),
    openrouter: isOpenRouterConfigured(),
    native: true,
  };
}

export function getModelDescriptor(modelId: string): ModelDescriptor {
  const found = SUPPORTED_MODELS.find((m) => m.id === modelId);
  if (found) return found;
  return SUPPORTED_MODELS[0];
}

// ----------------------------------------------------------------------------
// Universal Streaming Provider Dispatcher
// ----------------------------------------------------------------------------

export async function dispatchStreamInference(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  requestedModelId: string,
  abortSignal?: AbortSignal,
  systemPrompt: string = SYSTEM_PROMPTS.chat
): Promise<{
  readable: ReadableStream<Uint8Array>;
  modelUsed: string;
  providerUsed: AIProvider;
  fallbackTriggered: boolean;
}> {
  const encoder = new TextEncoder();
  const descriptor = getModelDescriptor(requestedModelId);

  // 1. Anthropic Claude 3.5 Sonnet Provider (US)
  if (descriptor.provider === 'anthropic' && isAnthropicConfigured()) {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY!.trim();
      const anthropicMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: abortSignal,
        body: JSON.stringify({
          model: descriptor.id,
          max_tokens: 3500,
          system: systemPrompt,
          messages: anthropicMessages,
          stream: true,
        }),
      });

      if (res.ok && res.body) {
        const streamReader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const readable = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              while (true) {
                if (abortSignal?.aborted) {
                  controller.close();
                  return;
                }
                const { done, value } = await streamReader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    try {
                      const parsed = JSON.parse(jsonStr);
                      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                        controller.enqueue(encoder.encode(parsed.delta.text));
                      }
                    } catch {}
                  }
                }
              }
              controller.close();
            } catch (err) {
              if (abortSignal?.aborted) {
                try { controller.close(); } catch {}
                return;
              }
              controller.error(err);
            }
          },
        });

        return {
          readable,
          modelUsed: descriptor.id,
          providerUsed: 'anthropic',
          fallbackTriggered: false,
        };
      }
    } catch (anthropicErr) {
      console.warn('Anthropic API call failed, falling through:', anthropicErr);
    }
  }

  // 2. Google Gemini Provider (US)
  if (descriptor.provider === 'google' && isGeminiConfigured()) {
    try {
      const apiKey = process.env.GEMINI_API_KEY!.trim();
      const geminiModel = descriptor.id === 'gemini-2.0-flash' ? 'gemini-2.0-flash-exp' : descriptor.id;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortSignal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000,
          },
        }),
      });

      if (res.ok && res.body) {
        const streamReader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const readable = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              while (true) {
                if (abortSignal?.aborted) {
                  controller.close();
                  return;
                }
                const { done, value } = await streamReader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    try {
                      const parsed = JSON.parse(jsonStr);
                      const candidate = parsed.candidates?.[0];
                      const chunkText = candidate?.content?.parts?.[0]?.text;
                      if (chunkText) {
                        controller.enqueue(encoder.encode(chunkText));
                      }
                    } catch {}
                  }
                }
              }
              controller.close();
            } catch (err) {
              if (abortSignal?.aborted) {
                try { controller.close(); } catch {}
                return;
              }
              controller.error(err);
            }
          },
        });

        return {
          readable,
          modelUsed: descriptor.id,
          providerUsed: 'google',
          fallbackTriggered: false,
        };
      }
    } catch (geminiError) {
      console.warn('Gemini stream failed, falling through to OpenRouter / Native:', geminiError);
    }
  }

  // 3. OpenRouter Provider (Free & Open Source)
  if (descriptor.provider === 'openrouter' && isOpenRouterConfigured()) {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY!.trim();
      const openRouter = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ApexAI Business Suite',
        },
        timeout: 30000,
        maxRetries: 1,
      });

      const responseStream = await openRouter.chat.completions.create(
        {
          model: descriptor.id,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          stream: true,
          temperature: 0.7,
          max_tokens: 3000,
        },
        { signal: abortSignal }
      );

      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              if (abortSignal?.aborted) {
                controller.close();
                return;
              }
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (err) {
            if (abortSignal?.aborted) {
              try { controller.close(); } catch {}
              return;
            }
            controller.error(err);
          }
        },
      });

      return {
        readable,
        modelUsed: descriptor.id,
        providerUsed: 'openrouter',
        fallbackTriggered: false,
      };
    } catch (openRouterError) {
      console.warn('OpenRouter stream failed, falling through:', openRouterError);
    }
  }

  // 4. OpenAI Provider (US)
  if (descriptor.provider === 'openai' && isOpenAIConfigured()) {
    try {
      const apiKey = process.env.OPENAI_API_KEY!.trim();
      const openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        timeout: 30000,
        maxRetries: 1,
      });

      const responseStream = await openai.chat.completions.create(
        {
          model: descriptor.id,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          stream: true,
          temperature: 0.7,
          max_tokens: 3000,
        },
        { signal: abortSignal }
      );

      const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              if (abortSignal?.aborted) {
                controller.close();
                return;
              }
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (err) {
            if (abortSignal?.aborted) {
              try { controller.close(); } catch {}
              return;
            }
            controller.error(err);
          }
        },
      });

      return {
        readable,
        modelUsed: descriptor.id,
        providerUsed: 'openai',
        fallbackTriggered: false,
      };
    } catch (openaiErr) {
      console.warn('OpenAI stream failed, falling through to Native Engine:', openaiErr);
    }
  }

  // 5. Autonomous Native Engine (Zero external dependencies, guaranteed response)
  const nativeOutput = await runNativeInference(messages, descriptor.id);

  const rawTokens = nativeOutput.split(/(\s+)/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < rawTokens.length; i++) {
    currentChunk += rawTokens[i];
    if (rawTokens[i].includes('\n') || i % 4 === 3 || i === rawTokens.length - 1) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let i = 0; i < chunks.length; i++) {
          if (abortSignal?.aborted) {
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(chunks[i]));
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        controller.close();
      } catch (err) {
        if (abortSignal?.aborted) {
          try { controller.close(); } catch {}
          return;
        }
        controller.error(err);
      }
    },
  });

  return {
    readable,
    modelUsed: 'apexai-native-v2',
    providerUsed: 'native',
    fallbackTriggered: descriptor.provider !== 'native',
  };
}
