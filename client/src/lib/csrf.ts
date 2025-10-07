/**
 * Utilitário para gerenciar tokens CSRF no frontend
 */

let csrfToken: string | null = null;

/**
 * Obtém o token CSRF do servidor
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error('Falha ao obter token CSRF');
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken!;
  } catch (error) {
    console.error('Erro ao obter token CSRF:', error);
    throw error;
  }
}

/**
 * Retorna o token CSRF atual (em cache)
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Fetch customizado que inclui automaticamente o token CSRF
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = csrfToken || await fetchCsrfToken();
  
  const headers = new Headers(options.headers);
  
  // Adicionar token CSRF para métodos mutantes
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const method = options.method?.toUpperCase() || 'GET';
  
  if (mutatingMethods.includes(method)) {
    headers.set('X-CSRF-Token', token);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin'
  });
}

/**
 * Inicializar o sistema CSRF - deve ser chamado no boot da aplicação
 */
export async function initializeCsrf(): Promise<void> {
  try {
    await fetchCsrfToken();
    console.log('✅ Sistema CSRF inicializado');
  } catch (error) {
    console.warn('⚠️ Falha ao inicializar CSRF:', error);
  }
}