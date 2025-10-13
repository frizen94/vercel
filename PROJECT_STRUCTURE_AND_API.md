# Estrutura do Projeto e API

Resumo rápido da estrutura e lista dos endpoints REST definidos em `server/routes.ts`.

## Estrutura principal
- /api - rotas definidas em `server/routes.ts`
- /client - frontend React + TypeScript
- /server - backend Express + TypeScript
- /public/uploads - arquivos estáticos enviáveis

## Endpoints (resumo)
- GET /api/health
- GET /api/debug/session
- GET /api/debug/database
- GET /api/csrf-token

Portfólios
- GET /api/portfolios
- GET /api/portfolios/:id
- GET /api/portfolios/:id/boards
- POST /api/portfolios
- PATCH /api/portfolios/:id
- DELETE /api/portfolios/:id

Quadros (Boards)
- GET /api/user-boards
- GET /api/boards
- GET /api/boards/:id
- POST /api/boards
- PATCH /api/boards/:id
- DELETE /api/boards/:id
- GET /api/boards/:boardId/lists
- GET /api/boards/archived
- POST /api/boards/:id/archive
- POST /api/boards/:id/unarchive

Listas (Lists)
- POST /api/lists
- PATCH /api/lists/:id
- DELETE /api/lists/:id
- GET /api/lists/:listId/cards

Cartões (Cards)
- GET /api/cards/:id
- GET /api/cards/:cardId/details
- POST /api/cards
- PATCH /api/cards/:id
- DELETE /api/cards/:id
- GET /api/cards/archived
- POST /api/cards/:id/archive
- POST /api/cards/:id/unarchive
- PATCH /api/cards/:id/complete
- GET /api/cards/overdue-dashboard

Etiquetas (Labels)
- GET /api/boards/:boardId/labels
- POST /api/labels
- PATCH /api/labels/:id
- DELETE /api/labels/:id
- GET /api/cards/:cardId/labels
- GET /api/boards/:boardId/cards/labels
- POST /api/card-labels
- DELETE /api/cards/:cardId/labels/:labelId

Prioridades (Priorities)
- GET /api/boards/:boardId/priorities
- GET /api/boards/:boardId/cards/priorities
- POST /api/priorities
- PATCH /api/priorities/:id
- DELETE /api/priorities/:id
- GET /api/cards/:cardId/priority
- POST /api/card-priorities
- DELETE /api/cards/:cardId/priority

Comentários
- GET /api/cards/:cardId/comments
- POST /api/comments
- DELETE /api/comments/:id

Usuários
- GET /api/users
- PATCH /api/users/:id
- DELETE /api/users/:id
- POST /api/users/:id/change-password
- POST /api/users/:id/profile-image

Membros de Cartões & Quadros
- GET /api/cards/:cardId/members
- POST /api/card-members
- DELETE /api/cards/:cardId/members/:userId
- GET /api/boards/:boardId/members
- GET /api/boards/:boardId/members/:userId
- POST /api/board-members
- PATCH /api/boards/:boardId/members/:userId
- DELETE /api/boards/:boardId/members/:userId

Checklists
- GET /api/cards/:cardId/checklists
- GET /api/checklists/:id
- POST /api/checklists
- PATCH /api/checklists/:id
- DELETE /api/checklists/:id

Itens de Checklist
- GET /api/checklists/:checklistId/items
- POST /api/checklist-items
- PATCH /api/checklist-items/:id
- DELETE /api/checklist-items/:id
- GET /api/checklist-items/:id/members
- POST /api/checklist-items/:id/members
- DELETE /api/checklist-items/:id/members/:userId

Dashboard
- GET /api/dashboard/collaborators
- GET /api/dashboard/stats
- GET /api/dashboard/recent-tasks
- GET /api/dashboard/checklist-items

Overdue check
- POST /api/check-overdue-tasks

Notificações
- GET /api/notifications
- GET /api/notifications/unread-count
- POST /api/notifications/:id/read
- POST /api/notifications/mark-all-read
- POST /api/notifications/:id/clear
- POST /api/notifications/clear-all
- DELETE /api/notifications/:id

Uploads
- POST /api/users/:id/profile-image (multipart/form-data)

Admin
- GET /api/admin/audit-logs

> Observação: muitas rotas requerem autenticação (ver `isAuthenticated` e middlewares). Consulte `server/routes.ts` para detalhes de validação e comportamento específico de cada rota.
