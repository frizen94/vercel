# Estrutura do Projeto e API

Resumo completo da estrutura e lista de todos os endpoints REST definidos em `server/routes.ts`.

## Estrutura principal
- /api - rotas definidas em `server/routes.ts`
- /client - frontend React + TypeScript
- /server - backend Express + TypeScript
- /public/uploads - arquivos estáticos enviáveis

## Endpoints (Completo)

### Sistema
- GET /api/health - Verificação de saúde da API
- GET /api/debug/session - Debug de informações da sessão
- GET /api/debug/database - Debug de conexão com banco de dados
- GET /api/csrf-token - Obter token CSRF

### Portfólios
- GET /api/portfolios - Listar todos os portfólios do usuário
- GET /api/portfolios/:id - Obter detalhes de um portfólio
- GET /api/portfolios/:id/boards - Listar quadros de um portfólio
- POST /api/portfolios - Criar novo portfólio
- PATCH /api/portfolios/:id - Atualizar portfólio
- DELETE /api/portfolios/:id - Excluir portfólio
- GET /api/portfolios/:id/members - Listar membros de um portfólio
- POST /api/portfolios/:id/members - Adicionar membro ao portfólio
- PUT /api/portfolios/:id/members/:userId - Atualizar papel do membro
- DELETE /api/portfolios/:id/members/:userId - Remover membro do portfólio
- GET /api/portfolios/:id/tasks - Listar todas as tarefas do portfólio
- GET /api/portfolios/:id/checklist-items - Listar itens de checklist do portfólio

### Quadros (Boards)
- GET /api/user-boards - Listar quadros do usuário
- GET /api/boards - Listar todos os quadros acessíveis
- GET /api/boards/:id - Obter detalhes de um quadro
- GET /api/boards/archived - Listar quadros arquivados
- POST /api/boards - Criar novo quadro
- PATCH /api/boards/:id - Atualizar quadro
- DELETE /api/boards/:id - Excluir quadro
- POST /api/boards/:id/archive - Arquivar quadro
- POST /api/boards/:id/unarchive - Desarquivar quadro
- GET /api/boards/:boardId/lists - Listar listas de um quadro
- GET /api/boards/:boardId/labels - Listar etiquetas do quadro
- GET /api/boards/:boardId/cards/labels - Listar etiquetas usadas nos cartões
- GET /api/boards/:boardId/priorities - Listar prioridades do quadro
- GET /api/boards/:boardId/cards/priorities - Listar prioridades usadas nos cartões
- GET /api/boards/:boardId/members - Listar membros do quadro
- GET /api/boards/:boardId/members/:userId - Obter membro específico do quadro
- POST /api/board-members - Adicionar membro ao quadro
- PATCH /api/boards/:boardId/members/:userId - Atualizar papel do membro
- DELETE /api/boards/:boardId/members/:userId - Remover membro do quadro

### Listas (Lists)
- GET /api/boards/:boardId/lists - Listar listas de um quadro
- GET /api/lists/:listId/cards - Listar cartões de uma lista
- POST /api/lists - Criar nova lista
- PATCH /api/lists/:id - Atualizar lista
- DELETE /api/lists/:id - Excluir lista

### Cartões (Cards)
- GET /api/cards/:id - Obter cartão por ID
- GET /api/cards/:cardId/details - Obter detalhes completos do cartão
- GET /api/cards/archived - Listar cartões arquivados
- GET /api/cards/overdue-dashboard - Dashboard de cartões vencidos
- GET /api/lists/:listId/cards - Listar cartões de uma lista
- POST /api/cards - Criar novo cartão
- PATCH /api/cards/:id - Atualizar cartão
- PATCH /api/cards/:id/complete - Marcar cartão como completo/incompleto
- DELETE /api/cards/:id - Excluir cartão
- POST /api/cards/:id/archive - Arquivar cartão
- POST /api/cards/:id/unarchive - Desarquivar cartão
- GET /api/cards/:cardId/labels - Listar etiquetas do cartão
- GET /api/cards/:cardId/priority - Obter prioridade do cartão
- GET /api/cards/:cardId/members - Listar membros do cartão
- POST /api/card-members - Adicionar membro ao cartão
- DELETE /api/cards/:cardId/members/:userId - Remover membro do cartão
- GET /api/cards/:cardId/comments - Listar comentários do cartão
- GET /api/cards/:cardId/checklists - Listar checklists do cartão

