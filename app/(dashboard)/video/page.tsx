'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Play,
  Pause,
  Download,
  Share2,
  Clock,
  Layers,
  Wand2,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  VideoStyle,
  AspectRatio,
  VideoDuration,
  VideoResolution,
  VIDEO_STYLES,
  VideoProject,
  calculateVideoCreditCost,
  enhanceVideoPrompt,
  getLocalVideoProjects,
  saveLocalVideoProject,
} from '@/lib/ai/video';
import {
  getClientSubscription,
  deductVideoCredits,
  SUBSCRIPTION_PLANS,
} from '@/lib/subscription';

export default function VideoStudioPage() {
  const [mode, setMode] = useState<'text_to_video' | 'image_to_video'>('text_to_video');
  const [prompt, setPrompt] = useState(
    'A futuristic drone flying over a neon-lit cybernetic city during rainfall, cinematic camera zoom'
  );
  const [imageUrl, setImageUrl] = useState('');
  const [style, setStyle] = useState<VideoStyle>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
  const [history, setHistory] = useState<VideoProject[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [enhancedActive, setEnhancedActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const sub = getClientSubscription();
    setCreditBalance(sub.videoCreditsBalance);
    const saved = getLocalVideoProjects();
    setHistory(saved);
    if (saved.length > 0) {
      setActiveProject(saved[0]);
    }
  }, []);

  const requiredCredits = calculateVideoCreditCost(duration, resolution);

  const handleEnhancePrompt = () => {
    if (!prompt.trim()) return;
    const enhanced = enhanceVideoPrompt(prompt, style);
    setPrompt(enhanced);
    setEnhancedActive(true);
    setTimeout(() => setEnhancedActive(false), 2500);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setErrorNotice(null);

    // Verify user has sufficient credits
    const deduction = deductVideoCredits(requiredCredits);
    if (!deduction.success) {
      setErrorNotice(deduction.error || 'Insufficient video credits. Please upgrade your subscription.');
      return;
    }

    setCreditBalance(deduction.remaining);
    setIsGenerating(true);
    setGenerationStep(1);

    // Step progression animation
    const stepTimer = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepTimer);
          return 4;
        }
        return prev + 1;
      });
    }, 1800);

    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          prompt,
          sourceImageUrl: mode === 'image_to_video' ? imageUrl : undefined,
          style,
          aspectRatio,
          duration,
          resolution,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to render video.');
      }

      const project: VideoProject = data.project;
      setActiveProject(project);
      saveLocalVideoProject(project);
      setHistory((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorNotice(error.message);
    } finally {
      clearInterval(stepTimer);
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Film className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Video Studio</h1>
            <Badge variant="warning">Pro & Business</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Synthesize high-definition motion videos from text descriptions or reference imagery.
          </p>
        </div>

        {/* Credit Meter & Top-up */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Balance:</span>
            <span className="font-bold text-white">{creditBalance}</span>
            <span className="text-[11px] text-slate-400">credits</span>
          </div>

          <Link href="/pricing">
            <Button variant="outline" size="sm" className="text-xs">
              Get Credits
            </Button>
          </Link>
        </div>
      </div>

      {/* Error / Upgrade Alert */}
      {errorNotice && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-amber-300">Credit Balance Notice</p>
            <p className="leading-relaxed text-amber-200/90">{errorNotice}</p>
          </div>
          <Link href="/pricing">
            <Button variant="primary" size="sm" className="text-xs shrink-0">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Configuration Form (Left) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white">Generation Parameters</CardTitle>
                <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('text_to_video')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      mode === 'text_to_video'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Text to Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('image_to_video')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      mode === 'image_to_video'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Image to Video
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Input for Image to Video */}
              {mode === 'image_to_video' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Source Image URL or Asset
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Prompt Input & AI Enhancement */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">Motion Prompt</label>
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    className="flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>{enhancedActive ? 'Prompt Enhanced!' : '✨ Enhance with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe camera movement, lighting, motion dynamics, and subject..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Style Selection Grid */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Visual Aesthetic</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VIDEO_STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                        style === s.id
                          ? 'border-blue-500 bg-blue-600/15 text-white shadow-sm shadow-blue-500/20'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-semibold truncate">{s.label}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio, Duration & Resolution Row */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Reels/TikTok</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) as VideoDuration)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value={3}>3 Seconds</option>
                    <option value={5}>5 Seconds</option>
                    <option value={10}>10 Seconds</option>
                  </select>
                </div>

                {/* Resolution */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-400">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as VideoResolution)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                  </select>
                </div>
              </div>

              {/* Submit Button with Credit Cost */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  variant="primary"
                  size="md"
                  className="w-full justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Synthesizing Motion Clip...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Video ({requiredCredits} Credits)
                    </span>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-400">
                  Estimated cost: <strong className="text-white">{requiredCredits} credits</strong> • Available: <strong className="text-white">{creditBalance} credits</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Player & Rendering Monitor (Right) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white">Video Preview</CardTitle>
                  <CardDescription className="text-xs">
                    {activeProject ? activeProject.title : 'Ready to synthesize'}
                  </CardDescription>
                </div>
                {activeProject && (
                  <Badge variant="info" className="text-[10px]">
                    {activeProject.resolution} • {activeProject.duration}s
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Generation Progress Overlay */}
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4 aspect-video bg-slate-950 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Film className="h-8 w-8 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <p className="text-sm font-semibold text-white">
                      {generationStep === 1 && 'Analyzing visual prompt & composition...'}
                      {generationStep === 2 && 'Synthesizing latent diffusion keyframes...'}
                      {generationStep === 3 && 'Interpolating temporal motion vectors...'}
                      {generationStep >= 4 && 'Finalizing MP4 video encode...'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Processing on neural video cluster ({style} style, {resolution})
                    </p>
                  </div>
                  <div className="w-48 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${generationStep * 25}%` }}
                    />
                  </div>
                </div>
              ) : activeProject ? (
                <div className="relative group bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={activeProject.videoUrl}
                    controls
                    playsInline
                    loop
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center aspect-video bg-slate-950 text-slate-500 space-y-2">
                  <Video className="h-10 w-10 text-slate-600" />
                  <p className="text-xs">No video generated yet. Configure options on the left to start.</p>
                </div>
              )}

              {/* Action Toolbar for Generated Video */}
              {activeProject && !isGenerating && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="truncate text-slate-400 min-w-0">
                    <span className="text-white font-medium">Style: </span>
                    <span className="capitalize">{activeProject.style.replace('_', ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={activeProject.videoUrl}
                      download={`apexai-video-${activeProject.id}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download MP4</span>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Generation History */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Recent Generations ({history.length})</h3>
            {history.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveProject(item)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                      activeProject?.id === item.id
                        ? 'border-blue-500/50 bg-blue-600/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="capitalize">{item.style.replace('_', ' ')}</span>
                      <span>{item.duration}s • {item.resolution}</span>
                    </div>
                    <p className="text-xs font-medium text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Your created video clips will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
