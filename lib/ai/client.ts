import OpenAI from 'openai';

const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!isAIConfigured()) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Please set a valid OPENAI_API_KEY in your .env.local file or server environment variables.'
    );
  }

  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;

  return new OpenAI({
    apiKey: apiKey!,
    baseURL,
    timeout: 45000, // 45-second timeout for server requests
    maxRetries: 2,
  });
}

export function isAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return false;
  if (apiKey.length < 10) return false;
  if (apiKey.includes('your-openai-api-key') || apiKey === 'sk-your-openai-api-key-here') return false;
  return true;
}

export function getDefaultModel(): string {
  const envModel = process.env.OPENAI_MODEL?.trim();
  if (envModel && (ALLOWED_MODELS.includes(envModel) || Boolean(process.env.OPENAI_BASE_URL))) {
    return envModel;
  }
  return 'gpt-4o-mini';
}

export function sanitizeModel(requestedModel?: string): string {
  if (!requestedModel) return getDefaultModel();
  if (ALLOWED_MODELS.includes(requestedModel)) return requestedModel;
  // If a custom base URL is used (e.g. Groq / local Ollama), allow custom model identifiers
  if (process.env.OPENAI_BASE_URL) return requestedModel;
  return getDefaultModel();
}

export function formatAIError(error: unknown): { status: number; message: string; isConfigError: boolean } {
  const err = error as {
    status?: number;
    code?: string;
    message?: string;
    error?: { message?: string; type?: string; code?: string };
  };

  const code = err.code || err.error?.code;
  const message = err.message || err.error?.message || '';

  if (err.status === 401 || code === 'invalid_api_key' || message.includes('Incorrect API key')) {
    return {
      status: 401,
      message: 'Invalid OpenAI API key. Please check the OPENAI_API_KEY value in your .env.local file.',
      isConfigError: true,
    };
  }

  if (err.status === 429 || code === 'insufficient_quota' || message.includes('quota')) {
    return {
      status: 429,
      message:
        'OpenAI API quota exceeded or rate limit reached. Please verify your account billing and active usage tier at https://platform.openai.com/account/billing.',
      isConfigError: false,
    };
  }

  if (err.status === 404 || code === 'model_not_found') {
    return {
      status: 404,
      message: 'The requested AI model is not accessible with your API account. Switching to default model.',
      isConfigError: false,
    };
  }

  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNABORTED')) {
    return {
      status: 504,
      message: 'The AI request timed out. Please try again with a shorter prompt or retry.',
      isConfigError: false,
    };
  }

  if (message.includes('ENOTFOUND') || message.includes('fetch failed')) {
    return {
      status: 502,
      message: 'Network connection to the AI provider failed. Please check internet access or provider status.',
      isConfigError: false,
    };
  }

  return {
    status: err.status || 500,
    message: message || 'An unexpected error occurred while communicating with the AI service.',
    isConfigError: false,
  };
}
