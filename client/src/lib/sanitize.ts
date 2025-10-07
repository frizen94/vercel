import DOMPurify from 'dompurify';

/**
 * Configurações de sanitização para diferentes contextos
 */
const sanitizeConfig = {
  // Para comentários e descrições - permite formatação básica
  rich: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  },
  
  // Para texto simples - remove todas as tags HTML
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  
  // Para URLs - validação de protocolo seguro
  url: {
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  }
};

/**
 * Sanitiza conteúdo HTML permitindo formatação básica
 * Usado para comentários e descrições de cartões
 */
export function sanitizeRichText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, sanitizeConfig.rich);
}

/**
 * Sanitiza removendo todas as tags HTML
 * Usado para títulos, nomes e outros textos simples
 */
export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, sanitizeConfig.text);
}

/**
 * Sanitiza URLs para evitar javascript: e outras execuções perigosas
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // Validar protocolo básico
  const protocolRegex = /^https?:\/\//i;
  if (!protocolRegex.test(url)) {
    return '';
  }
  
  return DOMPurify.sanitize(url, sanitizeConfig.url);
}

/**
 * Sanitiza conteúdo de forma segura antes de renderizar como HTML
 * Detecta automaticamente se precisa de sanitização rich ou text
 */
export function sanitizeForRender(content: string, allowRich = false): string {
  if (allowRich) {
    return sanitizeRichText(content);
  }
  return sanitizeText(content);
}

/**
 * Hook para sanitizar dados de entrada do usuário
 * Pode ser usado em formulários antes de enviar dados
 */
export function sanitizeInput(data: Record<string, any>, richFields: string[] = []): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (richFields.includes(key)) {
        sanitized[key] = sanitizeRichText(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Componente helper para renderizar conteúdo HTML sanitizado
 */
export function createSafeHTML(content: string, allowRich = false) {
  const sanitizedContent = sanitizeForRender(content, allowRich);
  return { __html: sanitizedContent };
}

// Configurar DOMPurify para modo mais seguro
DOMPurify.setConfig({
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  ADD_TAGS: [], // Não adicionar tags customizadas
  ADD_ATTR: [], // Não adicionar atributos customizados
  FORBID_ATTR: ['onerror', 'onload', 'onclick'], // Proibir handlers de evento
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'frame'] // Proibir tags perigosas
});

console.log('✅ Sistema de sanitização XSS inicializado');