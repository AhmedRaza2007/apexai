import OpenAI from 'openai';

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
    throw new Error(
      'OPENAI_API_KEY is not configured. Please set a valid OPENAI_API_KEY in your .env.local file or server environment.'
    );
  }

  const baseURL = process.env.OPENAI_BASE_URL || undefined;

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export function isAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return Boolean(apiKey && apiKey.length > 5 && !apiKey.includes('your-openai-api-key'));
}

export function getDefaultModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}
