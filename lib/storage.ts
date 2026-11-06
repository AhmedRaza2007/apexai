// Client-side LocalStorage Persistence Engine for Guest Mode

export interface LocalSavedItem {
  id: string;
  title: string;
  tool_type: string;
  generated_content: string;
  input_params: Record<string, unknown>;
  tags: string[];
  created_at: string;
}

export interface LocalConversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
}

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  SAVED_CONTENT: 'apexai_saved_content',
  CONVERSATIONS: 'apexai_chat_conversations',
  MESSAGES_PREFIX: 'apexai_chat_messages_',
};

// 1. Saved Content Methods
export function getLocalSavedContent(): LocalSavedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_CONTENT);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read saved content from localStorage:', e);
    return [];
  }
}

export function saveLocalContentItem(item: Omit<LocalSavedItem, 'id' | 'created_at'>): LocalSavedItem {
  const existing = getLocalSavedContent();
  const newItem: LocalSavedItem = {
    ...item,
    id: `local-saved-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_CONTENT, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to write to localStorage:', e);
  }
  return newItem;
}

export function deleteLocalContentItem(id: string): void {
  const existing = getLocalSavedContent();
  const filtered = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_CONTENT, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to delete from localStorage:', e);
  }
}

// 2. Chat Conversation Methods
export function getLocalConversations(): LocalConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read conversations from localStorage:', e);
    return [];
  }
}

export function saveLocalConversation(title: string, model: string = 'gpt-4o-mini'): LocalConversation {
  const existing = getLocalConversations();
  const newConv: LocalConversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    model,
    created_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify([newConv, ...existing]));
  } catch (e) {
    console.warn('Failed to save conversation to localStorage:', e);
  }
  return newConv;
}

export function deleteLocalConversation(id: string): void {
  const existing = getLocalConversations();
  const filtered = existing.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
    localStorage.removeItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${id}`);
  } catch (e) {
    console.warn('Failed to delete conversation:', e);
  }
}

// 3. Chat Messages Methods
export function getLocalMessages(conversationId: string): LocalMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read messages from localStorage:', e);
    return [];
  }
}

export function saveLocalMessages(conversationId: string, messages: LocalMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`, JSON.stringify(messages));
  } catch (e) {
    console.warn('Failed to save messages to localStorage:', e);
  }
}
