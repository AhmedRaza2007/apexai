'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Key,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your AI Business Assistant. How can I help you today? You can ask me to draft executive communications, evaluate marketing strategies, analyze operational bottlenecks, or brainstorm new revenue streams.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat conversations from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      const fetchConversations = async () => {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data } = await supabase
              .from('conversations')
              .select('id, title, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (data) {
              setConversations(data);
            }
          }
        } catch (e) {
          console.warn('Could not load chat sessions:', e);
        }
      };

      fetchConversations();
    }
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Started a fresh session. How can I assist your business objectives right now?',
        createdAt: new Date().toISOString(),
      },
    ]);
    setConfigError(null);
  };

  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setConfigError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setMessages(data as Message[]);
      }
    } catch (e) {
      console.warn('Failed to load conversation messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setConfigError(null);
    const userText = input.trim();
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Ensure conversation exists in DB if user is signed in
    let convId = activeConversationId;
    if (!convId && isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const titleSnippet = userText.slice(0, 32) + (userText.length > 32 ? '...' : '');
          const { data: conv } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title: titleSnippet,
              model,
            })
            .select('id, title, created_at')
            .single();

          if (conv) {
            convId = conv.id;
            setActiveConversationId(conv.id);
            setConversations((prev) => [conv, ...prev]);
          }
        }
      } catch (err) {
        console.warn('Could not create conversation record:', err);
      }
    }

    // Temporary placeholder for assistant streaming response
    const assistantId = `ast-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
          conversationId: convId,
          model,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body stream is not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: streamedContent } : msg
          )
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Chat error:', error);
      setConfigError(error.message);
      // Remove empty placeholder if failed
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId || msg.content.length > 0));
    } finally {
      setIsLoading(false);
    }
  };

  const promptStarters = [
    'Draft a Q4 enterprise expansion strategy',
    'Review key risks in standard SaaS SLA agreements',
    'Generate 5 compelling angles for B2B cold outreach',
    'Analyze strategies to reduce client churn by 15%',
  ];

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col lg:flex-row gap-4">
      {/* Sessions Sidebar (Desktop) */}
      <div className="hidden lg:flex w-64 flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <Button
          onClick={startNewConversation}
          variant="primary"
          size="sm"
          className="w-full justify-start"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Conversation
        </Button>

        <div className="mt-4 flex-1 overflow-y-auto space-y-1">
          <p className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Recent Threads
          </p>
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left truncate rounded-lg px-2.5 py-2 text-xs transition-colors ${
                  activeConversationId === c.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {c.title}
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-slate-500">
              No saved threads yet.
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="pt-3 border-t border-slate-800">
          <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
            Active AI Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (Fast & Efficient)</option>
            <option value="gpt-4o">gpt-4o (Deep Reasoning)</option>
            <option value="gpt-4-turbo">gpt-4-turbo</option>
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Business Assistant</h2>
              <p className="text-[10px] text-slate-400">Model: {model} • Streaming Enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={startNewConversation}
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Reset Chat
            </Button>
          </div>
        </div>

        {/* API Key Missing or Config Error Warning */}
        {configError && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-950/40 p-4 text-xs text-amber-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Configuration Required</p>
              <p className="mt-1 text-amber-200/90 leading-relaxed">{configError}</p>
              <div className="mt-2.5 flex items-center gap-2">
                <code className="rounded bg-black/40 px-2 py-1 text-[11px] text-amber-300">
                  OPENAI_API_KEY=your_key_here
                </code>
                <span className="text-slate-400">in .env.local</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                      : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {!isUser && message.content && (
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 rounded-md p-1 bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-slate-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Streaming loading indicator */}
          {isLoading && (
            <div className="flex gap-3.5 items-center text-slate-400 text-xs pl-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 animate-pulse">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2">Synthesizing executive response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starters */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 bg-slate-950/30 border-t border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium mb-1.5">Recommended queries:</p>
            <div className="flex flex-wrap gap-1.5">
              {promptStarters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(starter)}
                  className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 bg-slate-950/60 border-t border-slate-800/80"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask anything about business operations, communications, strategy, or market analysis..."
              className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={isLoading || !input.trim()}
              className="h-11 px-4 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
