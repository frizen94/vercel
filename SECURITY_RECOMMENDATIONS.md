# SECURITY_RECOMMENDATIONS

Este documento consolida a análise de segurança (foco em desenvolvimento e deploy a nível de aplicação — sem recomendações de infraestrutura) e traz um plano priorizado de ações concretas para deixar o sistema mais seguro.

> Data da análise: 07/10/2025

---

## Status de Implementação (Atualizado em 07/10/2025)

### ✅ IMPLEMENTADO (Prioridade ALTA)
- ✅ Hardening de sessão/cookies (httpOnly, secure, sameSite, rotation)
- ✅ Rate limiting em endpoints sensíveis (login, change-password, registro) 
- ✅ Headers de segurança (helmet + CSP mínimo)
- ✅ Validação consistente com Zod + limites maxLength
- ✅ Remoção de logs sensíveis e tratamento global de erros
- ✅ Proteção CSRF (middleware csurf + tokens automáticos)
- ✅ Sanitização XSS (DOMPurify frontend com helpers seguros)
- ✅ Proteção SQL injection (Drizzle ORM + queries parametrizadas)

### 🔄 PRÓXIMAS IMPLEMENTAÇÕES (Prioridade MÉDIA)
- 🔄 Testes de autorização automatizados - **PRÓXIMA**
- 🔄 Melhorias na proteção de uploads
- 🔄 Força de hashing de senhas (bcrypt rounds ou argon2)

## Sumário executivo (rápido)

Prioridade ALTA (fazer já)
- ✅ Hardening de sessão/cookies (httpOnly, secure, sameSite, rotation)
- 🔄 Proteção CSRF (tokens ou double-submit cookie) - **PENDENTE**
- ✅ Rate limiting em endpoints sensíveis (login, change-password, registro)
- ✅ Validação consistente com Zod + sanitização de entradas/saídas (XSS)
- ✅ Headers de segurança (helmet + CSP mínimo)
- ✅ Evitar logs/exposição de dados sensíveis (error handling)

Prioridade MÉDIA
- Proteção de uploads (armazenamento, validações reforçadas, scanning opcional)
- Hashing forte de senhas (bcrypt >=12 ou argon2)
- Auditoria de autorização/ACL e testes de autorização
- CORS restrito (whitelist)
- Revogação/invalidação de sessões em mudanças críticas

Prioridade BAIXA / Aperfeiçoamentos
- MFA/TOTP para admins
- Password reset seguro (tokens curtos, hashed, single-use)
- SAST/DAST no CI (semgrep, eslint-plugin-security, Snyk)
- Dependabot / Renovate + npm audit na pipeline
- Pre-commit hook para detectar segredos

---

## Detalhamento e ações concretas

### Prioridade ALTA

1) Sessões e Cookies seguros
- Onde: `server/auth.ts` (ou onde `express-session` é configurado) e entrypoint do servidor.
- O que aplicar:
  - `cookie.secure = true` em produção (use `process.env.NODE_ENV === 'production'`)
  - `cookie.httpOnly = true`
  - `cookie.sameSite = 'lax'` (ou `strict` quando compatível)
  - `cookie.maxAge` com limite razoável (ex.: 1 dia / 24h) e opção `rolling` para refresh de sessão
  - Regenerar session id ao autenticar (prevent session fixation): `req.session.regenerate()`
  - Use `SESSION_SECRET` forte (não commitar)

2) Proteção CSRF
- Onde: `server/middlewares.ts` e `server/routes.ts` (aplicar globalmente ou em roteadores que mutam estado)
- O que aplicar:
  - Adicionar middleware `csurf` (ou implementar double-submit cookie)
  - Fornecer token via endpoint GET ou injetar no HTML do SPA (quando necessário)
  - Frontend: enviar token no header `X-CSRF-Token` em chamadas POST/PATCH/DELETE

3) Rate limiting / prevenção de brute-force
- Onde: `server/middlewares.ts` e aplicar em rota `POST /api/login` e endpoints sensíveis
- O que aplicar:
  - `express-rate-limit` ou `rate-limiter-flexible` com limites por IP e por conta
  - Implementar delay/backoff e logs de tentativas

4) Validação e sanitização (XSS / SQL injection)
- Onde: `server/routes.ts`, `shared/schema.ts`, componentes de frontend que exibem HTML (ex: comentários)
- O que aplicar:
  - Garantir uso de Zod (`insert*Schema`) para todas rotas que aceitam body/query params
  - Definir `maxLength` e limites para strings nos schemas
  - Sanitizar HTML no backend (opcional) ou no frontend ao renderizar (usar `DOMPurify` no cliente)
  - Assegurar queries parametrizadas (Drizzle / sql param binding)

