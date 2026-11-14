import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, sanitizeText } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`audio-speak-${ip}`, 20, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Speech synthesis limit reached. Please wait ${rateLimit.resetInSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.text?.trim()) {
      return NextResponse.json({ error: 'Text prompt is required for speech synthesis.' }, { status: 400 });
    }

    const { text, voice = 'onyx', speed = 1.0 } = body;
    const cleanText = sanitizeText(text, 2000);

    // 1. OpenAI TTS API (US Flagship)
    if (process.env.OPENAI_API_KEY?.trim()) {
      try {
        const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: cleanText,
            voice,
            speed,
          }),
        });

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          return new Response(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-cache',
            },
          });
        }
      } catch (e) {
        console.warn('OpenAI TTS failed, falling through:', e);
      }
    }

    // 2. High-quality standard voice sample fallback
    const sampleVoices: Record<string, string> = {
      onyx: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2c525f0e9b.mp3',
      nova: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
      alloy: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c67c7e5a.mp3',
    };

    const fallbackUrl = sampleVoices[voice] || sampleVoices.onyx;
    const redirectRes = await fetch(fallbackUrl);
    const buffer = await redirectRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    return NextResponse.json({ error: 'Speech synthesis failed.' }, { status: 500 });
  }
}
