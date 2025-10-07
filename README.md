
# Sistema Kanban - Projeto Completo

Sistema completo de gerenciamento de tarefas estilo Kanban desenvolvido com React, TypeScript e Node.js.

## 🚀 Funcionalidades

### Quadros e Organização
- ✅ Quadros Kanban personalizáveis
- ✅ Listas (colunas) organizáveis por drag-and-drop
- ✅ Cartões com descrições detalhadas
- ✅ Datas de vencimento com alertas visuais
- ✅ Sistema de etiquetas coloridas
- ✅ Checklists com progresso visual

### Sistema de Usuários
- ✅ Autenticação segura com Passport.js
- ✅ Controle de acesso baseado em funções (admin/user)
- ✅ Upload de fotos de perfil
- ✅ Gerenciamento de membros por quadro
- ✅ Convites e permissões granulares

### Dashboard e Métricas
- ✅ Dashboard personalizado por usuário
- ✅ Dashboard administrativo com estatísticas globais
- ✅ Acompanhamento de tarefas atrasadas
- ✅ Progresso de checklists
- ✅ Métricas de conclusão

### Colaboração
- ✅ Sistema de comentários em cartões
- ✅ Atribuição de membros a cartões
- ✅ Notificações visuais de prazo
- ✅ Histórico de atividades

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Tanstack Query** - Gerenciamento de estado servidor
- **Wouter** - Roteamento leve

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem no backend
# Sistema Kanban — README detalhado

Projeto Kanban completo: frontend em React + TypeScript e backend em Node.js/Express (TypeScript). Este README adiciona referência prática de rotas e exemplos de chamadas (curl e dicas para Postman).

Índice
- Sobre
- Pré-requisitos
- Como executar
- API — rotas e exemplos curl
- Como importar no Postman
- Notas de autenticação e upload
- Contribuição

## Sobre
Uma aplicação de gerenciamento de tarefas estilo Kanban com quadros, listas, cartões, etiquetas, checklists, comentários, membros e sistema de notificações.

## Pré-requisitos
- Node.js >= 18
- npm ou yarn
- PostgreSQL (ou ambiente que exponha DATABASE_URL)

## Como executar (desenvolvimento)

1. Instale dependências

```bash
npm install
```

2. Configure variáveis de ambiente (exemplo `.env`)

```bash
# DATABASE_URL=postgres://user:pass@localhost:5432/dbname
# SESSION_SECRET=uma_chave_secreta
# OUTRAS_VARIAVEIS=...
```

3. Execute em modo desenvolvimento

```bash
npm run dev
```

O servidor costuma rodar em http://localhost:5000 (ver `server`/config). O frontend (Vite) em http://localhost:5173 dependendo da configuração.

## API — rotas principais e exemplos curl

Observação: o backend usa sessões (cookies). Nos exemplos abaixo usamos `cookies.txt` para armazenar cookie de sessão entre chamadas.

Base URL local (exemplo): http://localhost:5000

Autenticação (login)

```bash
# Fazer login e salvar cookie
curl -c cookies.txt -H "Content-Type: application/json" \
	-X POST -d '{"username":"seu_usuario","password":"sua_senha"}' \
	http://localhost:5000/api/login

# Verificar usuário logado
curl -b cookies.txt http://localhost:5000/api/user
```

Logout

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/logout
```

Portfólios e Quadros (Boards)

```bash
# Listar quadros (públicos ou do usuário autenticado)
curl -b cookies.txt http://localhost:5000/api/boards

# Criar um quadro
curl -b cookies.txt -H "Content-Type: application/json" -X POST \
	-d '{"title":"Meu Quadro Teste","description":"Descrição"}' \
	http://localhost:5000/api/boards

# Detalhes de um quadro
curl -b cookies.txt http://localhost:5000/api/boards/123

# Atualizar quadro
curl -b cookies.txt -H "Content-Type: application/json" -X PATCH \
	-d '{"title":"Título atualizado"}' \
	http://localhost:5000/api/boards/123

# Deletar quadro
curl -b cookies.txt -X DELETE http://localhost:5000/api/boards/123
```

Listas e Cartões

```bash
# Listar listas de um quadro
curl -b cookies.txt http://localhost:5000/api/boards/123/lists

