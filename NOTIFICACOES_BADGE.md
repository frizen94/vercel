# Badge de Notificações Não Lidas (Sidebar)

Este documento descreve, em detalhe, como adicionar um badge vermelho com a contagem de notificações não lidas no item "Notificações" da sidebar do projeto.

Índice
- Visão geral
- Contrato da API
- Banco de dados (migrations)
- Backend — Rota e implementação
- Frontend — Busca e exibição do badge
- Realtime (opcional)
- Marcar como lido
- UX / Acessibilidade
- Testes sugeridos
- Comandos para desenvolvimento (fish shell)
- Arquivos prováveis a editar
- Plano de rollout

## Visão geral

Objetivo: mostrar um pequeno badge vermelho na sidebar indicando quantas notificações o usuário ainda não leu. Quando o usuário tiver 0 notificações não lidas, o badge não aparece. Exemplo visual: um círculo vermelho pequeno com texto branco contendo a contagem (até `99+`).

Motivações:
- Aumentar a visibilidade de novas notificações para o usuário
- Direcionar o usuário para a página de notificações
- Permitir feedback instantâneo ao receber atribuições/menções

## Contrato da API

Endpoint sugerido:
- GET /api/notifications/unread-count

Request:
- Requisição autenticada (cookie/session ou Authorization header)

Response (200):
```
{ "unreadCount": number }
```
Erros:
- 401: usuário não autenticado
- 500: erro interno

Tempo de resposta esperado: < 200ms em ambiente local

## Banco de dados (migrations)

Verifique se existe uma coluna que marca leitura das notificações. Duas opções:

1) `read_at TIMESTAMP NULL` — preferível (especifica quando foi lido)
2) `read BOOLEAN NOT NULL DEFAULT FALSE`

Queries para contagem:
- Se `read_at`:
```sql
SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL;
```
- Se `read`:
```sql
SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE;
```

Exemplo de migração (SQL):
- Para `read_at`:
```sql
ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP NULL;
```
- Para `read`:
```sql
ALTER TABLE notifications ADD COLUMN read BOOLEAN NOT NULL DEFAULT FALSE;
```

Coloque a migração na pasta `migrations/` seguindo o padrão do projeto (se houver um utilitário de migrations já configurado, use-o).

## Backend — Rota e implementação

Local provável para adicionar a rota: `server/routes.ts` ou `server/index.ts` (ou um arquivo de notifications caso exista).

Pseudocódigo (TypeScript / Node):
```ts
// rota: GET /api/notifications/unread-count
router.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  const userId = req.user.id; // obter do middleware
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  res.json({ unreadCount: rows[0].count });
});
```

Pontos importantes:
- Reutilize o middleware de autenticação existente (`server/auth.ts`).
- Faça tratamento de erros com try/catch e retorne 500 quando necessário.
- Considere cache em memória curto (10s) para reduzir consultas em aplicações de grande escala.

## Frontend — Busca e exibição do badge

Local provável: componente da sidebar em `client/src/components/Sidebar.tsx` ou `client/src/components/Nav.tsx`.

Comportamento proposto:
- Ao montar o componente da sidebar, buscar o contador em `/api/notifications/unread-count`.
- Atualizar o estado do componente com o valor retornado.
- Polling opcional (ex.: a cada 30s) ou atualizar via evento realtime quando receber notificações.
- Mostrar `99+` quando o valor for maior que 99.

Exemplo React (simplificado):
```tsx
const [unread, setUnread] = useState<number>(0);
useEffect(() => {
  let mounted = true;
  async function fetchCount() {
    try {
      const res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
      if (!mounted || !res.ok) return;
      const data = await res.json();
      setUnread(data.unreadCount ?? 0);
    } catch (err) {
      // ignore ou log
    }
  }
  fetchCount();
  const id = setInterval(fetchCount, 30000); // poll cada 30s
  return () => { mounted = false; clearInterval(id); };
}, []);

// Render
{unread > 0 && (
  <span className="badge" aria-label={`Você tem ${unread} notificações não lidas`} role="status">
    {unread > 99 ? '99+' : unread}
  </span>
)}
```

