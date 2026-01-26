const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type RequestOptions = RequestInit & { token?: string | null };

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }
  return response.json() as Promise<T>;
}

export function apiLogin(username: string, password: string) {
  return apiRequest<{ accessToken: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function apiGet<T>(path: string, token: string | null) {
  return apiRequest<T>(path, { token });
}

export function apiPost<T>(path: string, body: unknown, token: string | null) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function apiPatch<T>(path: string, body: unknown, token: string | null) {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

export function apiDelete<T>(path: string, token: string | null) {
  return apiRequest<T>(path, {
    method: 'DELETE',
    token,
  });
}