5) Security headers
- Onde: entrypoint do servidor (onde `app` é criado / `registerRoutes` é chamado)
- O que aplicar:
  - `helmet()` e configurar CSP mínima (permitir origem do frontend, fontes necessárias)
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`

6) Evitar exposição de erros e logs sensíveis
- Onde: `server/routes.ts` e onde há `console.log` (ex.: logs de bodies)
- O que aplicar:
  - Remover logs de request bodies com dados sensíveis
  - Implementar middleware global de error handling que retorna mensagens genéricas ao cliente
  - Registrar detalhes dos erros em logs internos (ferramenta de log central) e não no response

### Prioridade MÉDIA

7) Uploads de arquivos
- Onde: configuração do multer em `server/routes.ts`
- O que aplicar:
  - Manter verificação MIME + extensão + tamanho
  - Armazenar arquivos fora do web root ou servir via rota que valida permissões
  - Sanitizar nomes de arquivo e usar nomes únicos (já feito)
  - (Opcional) Scan de malware no pipeline com ClamAV

8) Hashing e política de senha
- Onde: `server/auth.ts` e `shared/schema.ts`
- O que aplicar:
  - Bcrypt com salt rounds >= 12, ou migrar para `argon2` (mais resistente)
  - Implemente validação de força de senha no registro e mudança de senha (minLength >= 8/10 e checks básicos)

9) Auditoria de autorização / testes
- Onde: `server/routes.ts` e `server/middlewares.ts`
- O que aplicar:
  - Auditar que todas rotas sensíveis usam `isAuthenticated`, `isBoardOwnerOrAdmin` ou `hasCardAccess`
  - Criar testes de integração (supertest + jest) que tentam executar ações sem permissão

10) CORS
- Onde: entrypoint do servidor
- O que aplicar:
  - Configurar `cors` com whitelist (não usar `*`), ativar `credentials: true` apenas para origens confiáveis

11) Sessões: revogação e logout forçado
- Onde: `server/auth.ts`, `server/routes.ts` (change-password / delete user)
- O que aplicar:
  - Invalidar sessões ao trocar senha ou remover conta (limpar session store)
  - Implementar endpoint admin para invalidar sessions se necessário

✅ 12) SQL injection / binding
- Onde: `server/db-storage.ts`, `server/database.ts`
- **Status: PROTEGIDO** - Sistema usa Drizzle ORM com queries parametrizadas
- O que aplicar:
  - ✅ Confirmar queries parametrizadas; evitar concatenação de strings
  - ✅ Revisar funções que constroem SQL dinamicamente
- **Implementação**: 
  - Drizzle ORM garante queries parametrizadas automaticamente
  - Todas as consultas usam `.where(eq())`, `.insert()`, `.update()`, `.delete()` com binding seguro
  - Poucas queries SQL diretas usam tagged templates com binding (`sql\`SELECT...\``)
  - Zero concatenação de strings em queries SQL

### Prioridade BAIXA / Melhoria contínua

13) MFA/TOTP para administradores
14) Password reset com tokens single-use curtíssimos
15) Auditoria/monitoramento de segurança, logs imutáveis
16) SAST/DAST em CI (semgrep, snyk, eslint-plugin-security)
17) Dependabot / Renovate + `npm audit` em CI
18) Pre-commit hooks para detectar segredos no commit

---

## Arquivos-alvo para aplicação das mudanças

- `server/auth.ts` — configuração de sessão, password hashing, regenerate, logout
- `server/middlewares.ts` — rate limiter, csurf wrapper, global error handler
- `server/routes.ts` — remover logs sensíveis, aplicar validações, revisar autorizações por rota
- `server/db-storage.ts` / `server/database.ts` — revisar queries e binding
- `shared/schema.ts` — adicionar limites (maxLength) e validações adicionais
- Frontend (`client/src/...`) — enviar token CSRF em chamadas, sanitizar render de HTML (ex: comentários), não expor segredos
- Entrypoint (onde `registerRoutes` é usado) — adicionar `helmet`, `cors` configurado
- CI config (ex.: `.github/workflows/*`) — adicionar `npm audit`, semgrep/snyk, testes

---

## Pacotes recomendados

- helmet
- csurf (ou solução alternativa de CSRF)
- express-rate-limit ou rate-limiter-flexible
- sanitize-html (backend) e DOMPurify (frontend)
- argon2 (opcional) ou bcrypt (com rounds >= 12)
- eslint-plugin-security, semgrep, snyk
- git-secrets / detect-secrets para hooks

---

## Plano mínimo recomendável (3 commits rápidos)