### Etiquetas (Labels)
- GET /api/boards/:boardId/labels - Listar etiquetas do quadro
- GET /api/boards/:boardId/cards/labels - Listar etiquetas usadas nos cartões
- GET /api/cards/:cardId/labels - Listar etiquetas de um cartão
- POST /api/labels - Criar nova etiqueta
- PATCH /api/labels/:id - Atualizar etiqueta
- DELETE /api/labels/:id - Excluir etiqueta
- POST /api/card-labels - Adicionar etiqueta ao cartão
- DELETE /api/cards/:cardId/labels/:labelId - Remover etiqueta do cartão

### Prioridades (Priorities)
- GET /api/boards/:boardId/priorities - Listar prioridades do quadro
- GET /api/boards/:boardId/cards/priorities - Listar prioridades usadas
- GET /api/cards/:cardId/priority - Obter prioridade de um cartão
- POST /api/priorities - Criar nova prioridade
- PATCH /api/priorities/:id - Atualizar prioridade
- DELETE /api/priorities/:id - Excluir prioridade
- POST /api/card-priorities - Atribuir prioridade ao cartão
- DELETE /api/cards/:cardId/priority - Remover prioridade do cartão

### Comentários
- GET /api/cards/:cardId/comments - Listar comentários de um cartão
- POST /api/comments - Criar novo comentário
- DELETE /api/comments/:id - Excluir comentário

### Usuários
- GET /api/users - Listar todos os usuários
- PATCH /api/users/:id - Atualizar usuário
- DELETE /api/users/:id - Excluir usuário
- POST /api/users/:id/change-password - Alterar senha do usuário
- POST /api/users/:id/reset-password - Resetar senha do usuário
- POST /api/users/:id/required-password-change - Alterar senha obrigatória
- POST /api/users/:id/profile-image - Upload de imagem de perfil (multipart/form-data)

### Checklists
- GET /api/cards/:cardId/checklists - Listar checklists de um cartão
- GET /api/checklists/:id - Obter checklist por ID
- POST /api/checklists - Criar nova checklist
- PATCH /api/checklists/:id - Atualizar checklist
- DELETE /api/checklists/:id - Excluir checklist

### Itens de Checklist
- GET /api/checklists/:checklistId/items - Listar itens de uma checklist
- POST /api/checklist-items - Criar novo item de checklist
- PATCH /api/checklist-items/:id - Atualizar item de checklist
- DELETE /api/checklist-items/:id - Excluir item de checklist
- GET /api/checklist-items/:id/members - Listar membros atribuídos ao item
- POST /api/checklist-items/:id/members - Adicionar membro ao item
- DELETE /api/checklist-items/:id/members/:userId - Remover membro do item

### Dashboard e Estatísticas
- GET /api/dashboard/collaborators - Listar colaboradores do usuário
- GET /api/dashboard/stats - Estatísticas gerais do dashboard
- GET /api/dashboard/recent-tasks - Tarefas recentes
- GET /api/dashboard/cards - Cartões do usuário
- GET /api/dashboard/checklist-items - Itens de checklist do usuário
- GET /api/dashboard/resolution-times - Tempos de resolução de tarefas
- GET /api/admin/productivity-metrics - Métricas de produtividade (admin)

### Notificações
- GET /api/notifications - Listar notificações do usuário
- GET /api/notifications/unread-count - Contar notificações não lidas
- POST /api/notifications/:id/read - Marcar notificação como lida
- POST /api/notifications/mark-all-read - Marcar todas como lidas
- POST /api/notifications/:id/clear - Limpar notificação específica
- POST /api/notifications/clear-all - Limpar todas as notificações
- DELETE /api/notifications/:id - Excluir notificação

### Tarefas e Verificações
- POST /api/check-overdue-tasks - Verificar tarefas vencidas

### Administração
- GET /api/admin/audit-logs - Visualizar logs de auditoria (admin)
- GET /api/admin/productivity-metrics - Métricas de produtividade (admin)

### Uploads
- POST /api/users/:id/profile-image - Upload de imagem de perfil (multipart/form-data)

## Notas Importantes
