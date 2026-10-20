'use client';

export const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export type User = {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
};

const TOKEN_KEY = 'evalops_auth_token';
const USER_KEY = 'evalops_auth_user';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function authFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // Only redirect if not already on login or register or landing pages
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register' && path !== '/' && path !== '/privacy' && path !== '/terms' && path !== '/docs') {
      clearSession();
      window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
    }
  }

  return response;
}

export async function logout(): Promise<void> {
  try {
    await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch {
    // Continue logout even if network request fails
  } finally {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
