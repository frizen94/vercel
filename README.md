# Sistema de Gerenciamento de Projetos Kanban

## Índice
- [Sobre o Projeto](#sobre-o-projeto)
- [Mapa da Estrutura de Diretórios](#mapa-da-estrutura-de-diretórios)
- [Regras de Negócio](#regras-de-negócio)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Docker e DevOps](#docker-e-devops)
- [Segurança](#segurança)
- [Endpoints da API](#endpoints-da-api)
- [Configuração e Instalação](#configuração-e-instalação)
- [Deployment](#deployment)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Sobre o Projeto

O Sistema de Gerenciamento de Projetos Kanban é uma aplicação web completa desenvolvida para facilitar o gerenciamento de tarefas e colaboração em equipes. Inspirado em metodologias ágeis como Kanban, o sistema permite criar quadros de projeto, organizar tarefas em listas, atribuir membros, definir prazos e rastrear o progresso de forma visual e eficiente.

O sistema foi estruturado com uma arquitetura de código limpo e modular, seguindo as melhores práticas de desenvolvimento moderno com TypeScript, Node.js, React e PostgreSQL. A aplicação inclui recursos avançados como sistema de notificações em tempo real, controles de acesso detalhados, auditoria de ações, upload de arquivos, dashboards com métricas e muito mais.

### 🚀 Destaques das Funcionalidades Recentes

- **Sistema de Portfólios**: Organize múltiplos quadros em portfólios com membros e permissões dedicadas
- **Mini-Dashboards**: Visualize estatísticas e métricas específicas de cada portfólio
- **Notificações em Tempo Real**: Sistema completo de notificações para atribuições, comentários e prazos
- **Gerenciamento de Membros**: Controle de acesso em três níveis (portfólios, quadros e cards)
- **Cores Personalizáveis**: Personalize a aparência de portfólios e quadros
- **Deploy no Railway**: Configuração simplificada para deploy em produção com SSL automático
- **Segurança Aprimorada**: Proteção CSRF, sanitização de entrada, auditoria completa

## Mapa da Estrutura de Diretórios

```
vercel/
├── .dockerignore              # Arquivos/pastas ignorados pelo Docker
├── .env.example              # Exemplo de variáveis de ambiente
├── .gitignore                # Arquivos/pastas ignorados pelo Git
├── BUSINESS_RULES.md         # Regras de negócio detalhadas
├── DASHBOARD_ENHANCEMENT_PRD.md    # PRD do Dashboard aprimorado
├── DATABASE_SCHEMA.md        # Esquema do banco de dados
├── docker-compose.yml        # Configuração do Docker Compose
├── Dockerfile                # Arquivo Docker para build da aplicação
├── drizzle.config.ts         # Configuração do Drizzle ORM
├── init.sql                  # Script de inicialização do banco de dados
├── PROJECT_STRUCTURE_AND_API.md    # Documentação da estrutura e API
├── RAILWAY_GUIDE.md          # Guia completo de deploy no Railway
├── README.md                 # Documentação principal (este arquivo)
├── SECURITY_IMPLEMENTATION_REPORT.md  # Relatório de implementação de segurança
├── security-rules-ptbr.md    # Regras de segurança (PT-BR)
├── SECURITY_IMPLEMENTATION_REPORT.md  # Relatório de implementação de segurança
├── security-rules-ptbr.md    # Regras de segurança (PT-BR)
├── __tests__/                # Testes automatizados
├── client/                   # Frontend (React + TypeScript)
│   ├── package.json          # Dependências do frontend
│   ├── public/               # Arquivos estáticos
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas do aplicativo
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── utils/           # Funções utilitárias
│   │   ├── services/        # Serviços (API calls, etc.)
│   │   ├── types/           # Tipos TypeScript
│   │   └── assets/          # Recursos estáticos (imagens, estilos)
│   ├── tsconfig.json        # Configuração do TypeScript
│   └── vite.config.ts       # Configuração do Vite
├── public/                   # Diretório público para arquivos estáticos
│   └── uploads/             # Diretório para arquivos de upload
│       └── profile_pictures/ # Imagens de perfil dos usuários
│   └── vite.config.ts       # Configuração do Vite
├── public/                   # Diretório público para arquivos estáticos
│   └── uploads/             # Diretório para arquivos de upload
│       └── profile_pictures/ # Imagens de perfil dos usuários
├── scripts/                  # Scripts utilitários
│   ├── run-security-tests.sh # Script de testes de segurança
│   └── validate-environment.js # Script de validação de ambiente
├── server/                   # Backend (Node.js + Express)
│   ├── index.ts             # Ponto de entrada do servidor
│   ├── routes.ts            # Definição de rotas da API
│   ├── auth.ts              # Sistema de autenticação
│   ├── database.ts          # Configuração do banco de dados
│   ├── db-storage.ts        # Camada de armazenamento
│   ├── db.ts                # Instância do banco de dados
│   ├── middlewares.ts       # Middlewares Express
│   ├── activity-service.ts  # Serviço de registro de atividades
│   ├── audit-service.ts     # Serviço de auditoria
│   ├── audit-middleware.ts  # Middleware de auditoria
│   ├── notification-service.ts # Serviço de notificações
│   ├── overdue-tasks.ts     # Sistema de verificação de tarefas atrasadas
│   ├── schema-setup.ts      # Setup e migrações do schema
│   ├── seeder.ts            # Dados iniciais do banco
│   ├── storage.ts           # Interface de armazenamento
│   ├── vite.ts              # Configuração Vite para produção
│   ├── migrations/          # Migrações SQL do banco de dados
│   │   ├── 20250131_add_notifications_table.sql
│   │   ├── 20250131_add_portfolios.sql
│   │   ├── 20250201_add_archived_to_cards.sql
│   │   ├── 20250917_add_board_color.sql
│   │   └── ... (outras migrações)
│   ├── scripts/             # Scripts auxiliares do servidor
│   │   └── fix-label-duplicates.ts
│   └── utils/               # Utilitários do servidor
├── shared/                  # Código compartilhado entre cliente e servidor
│   └── schema.ts            # Esquemas de validação compartilhados (Zod)
└── docs/                    # Documentação adicional (se existir)
```

### Descrição dos Diretórios e Arquivos

#### Diretórios Principais
- **`client/`**: Aplicação frontend construída com React e TypeScript
- **`server/`**: Aplicação backend construída com Node.js, Express e TypeScript
- **`shared/`**: Código compartilhado entre frontend e backend
- **`uploads/`**: Diretório para armazenamento de arquivos enviados (imagens de perfil)
- **`docs/`**: Documentação adicional do projeto
- **`scripts/`**: Scripts utilitários para automação de tarefas

#### Arquivos de Configuração
- **`.env.example`**: Modelo para variáveis de ambiente
- **`Dockerfile`**: Definição da imagem Docker da aplicação
- **`docker-compose.yml`**: Configuração para execução com Docker Compose
- **`drizzle.config.ts`**: Configuração do ORM Drizzle para migrações
- **`init.sql`**: Script de inicialização do banco de dados

#### Documentos Importantes
- **`BUSINESS_RULES.md`**: Regras de negócio detalhadas do sistema
- **`DATABASE_SCHEMA.md`**: Esquema completo do banco de dados
- **`DASHBOARD_ENHANCEMENT_PRD.md`**: PRD (Product Requirements Document) do Dashboard aprimorado
- **`PROJECT_STRUCTURE_AND_API.md`**: Documentação da estrutura do projeto e API
- **`RAILWAY_GUIDE.md`**: Guia completo de deploy e configuração no Railway
- **`SECURITY_IMPLEMENTATION_REPORT.md`**: Relatório de implementação de segurança
- **`security-rules-ptbr.md`**: Regras e diretrizes de segurança em português

## Regras de Negócio

### 1. Autenticação e Autorização
- Somente usuários autenticados podem acessar o sistema
- Apenas administradores têm acesso total ao sistema
- Controles de acesso baseados em papéis (admin, user)
- Sistema de senha com requisitos de segurança
- Rate limiting para proteção contra tentativas de força bruta
- Validação de sessão em todas as requisições protegidas
- Expiração automática de sessões após período de inatividade

### 2. Gerenciamento de Projetos
- Usuários podem criar e gerenciar seus próprios portfólios
- Cada portfólio contém um ou mais quadros (boards)
- Quadros podem ser públicos ou privados
- Membros podem ser convidados para quadros com diferentes níveis de permissão
- Cada usuário pode ter quadros pessoais e compartilhados
- Proprietários de quadros têm controle total sobre seus recursos

### 3. Quadros e Listas
- Cada quadro contém múltiplas listas (colunas Kanban)
- Listas representam estágios do fluxo de trabalho
- Cartões representam tarefas individuais
- Ordem dos cartões pode ser personalizada
- Quadros podem ser arquivados para manter o ambiente organizado
- Histórico de movimentação de cartões entre listas é mantido

### 4. Gerenciamento de Tarefas
- Cartões podem ter títulos, descrições, prazos e prioridades
- Checklists permitem subdivisão de tarefas complexas
- Comentários facilitam discussões sobre tarefas
- Etiquetas permitem categorização visual e agrupamento
- Membros podem ser atribuídos a tarefas para responsabilidade clara
- Tarefas podem ser marcadas como concluídas para rastreamento de progresso

### 5. Colaboração
- Membros podem ser atribuídos a cartões
- Comentários podem ser adicionados a cartões
- Notificações são geradas para ações relevantes
- Checklists permitem subdivisão de tarefas
- Sistema de notificações permite acompanhamento em tempo real
- Atribuição de membros a subtarefas (checklist items) permite colaboração detalhada

### 6. Segurança e Auditoria
- Todas as ações mutantes são registradas no sistema de auditoria
- CSRF protection implementada em todas as rotas mutantes
- Validação rigorosa de entrada de dados
- Controle de acesso detalhado por entidade
- Registros de auditoria incluem quem, o quê, quando e onde
- Dados sensíveis são protegidos e não expostos desnecessariamente

### 7. Funcionalidades Avançadas
- Sistema de etiquetas para categorização visual
- Prioridades para classificação de importância
- Prazos e datas de vencimento com rastreamento
- Arquivamento de cartões e quadros
- Upload e armazenamento de imagens de perfil
- Sistema de notificações personalizadas e em tempo real
- Dashboard com estatísticas e insights detalhados
- Mini-dashboards de portfólio com métricas específicas
- Verificação automática de tarefas atrasadas
- Sistema de cores personalizáveis para portfólios e quadros
- Gerenciamento de membros de portfólio com controle de acesso

### 8. Controle de Acesso
- Permissões niveladas por nível de usuário
- Administradores têm acesso completo ao sistema
- Usuários comuns têm acesso limitado a seus próprios recursos
- Proprietários de quadros controlam membros e permissões
- Convidados têm acesso limitado conforme definido pelo proprietário

## Funcionalidades

### Gerenciamento de Projetos
- Criação e organização de portfólios
- Criação de quadros (boards) Kanban
- Organização de tarefas em listas (colunas)
- Atribuição de membros a quadros e cartões
- Configuração de cores e temas para portfólios e quadros
- Visualização hierárquica de projetos e tarefas

### Gestão de Tarefas
- Criação e edição de cartões (tarefas)
- Adição de descrições, prazos e prioridades
- Sistema de checklists para subtarefas
- Conclusão e acompanhamento de progresso
- Arquivamento de tarefas concluídas ou irrelevantes
- Histórico de alterações em tarefas
- Visualização de tarefas por responsável, data ou status

### Colaboração
- Atribuição de membros a tarefas
- Sistema de comentários com notificações
- Notificações em tempo real
- Compartilhamento de quadros
- Sistema de menções em comentários
- Integração com upload de arquivos para contexto

### Visualização
- Dashboard com estatísticas e métricas de produtividade
- Mini-dashboards de portfólio com visão geral de projetos
- Visualização de tarefas atrasadas com alertas
- Etiquetas para categorização visual
- Histórico de atividades e auditoria
- Gráficos de progresso e produtividade por período
- Filtros avançados para busca de tarefas
- Visualização de status de conclusão de tarefas
- Cards compactos e expandidos para melhor navegação

### Segurança
- Autenticação segura com tokens
- Controle de acesso baseado em papéis
- Auditoria de todas as ações
- Proteção CSRF
- Validação de entrada rigorosa
- Proteção contra injeção de dados

### Sistema de Auditoria e Atividades
- **Registro automático de ações**: Todas as operações importantes são registradas
- **Logs de auditoria**: Histórico completo de quem fez o quê e quando
- **Rastreamento de alterações**: Acompanhe mudanças em cards, listas e quadros
- **Dashboard administrativo**: Visualização de logs para administradores
- **Filtros avançados**: Busque logs por ação, entidade, usuário ou período
- **Registro de atividades**: Feed de atividades recentes em quadros

### Notificações
- Sistema de notificações em tempo real
- Central de notificações integrada ao dashboard
- Notificações de atribuição de tarefas
- Notificações de comentários e menções
- Notificações de alterações em cards e checklists
- Alertas para tarefas atrasadas e prazos próximos
- Contador de notificações não lidas
- Marcação de notificações como lidas individualmente ou em lote
- Sistema de limpeza de notificações antigas

### Upload e Arquivos
- Upload de imagens de perfil
- Armazenamento seguro de arquivos
- Formatos suportados: JPG, PNG, GIF
- Limites de tamanho configuráveis
- Processamento de imagens para otimização

## Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Superset de JavaScript com tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **Drizzle ORM** - Mapeamento objeto-relacional
- **Zod** - Validação de esquemas e tipos
- **Passport.js** - Autenticação e estratégias de login
- **bcrypt** - Hashing seguro de senhas
- **express-session** - Gerenciamento de sessões
- **csurf** - Proteção CSRF
- **Helmet** - Headers de segurança HTTP
- **sanitize-html** - Sanitização de entrada para prevenir XSS
- **Multer** - Upload de arquivos

### Frontend
- **React** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **React Router** - Roteamento de páginas
- **TanStack Query (React Query)** - Gerenciamento de estado e cache
- **Axios** - Chamadas HTTP
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones modernos
- **DOMPurify** - Sanitização de HTML no cliente
- **Vite** - Build tool e dev server

### DevOps & Containers
- **Docker** - Contêinerização
- **Docker Compose** - Orquestração de containers
- **Railway** - Plataforma de deploy em produção
- **PostgreSQL** - Banco de dados em produção

### Outras Ferramentas
- **ESLint** - Linting de código
- **Prettier** - Formatação automática
- **Jest** - Testes automatizados

## Docker e DevOps

### Estrutura Docker
O projeto utiliza Docker e Docker Compose para facilitar o desenvolvimento, testes e deployment:

- `Dockerfile` - Define a imagem da aplicação backend com Node.js
- `docker-compose.yml` - Configuração completa do ambiente de desenvolvimento (backend, frontend, banco de dados)
- `.dockerignore` - Arquivos/pastas ignorados durante o build do Docker

### Serviços Disponíveis
- **Frontend**: React desenvolvido com hot-reload para desenvolvimento ágil
- **Backend**: API Express com recarga automática (nodemon) em modo de desenvolvimento
- **Banco de dados**: PostgreSQL com persistência de dados em volume Docker
- **Redis (opcional)**: Cache e sessões (se implementado)

### Configuração do Docker Compose
O arquivo `docker-compose.yml` define os seguintes serviços:

- **`app`**: Servidor backend Node.js
- **`client`**: Servidor frontend React
- **`db`**: Banco de dados PostgreSQL
- **`nginx`**: Proxy reverso para roteamento de requisições (opcional)

### Comandos Docker Compose Comuns
```bash
# Subir todos os serviços
docker-compose up

# Subir em modo detached (background)
docker-compose up -d

# Subir com rebuild
docker-compose up --build

# Ver logs de todos os serviços
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs app

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (dados)
docker-compose down -v

# Executar comando dentro de um container
docker-compose exec app bash
```

### Estratégia de Deploy
- **Railway**: Deployment contínuo com integração Git automática
- **Docker**: Containerização para consistência entre ambientes
- **CI/CD**: Integração contínua com testes automatizados antes de deploy
- **PostgreSQL**: Banco de dados gerenciado no Railway com SSL
- **Migrações Automáticas**: Execução automática de migrações SQL no deploy

### Pipeline de CI/CD
1. **Teste**: Execução de testes unitários e de integração
2. **Validação**: Verificação de qualidade de código e segurança
3. **Build**: Compilação e empacotamento da aplicação
4. **Deploy**: Entrega automatizada para staging e produção
5. **Monitoramento**: Verificação de saúde pós-deploy

### Configuração de Variáveis de Ambiente
- **`docker-compose.yml`**: Variáveis de ambiente para containers
- **`.env`**: Variáveis locais (não versionadas)
- **`server/.env.example`**: Modelo de variáveis de ambiente

### Estratégias de Volume
- **Dados do banco**: Persistência em volume nomeado
- **Cache de dependências**: Volume para acelerar builds
- **Uploads**: Volume compartilhado para arquivos de usuários

## Segurança

### Autenticação
- **Sessões seguras**: Implementação de sessões com cookie signing para proteção contra roubo de sessão
- **Hashing de senha**: Utilização de bcrypt para armazenamento seguro de senhas
- **Reset de senha obrigatório**: Sistema que força usuários a alterarem senhas temporárias no primeiro login
  - Administrador padrão criado com credenciais temporárias (`sysadmin / ChangeMe@2025!`)
  - Usuários criados por administradores recebem senhas temporárias que devem ser alteradas
  - Redirecionamento automático para página de alteração de senha
  - Validação de força de senha (mínimo 8 caracteres, maiúsculas, minúsculas e números)
  - Geração de senhas aleatórias seguras (12 caracteres com símbolos) para reset por administrador
- **Proteção CSRF**: Implementação de tokens CSRF para todas as rotas mutantes (POST, PUT, PATCH, DELETE)
- **Rate limiting**: Limitação de requisições para proteção contra brute force e ataques de força bruta
- **Validação de credenciais**: Validação rigorosa de credenciais no login com tempo de espera exponencial

### Autorização
- **Controle baseado em papéis**: Implementação de diferentes níveis de acesso (admin, user)
- **Middleware de verificação**: Middleware personalizado para verificar permissões em rotas protegidas
- **Validação de propriedade**: Verificação se o usuário tem direito de acesso a recursos específicos (quadros, tarefas, etc.)
- **Auditoria de acesso não autorizado**: Registro de tentativas de acesso não autorizado para análise de segurança

### Proteção de Dados
- **Validação rigorosa de entrada**: Uso do Zod para validação de todos os dados de entrada
- **Prevenção de injeção SQL**: Utilização do ORM Drizzle com queries parametrizadas
- **Filtragem de dados sensíveis**: Remoção de informações sensíveis (como senhas) das respostas da API
- **Armazenamento seguro de senhas**: Utilização de algoritmos de hashing seguros (bcrypt) com salt único
- **Proteção de dados pessoais**: Política de mínima exposição de dados pessoais em APIs públicas

### Auditoria
- **Registro de todas as ações mutantes**: Sistema de auditoria que registra todas as ações de criação, atualização e exclusão
- **Rastreamento detalhado**: Informações sobre quem fez o quê, quando e de onde (IP, User-Agent)
- **Monitoramento de acesso**: Registros de acesso a recursos sensíveis do sistema
- **Logs detalhados**: Informações completas para análise forense em caso de incidentes
- **Integridade dos logs**: Garantia da integridade dos logs para auditorias externas

### Práticas Recomendadas de Segurança
- **HTTPS obrigatório**: Redirecionamento automático para HTTPS em produção
- **Security headers**: Configuração de headers de segurança adequados (CSP, HSTS, X-Frame-Options)
- **Injeção de dependência**: Padrão de injeção de dependência para evitar hardcoding de credenciais
- **Segurança em uploads**: Validação rigorosa de tipos de arquivos e tamanhos permitidos
- **Tratamento de erros**: Máscara de informações sensíveis nos erros exibidos ao usuário

### Vulnerabilidades Prevenidas
- **CSRF**: Tokens CSRF em todas as requisições mutantes
- **XSS**: Sanitização de conteúdo e uso de encoding adequado
- **SQL Injection**: Uso de ORM com queries parametrizadas
- **Insecure Direct Object References**: Validação de permissão de acesso a cada recurso
- **Security Misconfiguration**: Validação de configurações de segurança em todos os ambientes

## Endpoints da API

### Saúde e Debug
- `GET /api/health` - Verifica o status do sistema
  - **Descrição**: Endpoint para verificação de saúde da aplicação e banco de dados
  - **Autenticação**: Não necessária
  - **Resposta**: `{ status: "healthy", database: "connected", timestamp: "ISO string", uptime: number }`

- `GET /api/debug/session` - Debug de sessão do usuário
  - **Descrição**: Endpoint para debug de informações da sessão do usuário
  - **Autenticação**: Não necessária
  - **Resposta**: `{ isAuthenticated: boolean, sessionID: string, sessionExists: boolean, userId: number, userName: string }`

- `GET /api/debug/database` - Teste de conexão com banco de dados
  - **Descrição**: Endpoint para verificação da conexão com o banco de dados
  - **Autenticação**: Não necessária
  - **Resposta**: `{ status: "connected", userCount: number, listCount: number, cardCount: number, timestamp: "ISO string" }`

- `GET /api/csrf-token` - Obter token CSRF
  - **Descrição**: Endpoint para obtenção de token CSRF para proteção contra ataques
  - **Autenticação**: Não necessária
  - **Resposta**: `{ csrfToken: string }`

### Portfólios
- `GET /api/portfolios` - Listar portfólios
  - **Descrição**: Retorna todos os portfólios do usuário logado ou todos os portfólios se for admin
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[{ id: 1, name: "Meus Projetos", description: "Portfólio principal", color: "#3B82F6", userId: 1 }]`

- `GET /api/portfolios/:id` - Obter portfólio por ID
  - **Descrição**: Retorna os detalhes de um portfólio específico
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Exemplo de Resposta**: `{ id: 1, name: "Meus Projetos", description: "Portfólio principal", color: "#3B82F6", userId: 1 }`

- `GET /api/portfolios/:id/boards` - Obter quadros de um portfólio
  - **Descrição**: Retorna todos os quadros pertencentes a um portfólio específico
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Exemplo de Resposta**: `[{ id: 1, title: "Quadro de Projetos", description: "Projeto principal", userId: 1 }]`

- `POST /api/portfolios` - Criar novo portfólio
  - **Descrição**: Cria um novo portfólio para o usuário logado
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ name: string, description?: string, color?: string }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Novo Portfólio", description: "Descrição", color: "#3B82F6", userId: 1 }`

- `PATCH /api/portfolios/:id` - Atualizar portfólio
  - **Descrição**: Atualiza um portfólio existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Corpo da Requisição**: `{ name?: string, description?: string, color?: string }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Portfólio Atualizado", description: "Nova descrição", color: "#EF4444", userId: 1 }`

- `DELETE /api/portfolios/:id` - Excluir portfólio
  - **Descrição**: Exclui um portfólio existente e todos os quadros associados
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Resposta**: Status 204 (No Content)

- `GET /api/portfolios/:id/members` - Obter membros do portfólio
  - **Descrição**: Retorna todos os membros de um portfólio específico
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Exemplo de Resposta**: `[{ userId: 1, name: "João Silva", username: "joao", role: "ADMIN" }]`

- `POST /api/portfolios/:id/members` - Adicionar membro ao portfólio
  - **Descrição**: Adiciona um novo membro ao portfólio
  - **Autenticação**: Necessária (apenas proprietário)
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Corpo da Requisição**: `{ userId: number }`
  - **Exemplo de Resposta**: `{ portfolioId: 1, userId: 2 }`

- `DELETE /api/portfolios/:id/members/:userId` - Remover membro do portfólio
  - **Descrição**: Remove um membro do portfólio
  - **Autenticação**: Necessária (apenas proprietário)
  - **Parâmetros**: `id` (número) - ID do portfólio, `userId` (número) - ID do usuário
  - **Resposta**: Status 204 (No Content)

- `GET /api/portfolios/:id/mini-dashboard` - Mini-dashboard do portfólio
  - **Descrição**: Retorna estatísticas e métricas resumidas do portfólio
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do portfólio
  - **Exemplo de Resposta**: 
  ```json
  {
    "totalBoards": 5,
    "totalCards": 42,
    "completedCards": 18,
    "overdueCards": 3,
    "totalMembers": 8,
    "recentActivity": [...],
    "cardsByStatus": { "todo": 15, "doing": 9, "done": 18 }
  }
  ```

### Quadros
- `GET /api/user-boards` - Quadros do usuário logado
  - **Descrição**: Retorna todos os quadros que o usuário logado pode acessar
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[{ id: 1, title: "Meus Projetos", description: "Quadro principal", userId: 1 }]`

- `GET /api/boards` - Listar quadros acessíveis
  - **Descrição**: Retorna quadros públicos ou quadros aos quais o usuário tem acesso
  - **Autenticação**: Opcional (se autenticado, retorna quadros acessíveis)
  - **Exemplo de Resposta**: `[{ id: 1, title: "Quadro Público", description: "Descrição", userId: 1 }]`

- `GET /api/boards/:id` - Obter quadro por ID
  - **Descrição**: Retorna os detalhes de um quadro específico
  - **Autenticação**: Pode exigir autenticação dependendo da configuração de privacidade do quadro
  - **Parâmetros**: `id` (número) - ID do quadro
  - **Exemplo de Resposta**: `{ id: 1, title: "Quadro de Projetos", description: "Descrição do quadro", userId: 1, createdAt: "ISO string" }`

- `POST /api/boards` - Criar novo quadro
  - **Descrição**: Cria um novo quadro para o usuário logado
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ title: string, description?: string, public?: boolean, portfolioId?: number, color?: string }`
  - **Exemplo de Resposta**: `{ id: 1, title: "Novo Quadro", description: "Descrição", userId: 1, public: false }`

- `PATCH /api/boards/:id` - Atualizar quadro
  - **Descrição**: Atualiza um quadro existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do quadro
  - **Corpo da Requisição**: `{ title?: string, description?: string, public?: boolean, color?: string }`
  - **Exemplo de Resposta**: `{ id: 1, title: "Quadro Atualizado", description: "Nova descrição", userId: 1, public: true }`

- `DELETE /api/boards/:id` - Excluir quadro
  - **Descrição**: Exclui um quadro e todos os listas e cartões associados
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do quadro
  - **Resposta**: Status 204 (No Content)

- `GET /api/boards/:boardId/lists` - Listas de um quadro
  - **Descrição**: Retorna todas as listas de um quadro específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade do quadro
  - **Parâmetros**: `boardId` (número) - ID do quadro
  - **Exemplo de Resposta**: `[{ id: 1, title: "A Fazer", boardId: 1, order: 0 }]`

- `GET /api/boards/archived` - Quadros arquivados
  - **Descrição**: Retorna todos os quadros arquivados do usuário (ou todos se for admin)
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[{ id: 1, title: "Quadro Arquivado", description: "Descrição", userId: 1 }]`

- `POST /api/boards/:id/archive` - Arquivar quadro
  - **Descrição**: Move um quadro para o estado arquivado
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do quadro
  - **Exemplo de Resposta**: `{ id: 1, title: "Quadro Arquivado", archived: true, archivedAt: "ISO string" }`

- `POST /api/boards/:id/unarchive` - Desarquivar quadro
  - **Descrição**: Restaura um quadro do estado arquivado
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do quadro
  - **Exemplo de Resposta**: `{ id: 1, title: "Quadro Restaurado", archived: false, archivedAt: null }`

### Listas
- `POST /api/lists` - Criar nova lista
  - **Descrição**: Cria uma nova lista em um quadro
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ title: string, boardId: number, order?: number }`
  - **Exemplo de Resposta**: `{ id: 1, title: "A Fazer", boardId: 1, order: 0 }`

- `PATCH /api/lists/:id` - Atualizar lista
  - **Descrição**: Atualiza uma lista existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da lista
  - **Corpo da Requisição**: `{ title?: string, order?: number }`
  - **Exemplo de Resposta**: `{ id: 1, title: "A Fazer Atualizado", boardId: 1, order: 0 }`

- `DELETE /api/lists/:id` - Excluir lista
  - **Descrição**: Exclui uma lista e todos os cartões associados
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da lista
  - **Resposta**: Status 204 (No Content)

- `GET /api/lists/:listId/cards` - Cartões de uma lista
  - **Descrição**: Retorna todos os cartões de uma lista específica
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `listId` (número) - ID da lista
  - **Exemplo de Resposta**: `[{ id: 1, title: "Tarefa 1", description: "Descrição", listId: 1, order: 0 }]`

### Cartões
- `GET /api/cards/:id` - Obter cartão por ID
  - **Descrição**: Retorna os detalhes de um cartão específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade do quadro
  - **Parâmetros**: `id` (número) - ID do cartão
  - **Exemplo de Resposta**: `{ id: 1, title: "Tarefa 1", description: "Descrição", listId: 1, order: 0, dueDate: "ISO string", completed: false }`

- `GET /api/cards/:cardId/details` - Obter detalhes completos do cartão
  - **Descrição**: Retorna detalhes completos do cartão incluindo informações de relacionamentos
  - **Autenticação**: Necessária
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Exemplo de Resposta**: `{ card: {...}, list: {...}, board: {...}, members: [...], labels: [...], checklists: [...] }`

- `POST /api/cards` - Criar novo cartão
  - **Descrição**: Cria um novo cartão em uma lista
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ title: string, description?: string, listId: number, dueDate?: string, order?: number, priority?: string }`
  - **Exemplo de Resposta**: `{ id: 1, title: "Nova Tarefa", description: "Descrição", listId: 1, order: 0, dueDate: "ISO string", completed: false }`

- `PATCH /api/cards/:id` - Atualizar cartão
  - **Descrição**: Atualiza um cartão existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do cartão
  - **Corpo da Requisição**: `{ title?: string, description?: string, dueDate?: string, completed?: boolean, priority?: string }`
  - **Exemplo de Resposta**: `{ id: 1, title: "Tarefa Atualizada", description: "Nova descrição", listId: 1, order: 0, dueDate: "ISO string", completed: true }`

- `DELETE /api/cards/:id` - Excluir cartão
  - **Descrição**: Exclui um cartão e todos os relacionamentos associados
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do cartão
  - **Resposta**: Status 204 (No Content)

- `GET /api/cards/archived` - Cartões arquivados
  - **Descrição**: Retorna cartões arquivados, com suporte para filtragem por lista ou quadro
  - **Autenticação**: Necessária
  - **Parâmetros da Query**: `listId?: number, boardId?: number`
  - **Exemplo de Resposta**: `[{ id: 1, title: "Tarefa Arquivada", archived: true, archivedAt: "ISO string" }]`

- `POST /api/cards/:id/archive` - Arquivar cartão
  - **Descrição**: Move um cartão para o estado arquivado
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do cartão
  - **Exemplo de Resposta**: `{ id: 1, title: "Tarefa Arquivada", archived: true, archivedAt: "ISO string" }`

- `POST /api/cards/:id/unarchive` - Desarquivar cartão
  - **Descrição**: Restaura um cartão do estado arquivado
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do cartão
  - **Exemplo de Resposta**: `{ id: 1, title: "Tarefa Restaurada", archived: false, archivedAt: null }`

- `PATCH /api/cards/:id/complete` - Marcar/desmarcar cartão como concluído
  - **Descrição**: Alterna o status de conclusão de um cartão
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do cartão
  - **Corpo da Requisição**: `{ completed?: boolean }`
  - **Exemplo de Resposta**: `{ message: "Cartão marcado como concluído", card: {...} }`

- `GET /api/cards/overdue-dashboard` - Cartões atrasados do dashboard
  - **Descrição**: Retorna cartões com prazo vencido para exibição no dashboard
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[{ id: 1, title: "Tarefa Atrasada", dueDate: "ISO string", listName: "A Fazer", boardName: "Quadro 1" }]`

### Etiquetas
- `GET /api/boards/:boardId/labels` - Etiquetas de um quadro
  - **Descrição**: Retorna todas as etiquetas de um quadro específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `boardId` (número) - ID do quadro
  - **Exemplo de Resposta**: `[{ id: 1, name: "Bug", color: "#EF4444", boardId: 1 }]`

- `POST /api/labels` - Criar nova etiqueta
  - **Descrição**: Cria uma nova etiqueta para um quadro
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ name: string, color: string, boardId: number }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Bug", color: "#EF4444", boardId: 1 }`

- `PATCH /api/labels/:id` - Atualizar etiqueta
  - **Descrição**: Atualiza uma etiqueta existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da etiqueta
  - **Corpo da Requisição**: `{ name?: string, color?: string }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Bug Crítico", color: "#B91C1C", boardId: 1 }`

- `DELETE /api/labels/:id` - Excluir etiqueta
  - **Descrição**: Exclui uma etiqueta e remove todas as associações com cartões
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da etiqueta
  - **Resposta**: Status 204 (No Content)

- `GET /api/cards/:cardId/labels` - Etiquetas de um cartão
  - **Descrição**: Retorna todas as etiquetas associadas a um cartão específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Exemplo de Resposta**: `[{ id: 1, labelId: 1, cardId: 1, label: { id: 1, name: "Bug", color: "#EF4444" } }]`

- `GET /api/boards/:boardId/cards/labels` - Etiquetas de cartões do quadro
  - **Descrição**: Retorna todas as associações etiqueta-cartão para um quadro específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `boardId` (número) - ID do quadro
  - **Exemplo de Resposta**: `[{ id: 1, labelId: 1, cardId: 1, label: { id: 1, name: "Bug", color: "#EF4444" }, card: { id: 1, title: "Tarefa 1" } }]`

- `POST /api/card-labels` - Associar etiqueta a cartão
  - **Descrição**: Associa uma etiqueta a um cartão
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ cardId: number, labelId: number }`
  - **Exemplo de Resposta**: `{ id: 1, cardId: 1, labelId: 1 }`

- `DELETE /api/cards/:cardId/labels/:labelId` - Remover associação etiqueta-cartão
  - **Descrição**: Remove uma associação entre etiqueta e cartão
  - **Autenticação**: Necessária
  - **Parâmetros**: `cardId` (número) - ID do cartão, `labelId` (número) - ID da etiqueta
  - **Resposta**: Status 204 (No Content)

### Prioridades
- `GET /api/boards/:boardId/priorities` - Prioridades de um quadro
  - **Descrição**: Retorna todas as prioridades definidas para um quadro específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `boardId` (número) - ID do quadro
  - **Exemplo de Resposta**: `[{ id: 1, name: "Alta", color: "#EF4444", boardId: 1 }]`

- `GET /api/boards/:boardId/cards/priorities` - Prioridades de cartões do quadro
  - **Descrição**: Retorna todas as associações prioridade-cartão para um quadro específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `boardId` (número) - ID do quadro
  - **Exemplo de Resposta**: `[{ id: 1, priorityId: 1, cardId: 1, priority: { id: 1, name: "Alta", color: "#EF4444" }, card: { id: 1, title: "Tarefa 1" } }]`

- `POST /api/priorities` - Criar nova prioridade
  - **Descrição**: Cria uma nova prioridade para um quadro
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ name: string, color: string, boardId: number }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Média", color: "#F59E0B", boardId: 1 }`

- `PATCH /api/priorities/:id` - Atualizar prioridade
  - **Descrição**: Atualiza uma prioridade existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da prioridade
  - **Corpo da Requisição**: `{ name?: string, color?: string }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Média Alta", color: "#D97706", boardId: 1 }`

- `DELETE /api/priorities/:id` - Excluir prioridade
  - **Descrição**: Exclui uma prioridade e remove todas as associações com cartões
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da prioridade
  - **Resposta**: Status 204 (No Content)

- `GET /api/cards/:cardId/priority` - Prioridade de um cartão
  - **Descrição**: Retorna a prioridade associada a um cartão específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Exemplo de Resposta**: `{ id: 1, priorityId: 1, cardId: 1, priority: { id: 1, name: "Alta", color: "#EF4444" } }`

- `POST /api/card-priorities` - Associar prioridade a cartão
  - **Descrição**: Associa uma prioridade a um cartão
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ cardId: number, priorityId: number }`
  - **Exemplo de Resposta**: `{ id: 1, cardId: 1, priorityId: 1 }`

- `DELETE /api/cards/:cardId/priority` - Remover prioridade de cartão
  - **Descrição**: Remove a associação de prioridade de um cartão
  - **Autenticação**: Necessária
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Resposta**: Status 204 (No Content)

### Comentários
- `GET /api/cards/:cardId/comments` - Comentários de um cartão
  - **Descrição**: Retorna todos os comentários de um cartão específico, com suporte para filtragem por subtarefa
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Parâmetros da Query**: `checklistItemId?: number` - Filtrar por subtarefa específica
  - **Exemplo de Resposta**: `[{ id: 1, content: "Comentário importante", cardId: 1, userId: 1, createdAt: "ISO string", user: { id: 1, name: "Usuário" } }]`

- `POST /api/comments` - Criar novo comentário
  - **Descrição**: Cria um novo comentário em um cartão
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ content: string, cardId: number, checklistItemId?: number }`
  - **Exemplo de Resposta**: `{ id: 1, content: "Comentário importante", cardId: 1, userId: 1, createdAt: "ISO string" }`

- `DELETE /api/comments/:id` - Excluir comentário
  - **Descrição**: Exclui um comentário existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do comentário
  - **Resposta**: Status 204 (No Content)

### Usuários
- `GET /api/users` - Listar usuários
  - **Descrição**: Retorna todos os usuários do sistema (admin apenas)
  - **Autenticação**: Necessária (admin)
  - **Exemplo de Resposta**: `[{ id: 1, name: "Usuário 1", username: "user1", email: "user1@example.com", role: "user" }]`

- `PATCH /api/users/:id` - Atualizar usuário
  - **Descrição**: Atualiza informações de um usuário (próprio usuário ou admin)
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do usuário
  - **Corpo da Requisição**: `{ name?: string, username?: string, role?: string }`
  - **Exemplo de Resposta**: `{ id: 1, name: "Novo Nome", username: "novo_user", email: "user@example.com" }`

- `DELETE /api/users/:id` - Excluir usuário
  - **Descrição**: Exclui um usuário do sistema (admin apenas)
  - **Autenticação**: Necessária (admin)
  - **Parâmetros**: `id` (número) - ID do usuário
  - **Resposta**: Status 204 (No Content)

- `POST /api/users/:id/change-password` - Alterar senha
  - **Descrição**: Altera a senha de um usuário
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do usuário
  - **Corpo da Requisição**: `{ currentPassword: string, newPassword: string }`
  - **Exemplo de Resposta**: `{ message: "Senha alterada com sucesso" }`

- `POST /api/users/:id/profile-image` - Upload de imagem de perfil
  - **Descrição**: Faz upload de uma nova imagem de perfil para o usuário
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do usuário
  - **Corpo da Requisição**: `multipart/form-data` com campo `profile_image`
  - **Exemplo de Resposta**: `{ id: 1, name: "Usuário", profilePicture: "/uploads/profile_pictures/filename.jpg" }`

### Notificações
- `GET /api/notifications` - Listar notificações
  - **Descrição**: Retorna todas as notificações do usuário logado
  - **Autenticação**: Necessária
  - **Parâmetros da Query**: `limit?: number` (padrão: 50), `offset?: number` (padrão: 0), `unreadOnly?: boolean`
  - **Exemplo de Resposta**: 
  ```json
  [
    {
      "id": 1,
      "userId": 2,
      "type": "task_assigned",
      "title": "Nova tarefa atribuída",
      "message": "João atribuiu a tarefa 'Implementar login' para você",
      "read": false,
      "actionUrl": "/board/1/card/5",
      "relatedCardId": 5,
      "fromUserId": 1,
      "createdAt": "2025-09-18T10:30:00Z",
      "fromUser": {
        "id": 1,
        "name": "João Silva",
        "username": "joao"
      }
    }
  ]
  ```

- `GET /api/notifications/unread-count` - Contador de notificações não lidas
  - **Descrição**: Retorna o número de notificações não lidas do usuário
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ count: 5 }`

- `POST /api/notifications/:id/read` - Marcar notificação como lida
  - **Descrição**: Marca uma notificação específica como lida
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da notificação
  - **Exemplo de Resposta**: `{ success: true, notification: { ...notificação atualizada } }`

- `POST /api/notifications/mark-all-read` - Marcar todas como lidas
  - **Descrição**: Marca todas as notificações do usuário como lidas
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ success: true, count: 5 }`

- `POST /api/notifications/:id/clear` - Limpar notificação
  - **Descrição**: Marca uma notificação como deletada (soft delete)
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da notificação
  - **Exemplo de Resposta**: `{ success: true }`

- `POST /api/notifications/clear-all` - Limpar todas as notificações
  - **Descrição**: Marca todas as notificações do usuário como deletadas
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ success: true, count: 10 }`

- `DELETE /api/notifications/:id` - Excluir notificação permanentemente
  - **Descrição**: Remove permanentemente uma notificação do banco de dados
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da notificação
  - **Resposta**: Status 204 (No Content)

### Membros
- `GET /api/cards/:cardId/members` - Membros de um cartão
  - **Descrição**: Retorna todos os membros associados a um cartão específico
  - **Autenticação**: Necessária
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Exemplo de Resposta**: `[{ id: 1, userId: 1, cardId: 1, user: { id: 1, name: "Usuário", username: "user" } }]`

- `POST /api/card-members` - Adicionar membro a cartão
  - **Descrição**: Adiciona um membro a um cartão
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ cardId: number, userId: number }`
  - **Exemplo de Resposta**: `{ id: 1, cardId: 1, userId: 1 }`

- `DELETE /api/cards/:cardId/members/:userId` - Remover membro de cartão
  - **Descrição**: Remove um membro de um cartão
  - **Autenticação**: Necessária
  - **Parâmetros**: `cardId` (número) - ID do cartão, `userId` (número) - ID do usuário
  - **Resposta**: Status 204 (No Content)

- `GET /api/boards/:boardId/members` - Membros de um quadro
  - **Descrição**: Retorna todos os membros associados a um quadro específico
  - **Autenticação**: Necessária
  - **Parâmetros**: `boardId` (número) - ID do quadro
  - **Exemplo de Resposta**: `[{ id: 1, userId: 1, boardId: 1, role: "member", user: { id: 1, name: "Usuário", username: "user" } }]`

- `GET /api/boards/:boardId/members/:userId` - Obter membro específico de quadro
  - **Descrição**: Retorna informações sobre um membro específico em um quadro
  - **Autenticação**: Necessária
  - **Parâmetros**: `boardId` (número) - ID do quadro, `userId` (número) - ID do usuário
  - **Exemplo de Resposta**: `{ id: 1, userId: 1, boardId: 1, role: "member" }`

- `POST /api/board-members` - Adicionar membro a quadro
  - **Descrição**: Adiciona um membro a um quadro
  - **Autenticação**: Necessária (proprietário do quadro ou admin)
  - **Corpo da Requisição**: `{ boardId: number, userId: number, role?: string }`
  - **Exemplo de Resposta**: `{ id: 1, boardId: 1, userId: 1, role: "member" }`

- `PATCH /api/boards/:boardId/members/:userId` - Atualizar papel de membro em quadro
  - **Descrição**: Atualiza o papel (role) de um membro em um quadro
  - **Autenticação**: Necessária (proprietário do quadro ou admin)
  - **Parâmetros**: `boardId` (número) - ID do quadro, `userId` (número) - ID do usuário
  - **Corpo da Requisição**: `{ role: string }`
  - **Exemplo de Resposta**: `{ id: 1, boardId: 1, userId: 1, role: "admin" }`

- `DELETE /api/boards/:boardId/members/:userId` - Remover membro de quadro
  - **Descrição**: Remove um membro de um quadro
  - **Autenticação**: Necessária (proprietário do quadro ou admin)
  - **Parâmetros**: `boardId` (número) - ID do quadro, `userId` (número) - ID do usuário
  - **Resposta**: Status 204 (No Content)

### Checklists
- `GET /api/cards/:cardId/checklists` - Checklists de um cartão
  - **Descrição**: Retorna todas as checklists associadas a um cartão específico
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `cardId` (número) - ID do cartão
  - **Exemplo de Resposta**: `[{ id: 1, title: "Itens de verificação", cardId: 1, order: 0 }]`

- `GET /api/checklists/:id` - Obter checklist por ID
  - **Descrição**: Retorna os detalhes de uma checklist específica
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `id` (número) - ID da checklist
  - **Exemplo de Resposta**: `{ id: 1, title: "Itens de verificação", cardId: 1, order: 0 }`

- `POST /api/checklists` - Criar novo checklist
  - **Descrição**: Cria uma nova checklist em um cartão
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ title: string, cardId: number, order?: number }`
  - **Exemplo de Resposta**: `{ id: 1, title: "Nova Lista", cardId: 1, order: 0 }`

- `PATCH /api/checklists/:id` - Atualizar checklist
  - **Descrição**: Atualiza uma checklist existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da checklist
  - **Corpo da Requisição**: `{ title?: string, order?: number }`
  - **Exemplo de Resposta**: `{ id: 1, title: "Lista Atualizada", cardId: 1, order: 0 }`

- `DELETE /api/checklists/:id` - Excluir checklist
  - **Descrição**: Exclui uma checklist e todos os itens associados
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da checklist
  - **Resposta**: Status 204 (No Content)

### Itens de Checklist
- `GET /api/checklists/:checklistId/items` - Itens de um checklist
  - **Descrição**: Retorna todos os itens de uma checklist específica
  - **Autenticação**: Pode exigir dependendo da configuração de privacidade
  - **Parâmetros**: `checklistId` (número) - ID da checklist
  - **Exemplo de Resposta**: `[{ id: 1, content: "Item 1", checklistId: 1, completed: false, order: 0 }]`

- `POST /api/checklist-items` - Criar novo item de checklist
  - **Descrição**: Cria um novo item em uma checklist
  - **Autenticação**: Necessária
  - **Corpo da Requisição**: `{ content: string, checklistId: number, description?: string, order?: number, completed?: boolean, parentItemId?: number, assignedToUserId?: number, dueDate?: string }`
  - **Exemplo de Resposta**: `{ id: 1, content: "Novo item", checklistId: 1, completed: false, order: 0 }`

- `PATCH /api/checklist-items/:id` - Atualizar item de checklist
  - **Descrição**: Atualiza um item de checklist existente
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do item
  - **Corpo da Requisição**: `{ content?: string, description?: string, completed?: boolean, order?: number, assignedToUserId?: number, dueDate?: string }`
  - **Exemplo de Resposta**: `{ id: 1, content: "Item atualizado", checklistId: 1, completed: true, order: 0 }`

- `DELETE /api/checklist-items/:id` - Excluir item de checklist
  - **Descrição**: Exclui um item de checklist
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do item
  - **Resposta**: Status 204 (No Content)

- `GET /api/checklist-items/:id/members` - Membros de um item de checklist
  - **Descrição**: Retorna todos os membros associados a um item de checklist específico
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do item
  - **Exemplo de Resposta**: `[{ id: 1, userId: 1, checklistItemId: 1, user: { id: 1, name: "Usuário", username: "user" } }]`

- `POST /api/checklist-items/:id/members` - Adicionar membro a item de checklist
  - **Descrição**: Adiciona um membro a um item de checklist
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do item
  - **Corpo da Requisição**: `{ userId: number }`
  - **Exemplo de Resposta**: Status 201 (Created)

- `DELETE /api/checklist-items/:id/members/:userId` - Remover membro de item de checklist
  - **Descrição**: Remove um membro de um item de checklist
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID do item, `userId` (número) - ID do usuário
  - **Resposta**: Status 204 (No Content)

### Dashboard
- `GET /api/dashboard/collaborators` - Colaboradores do dashboard
  - **Descrição**: Retorna colaboradores dos quadros acessíveis pelo usuário logado
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[{ id: 1, name: "Usuário", username: "user", profilePicture: "/uploads/...", role: "user", lastSeen: "ISO string" }]`

