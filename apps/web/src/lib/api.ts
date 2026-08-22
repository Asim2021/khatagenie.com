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

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('kg_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If sending FormData, delete Content-Type to allow browser to set boundary
  if (options.body instanceof FormData) {
    delete (headers as any)['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

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
  const contentType = res.headers.get('content-type');
  if (contentType && (contentType.includes('application/xml') || contentType.includes('spreadsheetml') || contentType.includes('octet-stream'))) {
    return res.blob() as Promise<T>;
  }

  return res.json();
}
