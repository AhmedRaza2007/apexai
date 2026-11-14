// ApexAI Voice & Audio Intelligence Architecture
// Powered by US-based OpenAI Whisper & ElevenLabs Voice Synthesis

export interface AudioTranscriptResult {
  id: string;
  fileName: string;
  durationSeconds: number;
  transcript: string;
  summary: string;
  actionItems: string[];
  speakersCount?: number;
  createdAt: string;
}

export interface VoiceSynthesisRequest {
  text: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'adam' | 'rachel';
  speed?: number;
}

export const US_EXECUTIVE_VOICES = [
  { id: 'onyx', name: 'Onyx (Deep Executive)', provider: 'OpenAI US', gender: 'Male', description: 'Authoritative, calm, and polished for executive summaries.' },
  { id: 'nova', name: 'Nova (Dynamic Tech)', provider: 'OpenAI US', gender: 'Female', description: 'Energetic, modern, and crisp for product pitches.' },
  { id: 'alloy', name: 'Alloy (Balanced Neutral)', provider: 'OpenAI US', gender: 'Neutral', description: 'Evenly paced, clear, and professional.' },
  { id: 'echo', name: 'Echo (Conversational)', provider: 'OpenAI US', gender: 'Male', description: 'Warm and natural for internal meetings and briefings.' },
  { id: 'shimmer', name: 'Shimmer (Expressive)', provider: 'OpenAI US', gender: 'Female', description: 'Smooth, resonant, and engaging.' },
];

const STORAGE_KEY_AUDIO = 'apexai_saved_audio';

export function getLocalAudioItems(): AudioTranscriptResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIO);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read audio items:', e);
  }
  return [];
}

export function saveLocalAudioItem(item: AudioTranscriptResult): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalAudioItems();
    const updated = [item, ...list.filter((a) => a.id !== item.id)];
    localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify(updated.slice(0, 20)));
  } catch (e) {
    console.warn('Could not save audio item:', e);
  }
}