- `GET /api/dashboard/stats` - Estatísticas do dashboard
  - **Descrição**: Retorna estatísticas gerais do sistema para o usuário logado
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ totalBoards: 5, totalCards: 20, completedCards: 5, overdueCards: 2, completionRate: 25, totalUsers: 10 }`

- `GET /api/dashboard/recent-tasks` - Tarefas recentes do dashboard
  - **Descrição**: Retorna tarefas recentes dos quadros acessíveis pelo usuário logado
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[{ id: 1, title: "Tarefa recente", description: "Descrição", priority: "média", status: "A Fazer", dueDate: "ISO string", boardId: 1, boardName: "Quadro 1", listName: "A Fazer" }]`

- `GET /api/dashboard/checklist-items` - Itens de checklist do dashboard
  - **Descrição**: Retorna itens de checklist relevantes para o usuário logado
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `[]`

### Verificação de Tarefas Atrasadas
- `POST /api/check-overdue-tasks` - Verificar e notificar tarefas atrasadas
  - **Descrição**: Verifica tarefas e subtarefas atrasadas e gera notificações
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ success: true, notificationsCreated: 3 }`

### Notificações
- `GET /api/notifications` - Listar notificações do usuário
  - **Descrição**: Retorna todas as notificações do usuário logado
  - **Autenticação**: Necessária
  - **Parâmetros da Query**: `limit?: number, offset?: number, unreadOnly?: boolean`
  - **Exemplo de Resposta**: `[{ id: 1, title: "Nova atribuição", message: "Você foi atribuído a uma tarefa", read: false, type: "task_assigned", createdAt: "ISO string", fromUser: {...} }]`

- `GET /api/notifications/unread-count` - Contagem de notificações não lidas
  - **Descrição**: Retorna a contagem de notificações não lidas do usuário logado
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ unreadCount: 5 }`

