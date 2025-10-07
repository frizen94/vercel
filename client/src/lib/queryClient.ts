import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { csrfFetch } from "./csrf";

async function throwIfResNotOk(res: Response) {
  if (!res.ok && res.status !== 409) { // Don't throw for 409 Conflict (duplicate)
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string = 'GET',
  url: string,
  body?: any,
  headers?: Record<string, string>,
  isFormData: boolean = false
): Promise<any> {
  const config: RequestInit = {
    method,
    credentials: 'include',
  };

  // Configurar headers
  if (!isFormData) {
    config.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  } else if (headers) {
    config.headers = headers;
  }

  // Configurar body
  if (body && Object.keys(body).length > 0) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  // Usar csrfFetch para incluir automaticamente o token CSRF
  const response = await csrfFetch(url, config);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Handle responses with no content (204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  // Check if response has JSON content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // For other content types or empty responses, return text
  const text = await response.text();
  return text || null;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});