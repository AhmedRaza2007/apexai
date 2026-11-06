'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  RefreshCw,
  RotateCcw,
  Key,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  getLocalConversations,
  saveLocalConversation,
  deleteLocalConversation,
  getLocalMessages,
  saveLocalMessages,
  LocalConversation,
  LocalMessage,
} from '@/lib/storage';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export default function ChatAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your **ApexAI Business Assistant**. How can I help you accelerate your business objectives today?\n\nYou can ask me to:\n- **Draft executive communications** and client proposals\n- **Analyze market expansion strategies** and competitive moats\n- **Synthesize meeting minutes** and financial concepts\n- **Formulate OKRs and KPIs** for quarterly planning',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isAIReady, setIsAIReady] = useState<boolean | null>(null);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledUpRef = useRef(false);

  // Check initial server AI configuration status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/ai/status');
        if (res.ok) {
          const data = await res.json();
          setIsAIReady(Boolean(data.ai?.configured));
          if (!data.ai?.configured) {
            setConfigError(
              'OPENAI_API_KEY is not configured on the server. Set your key in .env.local to enable live streaming responses.'
            );
          }
        }
      } catch (e) {
        console.warn('Status check error:', e);
      }
    };
    checkStatus();
  }, []);

  // Load chat conversations from Supabase or LocalStorage
  const loadConversations = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from('conversations')
            .select('id, title, model, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            setConversations(data as LocalConversation[]);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not load from Supabase:', e);
      }
    }

    // LocalStorage fallback for Guest Mode
    const local = getLocalConversations();
    setConversations(local);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle user scroll detection: do not auto-scroll if user scrolled up to read earlier messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    userScrolledUpRef.current = distanceFromBottom > 120;
  };

  const scrollToBottom = () => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setLastFailedPrompt(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Started a fresh session. How can I assist your business objectives right now?',
        createdAt: new Date().toISOString(),
      },
    ]);
    if (isAIReady) setConfigError(null);
  };

  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setLastFailedPrompt(null);
    if (isAIReady) setConfigError(null);
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          setMessages(
            data.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
              createdAt: m.created_at,
            }))
          );
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed loading Supabase messages:', e);
      }
    }

    // LocalStorage fallback
    const localMsgs = getLocalMessages(convId);
    if (localMsgs.length > 0) {
      setMessages(localMsgs);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Session loaded. Ask anything to continue this thread.',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== convId));

    if (activeConversationId === convId) {
      startNewConversation();
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('conversations').delete().eq('id', convId);
      } catch (err) {
        console.warn('Delete conversation failed:', err);
      }
    } else {
      deleteLocalConversation(convId);
    }
  };

  const sendMessage = async (textToSend: string, isRegenerate = false) => {
    if (!textToSend.trim() || isLoading) return;

    setConfigError(null);
    setLastFailedPrompt(null);
    userScrolledUpRef.current = false;

    let baseMessages = messages;

    // If regenerating, remove last assistant response
    if (isRegenerate && messages[messages.length - 1]?.role === 'assistant') {
      baseMessages = messages.slice(0, -1);
    }

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    const newMessages = isRegenerate ? baseMessages : [...baseMessages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Ensure conversation session exists
    let convId = activeConversationId;
    if (!convId) {
      const titleSnippet = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '');

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: conv } = await supabase
              .from('conversations')
              .insert({
                user_id: user.id,
                title: titleSnippet,
                model,
              })
              .select('id, title, model, created_at')
              .single();

            if (conv) {
              convId = conv.id;
              setActiveConversationId(conv.id);
              setConversations((prev) => [conv as LocalConversation, ...prev]);
            }
          }
        } catch (e) {
          console.warn('Could not create Supabase thread:', e);
        }
      }

      // If still not created (Guest Mode), save locally
      if (!convId) {
        const localConv = saveLocalConversation(titleSnippet, model);
        convId = localConv.id;
        setActiveConversationId(convId);
        setConversations((prev) => [localConv, ...prev]);
      }
    }

    // Temporary placeholder for streaming assistant response
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
        throw new Error(errJson.error || `Server returned error status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming response body is unavailable.');
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

      // Persist in LocalStorage if in Guest Mode
      if (convId && !isSupabaseConfigured()) {
        const updatedList: LocalMessage[] = [
          ...newMessages,
          { ...assistantMessage, content: streamedContent },
        ];
        saveLocalMessages(convId, updatedList);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Chat error:', error);
      setConfigError(error.message);
      setLastFailedPrompt(textToSend);
      // Remove empty placeholder
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId || msg.content.length > 0));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    // Find the last user message
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      sendMessage(lastUser.content, true);
    }
  };

  const promptStarters = [
    'Draft a Q4 enterprise expansion strategy',
    'Review key risks in standard SaaS SLA agreements',
    'Generate 5 high-converting B2B cold email hooks',
    'Analyze strategies to reduce client churn by 15%',
  ];

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col lg:flex-row gap-4">
      {/* Sessions Sidebar (Desktop) */}
      <div className="hidden lg:flex w-72 flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4">
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
            Recent Threads ({conversations.length})
          </p>
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                  activeConversationId === c.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="truncate pr-2">{c.title}</span>
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  aria-label="Delete thread"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-slate-500">
              No saved conversations yet.
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="pt-3 border-t border-slate-800">
          <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
            Active Model Engine
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none appearance-none pr-7"
            >
              <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
              <option value="gpt-4o">gpt-4o (Deep Reasoning)</option>
              <option value="gpt-4-turbo">gpt-4-turbo (High Context)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex flex-1 flex-col rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden min-w-0">
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Business Assistant</h2>
              <p className="text-[10px] text-slate-400">
                Engine: <span className="font-mono text-blue-400">{model}</span> • Real-Time Streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setConfirmClearModal(true)}
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              <span className="hidden sm:inline">Reset Thread</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          </div>
        </div>

        {/* API Key Missing or Configuration Banner */}
        {configError && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-950/40 p-4 text-xs text-amber-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="font-semibold text-amber-300">AI Configuration Notice</p>
              <p className="text-amber-200/90 leading-relaxed">{configError}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded bg-black/50 border border-amber-800/40 px-2 py-1 font-mono text-[11px] text-amber-300">
                  OPENAI_API_KEY=sk-your-openai-api-key
                </code>
                <span className="text-slate-400 text-[11px]">in .env.local</span>
                {lastFailedPrompt && (
                  <Button
                    onClick={() => sendMessage(lastFailedPrompt)}
                    size="sm"
                    variant="primary"
                    className="ml-auto text-xs py-1 h-7"
                    leftIcon={<RefreshCw className="h-3 w-3" />}
                  >
                    Retry Prompt
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Stream Container */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isLastAssistant = !isUser && index === messages.length - 1;

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
                  className={`group relative max-w-3xl rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                      : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}

                  {/* Actions Bar for Assistant Responses */}
                  {!isUser && message.content && (
                    <div className="mt-3 pt-2 flex items-center gap-2 border-t border-slate-800/60 text-xs">
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        aria-label="Copy assistant answer"
                        className="flex items-center gap-1 rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Copy response</span>
                          </>
                        )}
                      </button>

                      {isLastAssistant && !isLoading && (
                        <button
                          onClick={handleRegenerate}
                          aria-label="Regenerate response"
                          className="flex items-center gap-1 rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="text-[11px]">Regenerate</span>
                        </button>
                      )}
                    </div>
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

          {/* Streaming loading skeleton */}
          {isLoading && (
            <div className="flex gap-3.5 items-center text-slate-400 text-xs pl-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 animate-pulse">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-medium">Synthesizing executive response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starters Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 bg-slate-950/30 border-t border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-medium mb-1.5">Suggested queries:</p>
            <div className="flex flex-wrap gap-1.5">
              {promptStarters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(starter);
                    textareaRef.current?.focus();
                  }}
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
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
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
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask anything about business strategy, workflows, market analysis, or operations... (Shift+Enter for newline)"
              className="flex-1 max-h-36 min-h-[44px] resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="h-11 px-4 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Reset Thread Confirmation Modal */}
      {confirmClearModal && (
        <Modal
          isOpen={confirmClearModal}
          onClose={() => setConfirmClearModal(false)}
          title="Reset Active Conversation"
          description="Are you sure you want to clear the current messages in this thread?"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              This will reset the visible conversation viewport. Your saved conversations in the sidebar will remain accessible.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setConfirmClearModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  startNewConversation();
                  setConfirmClearModal(false);
                }}
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
