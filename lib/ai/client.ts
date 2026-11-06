import OpenAI from 'openai';

const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'apexai-native-v2'];

export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return false;
  if (apiKey.length < 10) return false;
  if (apiKey.includes('your-openai-api-key') || apiKey === 'sk-your-openai-api-key-here') return false;
  return true;
}

export function isAIConfigured(): boolean {
  // Always true because the Native Trained Enterprise Model is built directly into the server
  return true;
}

export function getActiveProvider(): 'openai' | 'custom-free' | 'native-trained' {
  if (isOpenAIConfigured()) {
    return process.env.OPENAI_BASE_URL ? 'custom-free' : 'openai';
  }
  return 'native-trained';
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!isOpenAIConfigured()) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Falling back to the Native ApexAI Model.'
    );
  }

  const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;

  return new OpenAI({
    apiKey: apiKey!,
    baseURL,
    timeout: 30000,
    maxRetries: 2,
  });
}

export function getDefaultModel(): string {
  if (isOpenAIConfigured()) {
    const envModel = process.env.OPENAI_MODEL?.trim();
    if (envModel && (ALLOWED_MODELS.includes(envModel) || Boolean(process.env.OPENAI_BASE_URL))) {
      return envModel;
    }
    return 'gpt-4o-mini';
  }
  return 'apexai-native-v2';
}

export function sanitizeModel(requestedModel?: string): string {
  if (!requestedModel) return getDefaultModel();
  if (requestedModel === 'apexai-native-v2') return requestedModel;
  if (ALLOWED_MODELS.includes(requestedModel)) return requestedModel;
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
      message: 'Invalid OpenAI API key. Switching automatically to your Native ApexAI Model.',
      isConfigError: true,
    };
  }

  if (err.status === 429 || code === 'insufficient_quota' || message.includes('quota')) {
    return {
      status: 429,
      message:
        'OpenAI API quota exceeded or rate limit reached. Switched to your internal Native ApexAI Model.',
      isConfigError: false,
    };
  }

  if (err.status === 404 || code === 'model_not_found') {
    return {
      status: 404,
      message: 'Requested external model unavailable. Running with Native ApexAI Model.',
      isConfigError: false,
    };
  }

  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNABORTED')) {
    return {
      status: 504,
      message: 'External request timed out. Please try again or switch to Native Model.',
      isConfigError: false,
    };
  }

  return {
    status: err.status || 500,
    message: message || 'An unexpected error occurred while communicating with the AI service.',
    isConfigError: false,
  };
}