- `POST /api/notifications/:id/read` - Marcar notificação como lida
  - **Descrição**: Marca uma notificação específica como lida
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da notificação
  - **Exemplo de Resposta**: `{ success: true }`

- `POST /api/notifications/mark-all-read` - Marcar todas como lidas
  - **Descrição**: Marca todas as notificações do usuário como lidas
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ success: true, markedCount: 10 }`

- `POST /api/notifications/:id/clear` - Limpar notificação
  - **Descrição**: Remove notificação da visualização (não exclui permanentemente)
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da notificação
  - **Exemplo de Resposta**: `{ success: true }`

- `POST /api/notifications/clear-all` - Limpar todas as notificações
  - **Descrição**: Limpa todas as notificações do usuário (não exclui permanentemente)
  - **Autenticação**: Necessária
  - **Exemplo de Resposta**: `{ success: true, clearedCount: 10 }`

- `DELETE /api/notifications/:id` - Excluir notificação
  - **Descrição**: Exclui permanentemente uma notificação
  - **Autenticação**: Necessária
  - **Parâmetros**: `id` (número) - ID da notificação
  - **Exemplo de Resposta**: `{ success: true }`

### Administração
- `GET /api/admin/audit-logs` - Logs de auditoria (apenas para administradores)
  - **Descrição**: Retorna logs de auditoria do sistema com opções de filtragem
  - **Autenticação**: Necessária (admin)
  - **Parâmetros da Query**: `page?: number, limit?: number, search?: string, action?: string, entityType?: string, userId?: number, startDate?: string, endDate?: string`
  - **Exemplo de Resposta**: `{ logs: [...], pagination: { page: 1, limit: 50, total: 100 } }`

## Configuração e Instalação

### Pré-requisitos
- Node.js (v16 ou superior)
- npm (gerenciador de pacotes do Node.js)
- Docker e Docker Compose (para execução com containers)
- PostgreSQL (ou Docker para ambiente de desenvolvimento)
- Git
- TypeScript (compilador)
- OpenSSL (para geração de chaves de sessão)

### Configuração do Ambiente

#### 1. Clonar o repositório
```bash
git clone https://github.com/frizen94/vercel.git
cd vercel
```

#### 2. Configurar variáveis de ambiente
```bash
# Na raiz do projeto
cp .env.example .env
# Preencher as variáveis necessárias no arquivo .env
```

**Principais variáveis de ambiente:**
- `PORT` - Porta do servidor (padrão: 3000)
- `DATABASE_URL` - URL de conexão com o banco de dados PostgreSQL
- `SESSION_SECRET` - Chave secreta para criptografia de sessões
- `CSRF_SECRET` - Chave secreta para proteção CSRF
- `UPLOAD_PATH` - Caminho para armazenamento de uploads
- `NODE_ENV` - Ambiente de execução (development, production)

#### 3. Instalar dependências

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

#### 4. Configurar banco de dados
O sistema utiliza PostgreSQL como banco de dados principal com Drizzle ORM para gerenciamento de esquemas. As opções são:

**Opção A: Utilizar PostgreSQL local**
- Instalar PostgreSQL na máquina
- Criar banco de dados: `CREATE DATABASE kanban_dev;`
- Configurar `DATABASE_URL` no arquivo `.env`

**Opção B: Utilizar container Docker (recomendado para desenvolvimento)**
```bash
# Na raiz do projeto
docker-compose up -d db
```

#### 5. Executar migrações do banco de dados
```bash
cd server
npx drizzle-kit push:pg
# ou para ambiente de desenvolvimento
npm run migrate
```

#### 6. Primeiro Acesso - Credenciais Padrão

No primeiro acesso ao sistema, um usuário administrador é criado automaticamente com as seguintes credenciais temporárias:

- **Usuário**: `sysadmin`
- **Senha**: `ChangeMe@2025!`

> ⚠️ **IMPORTANTE - Segurança**:
> - Por segurança, você será **obrigado a alterar esta senha** no primeiro login
> - O sistema redirecionará automaticamente para a página de alteração de senha
> - A nova senha deve ter no mínimo 8 caracteres, incluindo:
>   - Pelo menos uma letra maiúscula
>   - Pelo menos uma letra minúscula  
>   - Pelo menos um número
>   - Caractere especial (recomendado)
> - Após alterar a senha, você terá acesso total ao sistema

**Criação de novos usuários:**
- Quando você criar novos usuários como administrador, eles também receberão senhas temporárias
- Esses usuários serão forçados a alterar suas senhas no primeiro login
- Use o recurso "Resetar Senha" para gerar senhas temporárias seguras automaticamente

#### 7. Executar a aplicação

**Modo desenvolvimento (separado):**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

**Modo desenvolvimento (Docker Compose):**
```bash
# Na raiz do projeto
docker-compose up --build
```

### Estrutura de Arquivos de Configuração

#### Arquivos de Configuração Importantes
- `drizzle.config.ts` - Configuração do ORM Drizzle
- `server/middlewares/auth.ts` - Configuração de autenticação
- `server/middlewares/validation.ts` - Configuração de validação de dados
- `server/database.ts` - Configuração de conexão com banco de dados
- `client/.env` - Variáveis de ambiente do frontend
- `server/.env` - Variáveis de ambiente do backend

### Scripts Disponíveis

#### Backend (server/)
- `npm run dev` - Executar servidor em modo desenvolvimento (watch)
- `npm run build` - Compilar o projeto para produção
- `npm run start` - Executar servidor em modo produção
- `npm run migrate` - Executar migrações do banco de dados
- `npm test` - Executar testes automatizados
- `npm run lint` - Verificar qualidade de código

#### Frontend (client/)
- `npm start` - Executar aplicação em modo desenvolvimento (localhost:3000)
- `npm run build` - Criar build de produção
- `npm test` - Executar testes de frontend
- `npm run lint` - Verificar qualidade de código
- `npm run format` - Formatar código automaticamente

### Configuração de Desenvolvimento Recomendada

#### IDE e Ferramentas
- **VS Code** com extensões recomendadas:
  - TypeScript
  - ESLint
  - Prettier
  - Docker
  - PostgreSQL

#### Extensões VS Code Recomendadas
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### Configuração de Formatação (Prettier)
O projeto utiliza Prettier para formatação automática de código com as seguintes configurações:
- Indentação com 2 espaços
- Ponto e vírgula obrigatório
- Aspas duplas para strings
- Fim de arquivo com quebra de linha

## Deployment

### Arquitetura Agnóstica de Deploy

Este projeto foi desenvolvido com uma arquitetura **agnóstica de plataforma**, o que significa que pode ser implantado em qualquer ambiente que suporte:
- **Docker** e **Docker Compose**
- **Node.js 20+**
- **PostgreSQL 15+**

Você pode fazer deploy em:
- ☁️ **Plataformas Cloud**: Railway, Heroku, Render, DigitalOcean App Platform, AWS, Google Cloud, Azure
- 🖥️ **Servidores VPS**: DigitalOcean Droplets, Linode, Vultr, AWS EC2, Hetzner
- 🏢 **Servidores On-Premise**: Infraestrutura própria com Docker
- 🐳 **Kubernetes**: Orquestração de containers em cluster

### Deploy com Docker Compose (Servidor Tradicional/VPS)

Esta é a forma mais simples e recomendada para deploy em servidores próprios ou VPS. O Docker Compose gerencia todos os serviços necessários (aplicação + banco de dados).

#### Pré-requisitos
- Servidor Linux (Ubuntu 20.04+, Debian 11+, ou similar)
- Docker e Docker Compose instalados
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)
- Certificado SSL (Let's Encrypt recomendado)

#### Passo 1: Instalar Docker e Docker Compose no Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar repositório Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Adicionar usuário ao grupo docker (opcional)
sudo usermod -aG docker $USER
```

