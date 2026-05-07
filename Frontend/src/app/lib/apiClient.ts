import { clearAccessToken, getAccessToken, setAccessToken } from './authStore';
import type { User } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

let refreshingPromise: Promise<string | null> | null = null;

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${refreshed}`);
      if (init.body && !retryHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
        retryHeaders.set('Content-Type', 'application/json');
      }

      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      });
      if (!retryRes.ok) throw await toApiError(retryRes);
      if (retryRes.status === 204) return undefined as T;
      return (await retryRes.json()) as T;
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiFetchBlob(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Authorization', `Bearer ${refreshed}`);
      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      });
      if (!retryRes.ok) throw await toApiError(retryRes);
      return retryRes;
    }
  }

  if (!res.ok) throw await toApiError(res);
  return res;
}

export async function loginRequest(email: string, password: string) {
  const res = await apiFetch<{ accessToken: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(res.accessToken);
  return res;
}

export async function refreshAccessToken() {
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          clearAccessToken();
          return null;
        }
        const body = (await res.json()) as { accessToken: string; user: User };
        setAccessToken(body.accessToken);
        return body.accessToken;
      } catch {
        clearAccessToken();
        return null;
      } finally {
        refreshingPromise = null;
      }
    })();
  }
  return refreshingPromise;
}

export async function logoutRequest() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  clearAccessToken();
}

export async function registerRequest(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPasswordRequest(email: string) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

async function toApiError(res: Response) {
  let message = `Request failed with ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error && typeof body.error === 'string') message = body.error;
  } catch {
    // ignore parse error
  }
  const err = new Error(message) as Error & { status?: number };
  err.status = res.status;
  return err;
}

