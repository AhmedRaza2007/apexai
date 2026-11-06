// Autonomous Local & Supabase User Account Engine

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'apexai_current_user',
  REGISTERED_USERS: 'apexai_registered_users',
};

// Simple secure hash simulation for local account password verification
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

interface StoredAccount {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  passwordHash: string;
  createdAt: string;
}

export function getRegisteredUsers(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read registered users:', e);
    return [];
  }
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function registerLocalUser(
  email: string,
  password: string,
  fullName?: string,
  companyName?: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find((u) => u.email === normalizedEmail);
  if (existing) {
    return {
      success: false,
      error: 'An account with this email already exists. Please sign in instead.',
    };
  }

  const name = fullName?.trim() || normalizedEmail.split('@')[0];
  const newAccount: StoredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    fullName: name.charAt(0).toUpperCase() + name.slice(1),
    companyName: companyName?.trim() || 'Enterprise Workspace',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newAccount);

  try {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
    const publicUser: UserAccount = {
      id: newAccount.id,
      email: newAccount.email,
      fullName: newAccount.fullName,
      companyName: newAccount.companyName,
      createdAt: newAccount.createdAt,
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(publicUser));
    // Set a lightweight cookie for Next.js SSR session detection
    document.cookie = `apexai_user=${encodeURIComponent(JSON.stringify(publicUser))}; path=/; max-age=2592000; SameSite=Lax`;
    return { success: true, user: publicUser };
  } catch (e) {
    return { success: false, error: 'Failed to write account to storage.' };
  }
}

export function loginLocalUser(
  email: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const targetHash = hashPassword(password);

  const account = users.find((u) => u.email === normalizedEmail);
  if (!account) {
    // If no account exists yet, automatically create one on first login for a frictionless user experience!
    return registerLocalUser(email, password);
  }

  if (account.passwordHash !== targetHash) {
    return {
      success: false,
      error: 'Invalid password. Please verify your credentials or create a new account.',
    };
  }

  const publicUser: UserAccount = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    companyName: account.companyName,
    createdAt: account.createdAt,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(publicUser));
    document.cookie = `apexai_user=${encodeURIComponent(JSON.stringify(publicUser))}; path=/; max-age=2592000; SameSite=Lax`;
    return { success: true, user: publicUser };
  } catch (e) {
    return { success: false, error: 'Failed to set session.' };
  }
}

export function logoutLocalUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    document.cookie = 'apexai_user=; path=/; max-age=0; SameSite=Lax';
  } catch (e) {
    console.warn('Logout error:', e);
  }
}