#### Passo 2: Clonar o Repositório no Servidor

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

# Ou fazer upload via SCP/SFTP
```

#### Passo 3: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env na raiz do projeto
nano .env
```

Adicione as seguintes variáveis:

```env
# Ambiente
NODE_ENV=production

# Banco de Dados
DATABASE_URL=postgresql://kanban_user:senha_segura_aqui@postgres:5432/kanban_db
POSTGRES_USER=kanban_user
POSTGRES_PASSWORD=senha_segura_aqui
POSTGRES_DB=kanban_db

# Sessão (IMPORTANTE: Gerar chave segura)
SESSION_SECRET=sua_chave_secreta_muito_forte_aqui_min_32_caracteres

# Porta da aplicação
PORT=5000

# CSRF (Opcional - domínio do seu site)
CSRF_COOKIE_DOMAIN=seu-dominio.com
```

> 💡 **Dica**: Gere uma `SESSION_SECRET` segura com:
> ```bash
> openssl rand -base64 32
> ```

#### Passo 4: Ajustar docker-compose.yml para Produção

Crie ou ajuste o arquivo `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: kanban_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - kanban_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: kanban_app
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - kanban_network
    restart: unless-stopped
    volumes:
      - ./public/uploads:/app/public/uploads

volumes:
  postgres_data:

networks:
  kanban_network:
    driver: bridge
```

