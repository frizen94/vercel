# Debug de Sessão no Railway

## Problema Identificado
As requisições para `/api/notifications/unread-count` estão retornando 401 (Unauthorized) no Railway, indicando que a sessão não está sendo mantida corretamente.

## Correções Implementadas

### 1. Trust Proxy Configurado
```typescript
// server/index.ts
app.set('trust proxy', 1);
```

### 2. Rate Limiting Ajustado
```typescript
// server/middlewares.ts
export const loginRateLimit = rateLimit({
  // ... outras configurações
  trustProxy: true,
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return req.ip;
  },
});
```

### 3. Configuração de Sessão Ajustada
```typescript
// server/auth.ts
cookie: {
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: false, // Temporariamente false para debug
  sameSite: 'lax', // Mudado de 'none' para 'lax'
  domain: undefined
},
proxy: isProduction,
name: 'kanban.sid'
```

### 4. Logging Melhorado
- Adicionado debug detalhado no endpoint `/api/notifications/unread-count`
- Criado endpoint `/api/debug/session` para verificar status da sessão
- Melhorado logging de requisições em produção

## Como Testar

### 1. Verificar Status da Sessão
```bash
curl -b cookies.txt https://vercel-production-b07b.up.railway.app/api/debug/session
```

### 2. Fazer Login e Salvar Cookies
```bash
curl -c cookies.txt -X POST https://vercel-production-b07b.up.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Testar Notificações
```bash
curl -b cookies.txt https://vercel-production-b07b.up.railway.app/api/notifications/unread-count
```

### 4. Verificar Logs no Railway
Procure pelos logs de debug que começam com:
- `📥 [GET] /api/notifications/unread-count`
- `Unread-count request:`

## Próximos Passos

Se o problema persistir:

1. **Verificar Headers HTTP**: Confirmar se os cookies estão sendo enviados
2. **Testar com secure: true**: Se o Railway estiver usando HTTPS corretamente
3. **Verificar Store de Sessão**: Confirmar se o MemoryStore está funcionando
4. **Ajustar sameSite**: Tentar 'none' com secure: true se necessário

## Variáveis de Ambiente Importantes

No Railway, certifique-se de ter:
- `NODE_ENV=production`
- `SESSION_SECRET=sua_chave_secreta_forte`
- `PORT=8080` (ou a porta configurada pelo Railway)

## Frontend - Melhorias Implementadas

- Polling de notificações só acontece quando usuário está autenticado
- Retry inteligente que para em caso de erro 401
- Tratamento de erro melhorado para evitar loops infinitos