# Criar lista
curl -b cookies.txt -H "Content-Type: application/json" -X POST \
	-d '{"title":"A Fazer","boardId":123}' \
	http://localhost:5000/api/lists

# Criar cartão
curl -b cookies.txt -H "Content-Type: application/json" -X POST \
	-d '{"title":"Tarefa 1","listId":456, "description":"..."}' \
	http://localhost:5000/api/cards
```

Etiquetas (Labels)

```bash
# Listar etiquetas do quadro
curl -b cookies.txt http://localhost:5000/api/boards/123/labels

# Criar etiqueta
curl -b cookies.txt -H "Content-Type: application/json" -X POST \
	-d '{"boardId":123,"name":"Urgente","color":"#ef4444"}' \
	http://localhost:5000/api/labels

# Atualizar etiqueta (PATCH)
curl -b cookies.txt -H "Content-Type: application/json" -X PATCH \
	-d '{"name":"Importante","color":"#f59e0b"}' \
	http://localhost:5000/api/labels/789

# Deletar etiqueta
curl -b cookies.txt -X DELETE http://localhost:5000/api/labels/789

# Aplicar etiqueta a um cartão (associação card-labels)
curl -b cookies.txt -H "Content-Type: application/json" -X POST \
	-d '{"cardId":456, "labelId":789}' \
	http://localhost:5000/api/card-labels

# Remover etiqueta de um cartão
curl -b cookies.txt -X DELETE http://localhost:5000/api/cards/456/labels/789
```

Notificações

```bash
# Listar notificações (paginação suportada)
curl -b cookies.txt "http://localhost:5000/api/notifications?limit=20&offset=0"

# Contagem de não-lidas
curl -b cookies.txt http://localhost:5000/api/notifications/unread-count

# Marcar como lida
curl -b cookies.txt -X POST http://localhost:5000/api/notifications/12/read

# Marcar todas como lidas
curl -b cookies.txt -X POST http://localhost:5000/api/notifications/mark-all-read
```

Verificação de tarefas atrasadas (execução manual)

```bash
# Executa rotina que cria notificações para tarefas atrasadas
curl -b cookies.txt -X POST http://localhost:5000/api/check-overdue-tasks
```

Upload de imagem de perfil (multipart)

```bash
# Enviar imagem de perfil (form field: profile_image)
curl -b cookies.txt -F "profile_image=@/caminho/para/foto.png" \
	-X POST http://localhost:5000/api/users/42/profile-image
```

Usuários

```bash
# Listar usuários
curl -b cookies.txt http://localhost:5000/api/users

# Atualizar usuário
curl -b cookies.txt -H "Content-Type: application/json" -X PATCH \
	-d '{"name":"Nome Novo"}' http://localhost:5000/api/users/42
```

Erros e códigos de resposta
- 200: OK
- 201: Criado
- 204: Sem conteúdo (deleção bem-sucedida)
- 400: Requisição inválida / validação
- 401: Não autenticado
- 403: Acesso negado
- 404: Não encontrado
- 500: Erro interno do servidor

## Como importar no Postman

1. Abra o Postman
2. Crie uma nova Collection
3. Para autenticação por sessão, crie uma requisição `POST /api/login` com JSON no body e execute-a primeiro
4. Em seguida, nas requisições da coleção, ative a opção "Use cookie jar" do Postman (ou copie o header `Cookie` retornado)
5. Você pode importar os exemplos curl diretamente (Postman aceita `Import > Raw text` com comandos curl)

Exemplo rápido de importação cURL no Postman:

1. Copie qualquer comando `curl` deste README
2. No Postman: File > Import > Raw Text > cole o comando > Import

## Notas de segurança e desenvolvimento
- As rotas críticas (marcação de notificações, criação/remoção de membros, exclusão de recursos) verificam permissão no backend
- Em produção, use HTTPS e um segredo de sessão forte (`SESSION_SECRET`)
- Evite expor `DATABASE_URL` em repositórios públicos

## Contribuição

- Faça fork do repositório
- Crie branch com nome `feature/<descrição>`
- Abra PR com descrição e testes, se aplicável

---

Se quiser, posso gerar também um arquivo Postman Collection (JSON) com exemplos das rotas principais (login, criar/editar/deletar label, adicionar label a cartão, unread-count). Deseja que eu gere esse arquivo e o adicione ao repositório?