Classes Tailwind/CSS sugeridas:
- `.badge { @apply bg-red-600 text-white rounded-full text-xs w-6 h-6 flex items-center justify-center; }`
- Posicionar usando `relative` no item da sidebar com `absolute` no badge.

Acessibilidade:
- `aria-label` com a contagem descritiva
- role="status" para leitores de tela

## Realtime (opcional, mas recomendado)

Se o projeto já possui websocket (ws/socket.io) ou SSE, envie eventos para o usuário quando:
- Notificação criada para ele (`notification.created`)
- Notificação marcada como lida em outro dispositivo (`notification.read`)

No frontend, escute esses eventos e incremente/decremente o contador ao vivo, evitando depender somente do polling.

## Marcar como lido

Endpoints sugeridos:
- POST /api/notifications/mark-all-read — marca todas como lidas para o usuário atual
- PATCH /api/notifications/:id/read — marca uma notificação específica como lida

Após marcar como lido, o frontend deve atualizar o badge (se mark-all-read, zerar o contador; se marcar 1, decrementar).

## UX / Edge cases

- Contagem alta -> mostrar `99+`.
- Sessão inválida -> não exibir badge e ignorar as chamadas de contagem (ou redirecionar para login quando apropriado).
- Latência -> mostrar contador anterior até nova resposta.
- Sync entre dispositivos -> realtime ou polling curto.

## Testes sugeridos

Backend:
- Teste unitário para o endpoint `/api/notifications/unread-count` simulando diferentes resultados do banco.

Frontend:
- Teste com `react-testing-library` que mocka a API e valida que o badge aparece quando unreadCount > 0.

E2E:
- Criar uma notificação no banco, carregar a UI e verificar se o badge aparece (Cypress / Playwright).

## Comandos para desenvolvimento (fish shell)

Subir desenvolvimento com docker-compose:
```fish
# Parar e remover tudo (containers, volumes, imagens do compose)
docker compose down --volumes --rmi all

# Subir do zero, rebuild das imagens
docker compose up --build
```

Rodando local (se preferir rodar separadamente):
```fish
# frontend
cd client
npm install
npm run dev

# backend
cd ../server
npm install
npm run dev
```

Rodar migrations (caso use um script npm):
```fish
npm run migrate
```

Testes:
```fish
# root ou nas pastas client/server conforme configuração
npm test
```

## Arquivos prováveis a editar

- `server/routes.ts` ou `server/index.ts` (adicionar rota de contagem)
- `server/auth.ts` (reusar middleware de autenticação existente)
- `server/db.ts` ou `server/database.ts` (reutilizar pool/query)
- `migrations/` (nova migration para `read_at` ou `read` se necessário)
- `client/src/components/Sidebar.tsx` (ou arquivo equivalente da sidebar)
- `client/src/api/notifications.ts` (se houver uma camada API)
- `client/src/socket.ts` (se for adicionar realtime)

## Plano de rollout

1. Garantir coluna `read_at` / `read` via migration.
2. Implementar endpoint `unread-count` no backend e testes unitários.
3. Implementar fetch no frontend e exibir badge (sem realtime), testar localmente.
4. (Opcional) Integrar realtime para atualizações em tempo real.
5. Adicionar endpoints para marcar lido e atualizar UI quando o usuário abrir as notificações.
6. Cobertura de testes e revisão de código.

## Tarefas (Tasks)

A seguir está a lista de tarefas necessárias para implementar o badge de notificações não lidas. Cada tarefa tem subtarefas, critérios de aceite e estimativa de esforço relativa.

1) Database — Migration
   - Descrição: Garantir que exista uma coluna para marcar notificações lidas (`read_at TIMESTAMP NULL` recomendado).
   - Subtarefas:
     - Verificar schema atual em `shared/schema.ts` ou `server/migrations`.
     - Criar migration `migrations/XXX_add_read_at_to_notifications.sql` com `ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP NULL;`.
     - Executar migration localmente e confirmar dados existentes não sejam quebrados.
   - Critérios de aceite:
     - Migration criada e aplicada sem erros.
     - Query de contagem (`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`) retorna 0+ sem erro.
   - Estimativa: 1 — 2 horas.