#### Passo 5: Build e Deploy

```bash
# Build das imagens
docker compose -f docker-compose.prod.yml build

# Subir os serviços
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f app
```

#### Passo 6: Configurar Nginx como Reverse Proxy (Recomendado)

Instale e configure o Nginx para servir a aplicação com SSL:

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/kanban
```

Adicione a configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Tamanho máximo de upload
    client_max_body_size 10M;

    # Proxy para aplicação
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/kanban /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

#### Passo 7: Configurar SSL com Let's Encrypt (Certbot)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática já está configurada
sudo certbot renew --dry-run
```

#### Passo 8: Primeiro Acesso

Acesse `https://seu-dominio.com` e faça login com as credenciais padrão:
- **Usuário**: `sysadmin`
- **Senha**: `ChangeMe@2025!`

> ⚠️ Você será obrigado a alterar a senha no primeiro login por segurança.

#### Comandos Úteis para Manutenção

```bash
# Ver logs da aplicação
docker compose -f docker-compose.prod.yml logs -f app

# Ver logs do banco de dados
docker compose -f docker-compose.prod.yml logs -f postgres

# Reiniciar aplicação
docker compose -f docker-compose.prod.yml restart app

# Parar todos os serviços
docker compose -f docker-compose.prod.yml down

# Atualizar aplicação (após git pull)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Backup do banco de dados
docker exec kanban_postgres pg_dump -U kanban_user kanban_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i kanban_postgres psql -U kanban_user kanban_db < backup.sql
```

