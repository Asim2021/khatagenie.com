import { useAuthStore } from '../store/authStore';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  statusCode: number;
  data: any;
  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

// In-flight refresh promise to prevent duplicate concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        useAuthStore.getState().clearAuth();
        return null;
      }

      const data = await res.json();
      if (data.token && data.user) {
        useAuthStore.getState().setAuth(data.token, data.user);
        return data.token;
      }

      useAuthStore.getState().clearAuth();
      return null;
    } catch {
      useAuthStore.getState().clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only attach Content-Type: application/json if there is a body and it is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 Unauthorized (except for login or refresh endpoints)
  if (
    res.status === 401 &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh')
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry original request with fresh access token
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };

      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }
    throw new ApiError(errorData.message || 'API request failed', res.status, errorData);
  }

  // Handle blob responses (e.g. downloads)
  const contentType = res.headers.get('content-type') || '';
  if (
    contentType.includes('xml') ||
    contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    contentType.includes('octet-stream') ||
    contentType.includes('pdf') ||
    contentType.includes('zip')
  ) {
    return (await res.blob()) as unknown as T;
  }

  return res.json();
}
