'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Volume2,
  FileText,
  UploadCloud,
  Play,
  Pause,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Radio,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  US_EXECUTIVE_VOICES,
  AudioTranscriptResult,
  getLocalAudioItems,
  saveLocalAudioItem,
} from '@/lib/ai/audio';

export default function AudioStudioPage() {
  const [activeTab, setActiveTab] = useState<'transcribe' | 'speak' | 'dictate'>('transcribe');

  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<AudioTranscriptResult | null>(null);
  const [history, setHistory] = useState<AudioTranscriptResult[]>([]);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  // Speech synthesis state
  const [speechText, setSpeechText] = useState(
    'Welcome to ApexAI Enterprise Suite. Our automated intelligence engine has completed your quarterly strategic report with 100% data compliance.'
  );
  const [selectedVoice, setSelectedVoice] = useState('onyx');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [dictatedText, setDictatedText] = useState('');
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const list = getLocalAudioItems();
    setHistory(list);
    if (list.length > 0) {
      setTranscriptResult(list[0]);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    setTranscribeError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed.');
      }

      const result: AudioTranscriptResult = data.result;
      setTranscriptResult(result);
      saveLocalAudioItem(result);
      setHistory((prev) => [result, ...prev.filter((item) => item.id !== result.id)]);
    } catch (err: unknown) {
      const error = err as Error;
      setTranscribeError(error.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSynthesizeVoice = async () => {
    if (!speechText.trim() || isSynthesizing) return;
    setIsSynthesizing(true);

    try {
      const res = await fetch('/api/audio/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText, voice: selectedVoice }),
      });

      if (!res.ok) {
        throw new Error('Speech synthesis failed.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
      alert('Could not synthesize speech.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const toggleDictation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setDictatedText((prev) => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleCopyDictation = () => {
    navigator.clipboard.writeText(dictatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Volume2 className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Voice & Audio Studio</h1>
            <Badge variant="info">Whisper & Neural TTS</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Transcribe meeting recordings, extract action items, synthesize lifelike US executive speech, and dictate prompts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('transcribe')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'transcribe'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Meeting Transcriber
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('speak')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'speak'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Voice Synthesis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dictate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'dictate'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Dictation
          </button>
        </div>
      </div>

      {/* Tab 1: Meeting Transcriber */}
      {activeTab === 'transcribe' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Upload Audio Recording</CardTitle>
                <CardDescription className="text-xs">
                  Upload MP3, WAV, or M4A audio from executive meetings or voice memos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-8 cursor-pointer bg-slate-950/60 transition-colors">
                  <UploadCloud className="h-8 w-8 text-blue-400 mb-2" />
                  <span className="text-xs font-semibold text-white">
                    {isTranscribing ? 'Transcribing via Whisper API...' : 'Click to select audio file'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">Supports MP3, WAV, M4A up to 25MB</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isTranscribing}
                    className="hidden"
                  />
                </label>

                {transcribeError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{transcribeError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Processed Audio ({history.length})</h3>
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setTranscriptResult(item)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                      transcriptResult?.id === item.id
                        ? 'border-blue-500/50 bg-blue-600/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-semibold text-white truncate">{item.fileName}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.actionItems.length} action items
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transcript & Action Items Reader */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white">Meeting Intelligence Memo</CardTitle>
                  {transcriptResult && (
                    <Badge variant="info" className="text-[10px]">
                      OpenAI Whisper-1
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {isTranscribing ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
                    <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
                    <p className="text-xs text-slate-400">Processing audio waveform via neural Whisper model...</p>
                  </div>
                ) : transcriptResult ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-blue-300">Executive Summary</p>
                      <p className="text-xs text-slate-200 leading-relaxed">{transcriptResult.summary}</p>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white">Extracted Action Items & Deliverables</p>
                      <ul className="space-y-1.5">
                        {transcriptResult.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Full Raw Transcript */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <p className="text-xs font-semibold text-slate-400">Full Transcript</p>
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                        {transcriptResult.transcript}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-500">
                    Upload an audio recording on the left to extract the transcript and action items.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Neural Voice Synthesizer */}
      {activeTab === 'speak' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Neural Voice Synthesis</CardTitle>
                <CardDescription className="text-xs">
                  Generate studio-grade spoken audio using US executive voices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Speech Prompt / Script</label>
                  <textarea
                    rows={4}
                    value={speechText}
                    onChange={(e) => setSpeechText(e.target.value)}
                    placeholder="Enter executive briefing or proposal to synthesize into speech..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Voice Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-300">Select Voice</label>
                  <div className="space-y-2">
                    {US_EXECUTIVE_VOICES.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVoice(v.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                          selectedVoice === v.id
                            ? 'border-blue-500 bg-blue-600/15 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{v.name}</span>
                          <span className="text-[10px] text-blue-400 font-mono">{v.provider}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{v.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSynthesizeVoice}
                  disabled={isSynthesizing || !speechText.trim()}
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                >
                  {isSynthesizing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Synthesizing Spoken Audio...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate Spoken Audio
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Audio Player Card */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border-slate-800 bg-slate-900/60">
              <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-950/40">
                <CardTitle className="text-base text-white">Audio Player</CardTitle>
                <CardDescription className="text-xs">
                  Voice playback and MP3 download
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-6 text-center">
                <div className="h-20 w-20 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Volume2 className="h-10 w-10" />
                </div>

                <audio ref={audioRef} controls className="w-full max-w-md" />

                {audioUrl && (
                  <a
                    href={audioUrl}
                    download="apexai_executive_speech.mp3"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download MP3</span>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Live Dictation */}
      {activeTab === 'dictate' && (
        <Card className="border-slate-800 bg-slate-900/60 max-w-4xl mx-auto">
          <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-950/40">
            <CardTitle className="text-base text-white">Live Voice Dictation</CardTitle>
            <CardDescription className="text-xs">
              Speak into your microphone to convert speech into prompt text in real time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6 text-center">
            {/* Big Mic Button */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <button
                type="button"
                onClick={toggleDictation}
                className={`flex h-24 w-24 items-center justify-center rounded-full transition-all shadow-xl ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse shadow-red-500/30'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'
                }`}
              >
                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              </button>
              <p className="text-xs font-semibold text-white">
                {isRecording ? 'Listening... Speak your prompt clearly' : 'Click to start recording voice'}
              </p>
            </div>

            {/* Dictated Text Area */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Captured Speech:</span>
                {dictatedText && (
                  <button
                    type="button"
                    onClick={handleCopyDictation}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}
              </div>
              <div className="min-h-[120px] rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-white leading-relaxed whitespace-pre-wrap">
                {dictatedText || (
                  <span className="text-slate-500 italic">
                    Dictated words will appear here as you speak...
                  </span>
                )}
              </div>

              {dictatedText && (
                <div className="flex justify-end pt-2">
                  <Link href={`/chat?prompt=${encodeURIComponent(dictatedText)}`}>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                      Send to AI Chat Assistant
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
