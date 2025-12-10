import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { csrfFetch } from "./csrf";

async function throwIfResNotOk(res: Response) {
  if (!res.ok && res.status !== 409) { // Don't throw for 409 Conflict (duplicate)
    // Tentar extrair mensagem de erro do corpo da resposta
    let errorMessage = '';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || '';
    } catch (e) {
      // Se não conseguir fazer parse do JSON, usar statusText
    }

    // Mensagens amigáveis baseadas no status HTTP
    if (!errorMessage) {
      switch (res.status) {
        case 400:
          errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
          break;
        case 401:
          errorMessage = 'Credenciais inválidas ou sessão expirada.';
          break;
        case 403:
          errorMessage = 'Você não tem permissão para realizar esta ação.';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          break;
        case 429:
          errorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = 'Erro ao processar sua solicitação.';
      }
    }

    throw new Error(errorMessage);
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

  // Configurar headers - NÃO definir Content-Type para FormData (browser faz automaticamente)
  if (!isFormData && headers) {
    config.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  } else if (!isFormData) {
    config.headers = {
      'Content-Type': 'application/json',
    };
  } else if (headers) {
    // Para FormData, só adicionar headers extras se fornecidos (NÃO Content-Type)
    config.headers = headers;
  }
  // Se isFormData e não tem headers extras, deixar undefined para browser definir automaticamente

  // Configurar body
  if (body && (isFormData || Object.keys(body).length > 0)) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  // Usar csrfFetch para incluir automaticamente o token CSRF
  const response = await csrfFetch(url, config);

  if (!response.ok) {
    // Tentar extrair mensagem de erro do corpo da resposta
    let errorMessage = '';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || '';
    } catch (e) {
      // Se não conseguir fazer parse do JSON, ignorar
    }

    // Mensagens amigáveis baseadas no status HTTP
    if (!errorMessage) {
      switch (response.status) {
        case 400:
          errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
          break;
        case 401:
          errorMessage = 'Credenciais inválidas. Verifique seu usuário e senha.';
          break;
        case 403:
          errorMessage = 'Você não tem permissão para realizar esta ação.';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          break;
        case 409:
          errorMessage = 'Este registro já existe no sistema.';
          break;
        case 429:
          errorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos e tente novamente.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = 'Erro ao processar sua solicitação. Tente novamente.';
      }
    }

    throw new Error(errorMessage);
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
      refetchOnReconnect: false, // Não refetch ao reconectar
      refetchOnMount: false, // Não refetch ao montar se dados existirem
      staleTime: 5 * 60 * 1000, // 5 minutos (padrão mais conservador)
      gcTime: 10 * 60 * 1000, // Garbage collection após 10 minutos
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});