---

### Deploy em Produção (Railway)

Este projeto está configurado para deploy no Railway. Para fazer o deploy:

1. **Pré-requisitos:**
   - Conta no [Railway](https://railway.app)
   - Repositório Git conectado

2. **Passos básicos:**
   - Conecte seu repositório GitHub ao Railway
   - Adicione um serviço PostgreSQL no Railway
   - Configure a variável `SESSION_SECRET` manualmente
   - O Railway configura automaticamente `DATABASE_URL`, `PORT` e `NODE_ENV`

3. **Documentação completa:**
   - Veja o guia completo de deploy em [RAILWAY_GUIDE.md](./RAILWAY_GUIDE.md)
   - Inclui troubleshooting, configuração de SSL, e verificação de migrações

---

### Ambientes Suportados

#### Desenvolvimento
- Hot-reload para desenvolvimento (frontend e backend)
- Ambiente Docker com PostgreSQL e volumes persistentes
- Variáveis de ambiente específicas para desenvolvimento
- Monitoramento de mudanças de código
- Depuração ativada

#### Testes
- Execução de testes automatizados em ambiente isolado
- Banco de dados de teste em memória (se aplicável)
- Cobertura de código configurada
- Relatórios de testes em formato JUnit

#### Produção
- Deploy no Railway com integração Git automática
- Backend e frontend unificados em um único serviço
- Banco de dados PostgreSQL gerenciado no Railway
- Integração contínua com testes automatizados
- Migrações automáticas de banco de dados no deploy
- SSL/TLS configurado automaticamente
- Monitoramento e logs em tempo real via Railway Dashboard

### Estratégia de Deploy

#### Railway (Produção)
- Integração direta com repositório Git (GitHub)
- Deploy automático em cada push para a branch principal
- Preview deployments para pull requests
- PostgreSQL gerenciado com backups automáticos
- Variáveis de ambiente seguras
- SSL/TLS automático
- Logs e monitoramento integrados
- Escalabilidade automática

**Configuração necessária:**
1. Adicionar serviço PostgreSQL no Railway
2. Configurar variável `SESSION_SECRET` manualmente
3. Deploy automático após push

Consulte o [RAILWAY_GUIDE.md](./RAILWAY_GUIDE.md) para instruções detalhadas.

### Processo de Release

#### 1. Pré-deploy
- **Testes automatizados**
  - Testes unitários (cobertura mínima: 80%)
  - Testes de integração
  - Testes de segurança
  - Testes de desempenho

- **Validação de código**
  - Análise de cobertura de código
  - Verificação de vulnerabilidades (npm audit)
  - Auditoria de dependências
  - Verificação de linting

#### 2. Deploy Staging
- Deploy automático para ambiente de staging
- Validação funcional manual
- Testes de ponta a ponta
- Verificação de métricas de performance
- Rollback automático em caso de falha

#### 3. Deploy Produção
- Aprovação manual para deploy em produção
- Deploy com estratégia blue-green ou canary
- Monitoramento em tempo real
- Verificação de health checks
- Notificação de sucesso/fracasso

### Configuração de Ambientes

#### Variáveis de Ambiente de Produção
- `NODE_ENV=production`
- `PORT=` (definida automaticamente pelo Railway)
- `DATABASE_URL=` (URL do banco PostgreSQL - automática no Railway)
- `SESSION_SECRET=` (⚠️ **Configuração manual obrigatória** - mínimo 32 caracteres)
- `FORCE_DB_SSL=true` (detectado automaticamente no Railway)

**Importante:** A única variável que precisa ser configurada manualmente no Railway é a `SESSION_SECRET`. Todas as outras são gerenciadas automaticamente pela plataforma.

Veja mais detalhes em [RAILWAY_GUIDE.md](./RAILWAY_GUIDE.md).

#### Configurações de Segurança em Produção
- HTTPS obrigatório com HSTS
- Configuração de CSP (Content Security Policy)
- Headers de segurança adequados
- Rate limiting configurado
- Auditoria ativa

## Contribuição

### Como Contribuir

1. **Fork do repositório**
   - Faça um fork do repositório original para sua conta
   - Clone o fork para sua máquina local

2. **Criar uma branch para sua feature**
   ```bash
   git checkout -b feature/nova-funcionalidade
   # ou
   git checkout -b bugfix/nome-do-bug
   ```

3. **Fazer commits semânticos**
   - Utilize commits semânticos seguindo a convenção:
     - `feat:` para novas funcionalidades
     - `fix:` para correções de bugs
     - `docs:` para documentação
     - `style:` para mudanças de formatação
     - `refactor:` para refatorações
     - `test:` para testes
     - `chore:` para tarefas de build ou auxiliares

4. **Commit suas mudanças**
   ```bash
   git commit -m 'feat: adiciona nova funcionalidade de notificação'
   ```

5. **Push para a branch**
   ```bash
   git push origin feature/nova-funcionalidade
   ```

6. **Abrir um Pull Request**
   - Descreva claramente as mudanças realizadas
   - Inclua capturas de tela se aplicável
   - Referencie issues relacionados

### Guidelines de Contribuição

#### Código
- **Siga os padrões de codificação do projeto**
  - TypeScript com tipagem rigorosa
  - Componentes React bem estruturados
  - Código limpo e bem documentado
  - Evite duplicação de código

- **Escreva testes para novas funcionalidades**
  - Testes unitários para funções e componentes
  - Testes de integração para fluxos completos
  - Cobertura mínima de 80%

- **Atualize a documentação conforme necessário**
  - Atualize README se necessário
  - Adicione documentação de novas APIs
  - Atualize exemplos de uso

- **Certifique-se de que todos os testes passem**
  - Execute `npm test` antes de fazer commit
  - Verifique o linting com `npm run lint`
  - Formate o código com `npm run format`

#### Processo de Revisão
- Todos os PRs passam por revisão de código
- Feedback construtivo é incentivado
- Mudanças solicitadas devem ser implementadas
- PRs devem ser pequenos e focados

#### Boas Práticas
- Comentários claros e explicativos quando necessário
- Nomenclatura autoexplicativa para variáveis e funções
- Separação de concerns (SRP)
- Uso de hooks personalizados para lógica compartilhada
- Tratamento adequado de erros e edge cases

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

A licença MIT permite:

- **Uso comercial**: Você pode usar o software para fins comerciais
- **Modificação**: Você pode modificar o software
- **Distribuição**: Você pode distribuir o software
- **Uso privado**: Você pode usar o software em particular

Sob a condição de:

- **Aviso de licença**: A cópia do aviso de licença e isenção de responsabilidade deve ser incluída em todas as cópias ou partes substanciais do Software.

O SOFTWARE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU IMPLÍCITA, INCLUINDO MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM DETERMINADO FIM E NÃO INFRACÇÃO.
