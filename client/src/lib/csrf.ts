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
  // Adicionar token CSRF para métodos mutantes
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const method = options.method?.toUpperCase() || 'GET';
  
  let headers = options.headers;
  
  if (mutatingMethods.includes(method)) {
    try {
      // Tentar obter token CSRF apenas para métodos mutantes
      const token = csrfToken || await fetchCsrfToken();
      
      // Se já temos headers como Headers object, clonar; senão, criar novo
      if (headers instanceof Headers) {
        headers = new Headers(headers);
        headers.set('X-CSRF-Token', token);
      } else {
        // Para plain objects ou undefined, adicionar o CSRF token
        headers = {
          ...headers,
          'X-CSRF-Token': token
        };
      }
    } catch (error) {
      console.warn('⚠️ CSRF token indisponível, continuando sem proteção CSRF:', error);
      // Continuar sem token CSRF - o servidor decidirá se aceita ou não
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Mudando para include para manter sessões
  });

  // Se recebeu erro 403 (CSRF inválido) e é um método mutante, tentar renovar token
  if (response.status === 403 && mutatingMethods.includes(method)) {
    const errorText = await response.text();
    if (errorText.includes('csrf token') || errorText.includes('invalid csrf')) {
      console.log('🔄 Token CSRF expirado, renovando...');
      try {
        // Renovar token CSRF
        await fetchCsrfToken();
        
        // Tentar novamente com novo token
        let retryHeaders = options.headers;
        if (retryHeaders instanceof Headers) {
          retryHeaders = new Headers(retryHeaders);
          retryHeaders.set('X-CSRF-Token', csrfToken!);
        } else {
          retryHeaders = {
            ...retryHeaders,
            'X-CSRF-Token': csrfToken!
          };
        }
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include'
        });
        
        if (retryResponse.ok) {
          console.log('✅ Requisição repetida com sucesso após renovar token CSRF');
          return retryResponse;
        }
      } catch (retryError) {
        console.error('❌ Falha ao renovar token CSRF:', retryError);
      }
    }
  }

  return response;
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