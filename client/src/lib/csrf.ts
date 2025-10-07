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
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Falha ao obter token CSRF: ${response.status} ${response.statusText}`);
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
  const headers = new Headers(options.headers);
  
  // Adicionar token CSRF para métodos mutantes
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const method = options.method?.toUpperCase() || 'GET';
  
  if (mutatingMethods.includes(method)) {
    try {
      // Tentar obter token CSRF apenas para métodos mutantes
      const token = csrfToken || await fetchCsrfToken();
      headers.set('X-CSRF-Token', token);
    } catch (error) {
      console.warn('⚠️ CSRF token indisponível, continuando sem proteção CSRF:', error);
      // Continuar sem token CSRF - o servidor decidirá se aceita ou não
    }
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Mudando para include para manter sessões
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
    console.warn('⚠️ CSRF não disponível - continuando sem proteção CSRF');
    // Não propagar o erro - deixar a aplicação funcionar
  }
}