2) Backend — Endpoint unread-count
   - Descrição: Implementar `GET /api/notifications/unread-count` que retorna `{ unreadCount }` para o usuário autenticado.
   - Subtarefas:
     - Reusar middleware de auth (`server/auth.ts`).
     - Adicionar rota no arquivo apropriado (`server/routes.ts` ou `server/index.ts`).
     - Implementar query usando `server/db.ts` ou pool existente.
     - Adicionar tratamento de erros e testes unitários simples (mock do DB).
   - Critérios de aceite:
     - Rota retorna 200 com JSON `{ unreadCount: number }` para usuário autenticado.
     - 401 para requisições não autenticadas.
     - Testes unitários cobrem sucesso e erro do DB.
   - Estimativa: 2 — 4 horas.

3) Frontend — Badge na sidebar
   - Descrição: Adicionar fetch e exibir badge na sidebar (`client/src/components/Sidebar.tsx` ou equivalente).
   - Subtarefas:
     - Localizar componente da sidebar e alterar para importar novo hook/serviço.
     - Implementar fetch inicial e polling (30s) ou integração com store/global state.
     - Criar componente `NotificationBadge` com styles (Tailwind/CSS) e acessibilidade.
     - Teste unitário (React Testing Library) que mocka API e valida render do badge.
   - Critérios de aceite:
     - Badge visível quando `unreadCount > 0` e oculto quando `0`.
     - Exibe `99+` quando `unreadCount > 99`.
     - `aria-label` presente e legível por leitores de tela.
   - Estimativa: 3 — 6 horas.

4) Backend — Endpoints para marcar como lido
   - Descrição: Endpoints para marcar notificações como lidas (`mark-all-read` e `PATCH /notifications/:id/read`).
   - Subtarefas:
     - Implementar lógica para atualizar `read_at = now()`.
     - Garantir autorização (somente o dono pode marcar suas notificações).
     - Testes unitários.
   - Critérios de aceite:
     - Endpoints funcionam e atualizam contagem quando chamados.
   - Estimativa: 2 — 4 horas.

5) Realtime (opcional)
   - Descrição: Notificar o frontend em tempo real ao criar/ler notificações (socket.io/SSE/ws).
   - Subtarefas:
     - Verificar infra existente (server socket, client socket).
     - Emitir evento `notification.created` e `notification.read` para usuário alvo.
     - Atualizar contador no frontend via listener.
     - Testes básicos de integração.
   - Critérios de aceite:
     - Frontend atualiza contador sem reload ao receber evento.
   - Estimativa: 4 — 8 horas (opcional).

6) Integração, testes e documentação
   - Descrição: Rodar testes end-to-end e documentação.
   - Subtarefas:
     - Adicionar testes E2E (cypress/playwright): criar notificação no DB, abrir app, verificar badge.
     - Atualizar `NOTIFICACOES_BADGE.md` com links para as novas rotas e exemplos de payload.
     - Code review e merge request.
   - Critérios de aceite:
     - E2E verde em CI/local.
     - Documentação atualizada.
   - Estimativa: 3 — 6 horas.

Prioridade sugerida: Database -> Backend unread-count -> Frontend badge -> Endpoints mark-read -> Realtime -> E2E/Docs

Responsáveis: defina conforme equipe; para entregas rápidas uma pessoa full-stack pode cobrir Database + Backend + Frontend em uma iteração.

Comandos úteis (fish):
```fish
# Aplicar migração (exemplo: ajustar conforme tooling do projeto)
npm run migrate

# Subir ambiente do zero
docker compose down --volumes --rmi all
docker compose up --build

# Rodar testes
npm test
```

---


## Notas finais

- Este documento descreve uma solução incremental: começar com polling é mais rápido; realtime pode ser adicionado depois.
- Preferência por `read_at TIMESTAMP NULL` para flexibilidade (saber quando foi lido) e futuras necessidades de auditoria.

---

Se quiser, eu já posso implementar isso agora: crio a migration (se necessário), adiciono a rota no backend e a UI no frontend, e testo localmente. Diga "Pode implementar" para eu começar as mudanças.