Commit 1 — Hardening básico (rápido, baixo risco)
- Adicionar `helmet()`
- Configurar cookie flags (secure/httpOnly/sameSite/maxAge)
- Remover `console.log` sensíveis
- Adicionar middleware global de error handler

Commit 2 — Proteções contra CSRF & rate limiting
- Adicionar `csurf` (ou double-submit) e expor token via endpoint
- Implementar `express-rate-limit` para `POST /api/login` e endpoints críticos
- Ajustar frontend para enviar token CSRF em headers

Commit 3 — Validação e sanitização
- Assegurar que todas rotas usam Zod (adicionar chamadas onde faltarem)
- Adicionar `DOMPurify` no frontend (render de HTML) ou `sanitize-html` no backend
- Adicionar testes básicos de autorização e CSRF

---

## Opções de execução (o que posso fazer por você)

- Opção A: Implementar os 3 commits mínimos descritos acima (eu aplico patches, executo checks locais e preparo PRs). Requer permissão para commitar/push.
- Opção B: Gerar um relatório/PR com somente as diffs e checklist (sem aplicar código) para revisão manual.
- Opção C: Executar uma auditoria automática (script) que lista rotas que não usam `isAuthenticated`/`hasCardAccess` para revisão.

Diga qual opção prefere e eu começo a executar (posso começar pelo Commit 1 imediatamente se autorizar que eu commite no repositório).

---

## Tasks (divididas e acionáveis)

Abaixo as tarefas organizadas por prioridade. Cada task tem: descrição curta, arquivos-alvo, critérios de aceitação (QA) e estimativa de esforço.

### Prioridade ALTA

- ✅ H1 — Hardening de sessão e cookies
  - Descrição: Configurar flags de cookie (secure/httpOnly/sameSite/maxAge), regenerar session id no login e usar `SESSION_SECRET` seguro.
  - Arquivos-alvo: `server/auth.ts`, entrypoint do servidor (onde `express-session` é criado).
  - **Status: CONCLUÍDO** - Implementado httpOnly, secure, sameSite, rolling sessions e regeneração de sessão no login
  - Critérios de aceitação:
    - ✅ Cookies de sessão têm httpOnly: true e sameSite: 'lax' (em produção secure: true)
    - ✅ Após login, `req.session.regenerate()` é chamado e usuário recebe nova session id
    - ✅ Ambiente de produção usa `SESSION_SECRET` vindo de env (não hardcoded)
  - Estimativa: 1–2 horas

- ✅ H2 — Adicionar Helmet e headers de segurança
  - Descrição: Incluir `helmet()` e configurar CSP mínima + X-Frame-Options e nosniff.
  - Arquivos-alvo: entrypoint do servidor (arquivo que cria `app` e chama `registerRoutes`).
  - **Status: CONCLUÍDO** - Helmet configurado com CSP, X-Frame-Options e headers de segurança
  - Critérios de aceitação:
    - ✅ `helmet()` aplicado globalmente
    - ✅ CSP mínima definida e validada manualmente (apenas fontes e self permitidos inicialmente)
    - ✅ Headers `X-Frame-Options` e `X-Content-Type-Options` presentes
  - Estimativa: 30–60 minutos

- ✅ H3 — Implementar CSRF protection
  - Descrição: Adicionar middleware `csurf` (ou double-submit cookie) e endpoint para fornecer token ao frontend; ajustar frontend para enviar token no header `X-CSRF-Token`.
  - Arquivos-alvo: `server/middlewares.ts`, `server/routes.ts`, frontend requests (helpers de fetch / `client/src/lib/queryClient.ts` ou similar).
  - **Status: CONCLUÍDO** - Proteção CSRF implementada com middleware condicional
  - Critérios de aceitação:
    - ✅ POST/PATCH/DELETE sem token são rejeitados (403)
    - ✅ Frontend tem helper `csrfFetch()` para envio automático de tokens
    - ✅ Endpoint `/api/csrf-token` fornece tokens para o frontend
  - Estimativa: 2–4 horas (inclui pequeno ajuste no frontend)

- ✅ H4 — Rate limiting para login/endpoints sensíveis
  - Descrição: Aplicar `express-rate-limit` em `POST /api/login`, `POST /api/users` e endpoints de mudança de senha.
  - Arquivos-alvo: `server/middlewares.ts`, `server/routes.ts` (registro de middleware nas rotas alvo).
  - **Status: CONCLUÍDO** - Rate limiting implementado para login, registro e mudança de senha
  - Critérios de aceitação:
    - ✅ Após N tentativas (configuráveis) originadas do mesmo IP, respostas com 429
    - ✅ Logs de tentativas aparecem para auditoria
  - Estimativa: 1–2 horas

