// ApexAI Video Studio Architecture
// Supports Text-to-Video, Image-to-Video, Prompt Enhancement, and Multi-Provider Rendering

export type VideoStyle =
  | 'cinematic'
  | 'photorealistic'
  | 'anime'
  | '3d_render'
  | 'cyberpunk'
  | 'corporate_minimal';

export type AspectRatio = '16:9' | '9:16' | '1:1';
export type VideoDuration = 3 | 5 | 10;
export type VideoResolution = '720p' | '1080p';

export interface VideoGenerationParams {
  mode: 'text_to_video' | 'image_to_video';
  prompt: string;
  sourceImageUrl?: string;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  resolution: VideoResolution;
  motionStrength?: number; // 1-10
}

export interface VideoProject {
  id: string;
  title: string;
  mode: 'text_to_video' | 'image_to_video';
  prompt: string;
  enhancedPrompt?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  duration: VideoDuration;
  resolution: VideoResolution;
  creditsUsed: number;
  provider: 'fal_ai' | 'replicate' | 'huggingface' | 'apexai_studio_engine';
  createdAt: string;
  status: 'processing' | 'completed' | 'failed';
}

export const VIDEO_STYLES: Array<{ id: VideoStyle; label: string; description: string }> = [
  { id: 'cinematic', label: 'Cinematic Movie', description: '35mm anamorphic lens, dramatic lighting, Hollywood grade color.' },
  { id: 'photorealistic', label: 'Hyper-Realistic', description: 'Ultra-crisp 8k textures, natural daylight, DSLR depth of field.' },
  { id: '3d_render', label: '3D Pixar/Octane', description: 'Vibrant ray-traced lighting, smooth stylized character motion.' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', description: 'Volumetric neon haze, futuristic rain reflections, dark synth palette.' },
  { id: 'anime', label: 'Studio Anime', description: 'Hand-drawn aesthetic, high frame-rate sakuga action, vibrant cel shading.' },
  { id: 'corporate_minimal', label: 'Corporate Modern', description: 'Sleek tech aesthetics, minimal clean gradients, product launch pacing.' },
];

export function calculateVideoCreditCost(duration: VideoDuration, resolution: VideoResolution): number {
  let cost = 3;
  if (duration === 5) cost = 5;
  if (duration === 10) cost = 10;
  if (resolution === '1080p') cost += 2;
  return cost;
}

export function enhanceVideoPrompt(rawPrompt: string, style: VideoStyle): string {
  const styleKeywords: Record<VideoStyle, string> = {
    cinematic: 'anamorphic lens flare, shallow depth of field, 24fps motion blur, Kodak Vision3 500T color grade, dramatic rim lighting',
    photorealistic: 'shot on Arri Alexa Mini, natural ambient sunlight, 8k resolution, micro-textures, photorealistic physics',
    '3d_render': 'Octane render, Unreal Engine 5 Lumen lighting, subsurface scattering, stylized 3D animation, pristine shading',
    cyberpunk: 'glowing neon cyan and magenta reflections, dystopian rain street, volumetric fog, futuristic UI projections',
    anime: 'Studio Ghibli & Makoto Shinkai aesthetic, hand-drawn keyframes, expressive character movement, vibrant watercolor sky',
    corporate_minimal: 'clean Apple-style key visuals, modern glassmorphic architectural space, elegant slow dolly zoom, smooth 60fps',
  };

  return `${rawPrompt.trim()}, ${styleKeywords[style]}, smooth camera tracking, ultra-high dynamic range, pristine rendering.`;
}

// Local storage helper for generation history
const STORAGE_KEY_VIDEOS = 'apexai_video_projects';

export function getLocalVideoProjects(): VideoProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read video projects:', e);
  }
  return [];
}

export function saveLocalVideoProject(project: VideoProject): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalVideoProjects();
    const updated = [project, ...list.filter((p) => p.id !== project.id)];
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(updated.slice(0, 30)));
  } catch (e) {
    console.warn('Could not save video project:', e);
  }
}