### Prioridade MÉDIA

- ✅ M1 — Validação e limites nos schemas (Zod)
  - Descrição: Rever `shared/schema.ts` e adicionar `maxLength`/limites para campos string, sanitização mínima.
  - Arquivos-alvo: `shared/schema.ts`, chamadas em `server/routes.ts` que usam os schemas.
  - **Status: CONCLUÍDO** - Limites maxLength implementados em todos os schemas principais
  - Critérios de aceitação:
    - ✅ Campos de texto têm limites claros (ex.: username 3-50, title 1-200, description 0-2000)
    - ✅ Requisições que excedem limites retornam 400 com erro de validação
  - Estimativa: 2–3 horas

- ✅ M2 — Sanitização de conteúdo exibido (XSS)
  - Descrição: Adicionar `DOMPurify` no frontend para limpar HTML renderizado (comentários/descrições) ou usar `sanitize-html` no backend antes de persistir quando HTML permitido.
  - Arquivos-alvo: componentes que exibem HTML (`client/src/components/*`, ex: comentários, card description)
  - **Status: CONCLUÍDO** - DOMPurify implementado com utilitários de sanitização
  - Critérios de aceitação:
    - ✅ Sistema `sanitizeForRender()` previne execução de scripts
    - ✅ Funções `sanitizeText()` e `sanitizeRichText()` para diferentes contextos
    - ✅ Helper `createSafeHTML()` para renderização segura de HTML
    - ✅ Configuração DOMPurify bloqueia tags e atributos perigosos
  - Estimativa: 2–4 horas

- 🔄 M3 — Proteção de uploads
  - Descrição: Garantir que arquivos não sejam servidos diretamente sem verificação, confirmar limitação de tamanho e tipos; opcionalmente mover para pasta não pública e servir via rota.
  - Arquivos-alvo: `server/routes.ts` (multer config), `public/uploads` políticas
  - **Status: PARCIAL** - Validações básicas existem, mas pode ser melhorado
  - Critérios de aceitação:
    - Uploads com tipos inválidos são rejeitados
    - Arquivos não são acessíveis diretamente sem rota (quando aplicável)
  - Estimativa: 1–3 horas

- 🔄 M4 — Auditoria de autorização / testes automatizados
  - Descrição: Criar testes de integração (supertest + jest) cobrindo tentativas de CRUD sem permissão.
  - Arquivos-alvo: nova pasta `server/tests` com testes; atualizar CI para rodar testes.
  - **Status: PENDENTE** - Testes de segurança precisam ser criados
  - Critérios de aceitação:
    - Casos críticos (delete sem permissão, acessar quadro protegido) retornam 403
    - CI executa os testes e falha quando autorização quebrada
  - Estimativa: 3–6 horas

### Prioridade BAIXA

- L1 — Força de hashing e política de senha
  - Descrição: Confirmar bcrypt rounds >= 12 ou migrar para argon2; adicionar validação de força no registro.
  - Arquivos-alvo: `server/auth.ts`, `shared/schema.ts` (registro/change-password)
  - Critérios de aceitação:
    - Senhas novas são validadas conforme política
    - Hashes gerados com configuração segura
  - Estimativa: 1–3 horas (migrar para argon2 pode ser maior)

- L2 — CORS restrito
  - Descrição: Configurar `cors` com whitelist (origens permitidas) e `credentials: true` apenas para origens confiáveis.
  - Arquivos-alvo: entrypoint do servidor
  - Critérios de aceitação:
    - Requisições XHR de origens não permitidas são bloqueadas
  - Estimativa: 30–60 minutos

- L3 — Sessão revogação/limpeza ao trocar senha
  - Descrição: Ao trocar senha ou excluir usuário, invalidar sessions ativas (limpar session store para o user).
  - Arquivos-alvo: `server/routes.ts` (change-password), session store (connect-pg-simple)
  - Critérios de aceitação:
    - Sessões do usuário afetado são removidas e não permitem requisições autenticadas
  - Estimativa: 1–2 horas

### PR checklist sugerido para cada tarefa

- Código compilando / lint ok
- Testes relevantes adicionados (quando aplicável)
- Rotas sensíveis cobertas por testes de autorização
- Nenhum `console.log` com dados sensíveis deixado
- Documentação atualizada (`SECURITY_RECOMMENDATIONS.md` e README se necessário)

---

Se quiser, começo aplicando as tasks H1 + H2 (Commit 1 do plano mínimo). Autoriza que eu commite e faça push com mensagens em pt-BR? Opcionalmente posso criar uma branch por task/commit e abrir PRs.