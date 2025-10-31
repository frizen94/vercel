# Documento de Requisitos do Produto (PRD): Melhorias nos Dashboards e Mini-Dashboards de Portfólios

## Informações do Documento
- **Versão:** 1.0
- **Data:** 31 de outubro de 2025
- **Autor:** GitHub Copilot
- **Status:** Rascunho
- **Projeto:** Aplicação de Quadro Kanban

## Resumo Executivo

Este PRD descreve os requisitos para aprimorar o dashboard de administrador e implementar mini-dashboards para portfólios na aplicação de quadro Kanban. As melhorias focam em melhorar o rastreamento de produtividade, lógica de conclusão de tarefas baseada em checklists/subtarefas e fornecer insights acionáveis para gestores de portfólio e administradores do sistema.

## Objetivos de Negócio

1. **Melhorar a Visibilidade da Produtividade:** Fornecer métricas abrangentes para taxas de conclusão de tarefas, tempos de resolução e distribuição de carga de trabalho.
2. **Aprimorar a Gestão de Portfólio:** Permitir que gestores de portfólio monitorem o progresso do projeto com mini-dashboards dedicados.
3. **Reforçar a Supervisão do Admin:** Dar aos administradores melhores ferramentas para monitoramento em todo o sistema e gerenciamento de usuários.
4. **Implementar Lógica de Conclusão Precisa:** Basear a conclusão de tarefas na conclusão de checklists e subtarefas em vez de marcação manual.

## Análise do Estado Atual

### Funcionalidades Existentes
- **Dashboard Admin:** Estatísticas básicas (quadros, usuários, taxas de conclusão), gráficos (radial, pizza, barras), abas para visão geral/atrasados/usuários
- **Dashboard do Usuário:** Estatísticas pessoais, barras de progresso, listas de quadros, tarefas atrasadas, rastreamento de progresso de checklists
- **Sistema de Tarefas:** Cartões com checklists e subtarefas (checklistItems com parentItemId), rastreamento de conclusão

### Pontos de Dor
- Conclusão de tarefas não calculada automaticamente a partir do progresso do checklist
- Métricas de produtividade limitadas (sem rastreamento de tempo de resolução)
- Sem dashboards específicos de portfólio
- Dashboard admin carece de análises detalhadas de usuário/produtividade

## Requisitos

### 1. Aprimoramento da Lógica de Conclusão de Tarefas

#### Descrição
Implementar conclusão automática de tarefas baseada no status de checklists e subtarefas.

#### Critérios de Aceitação
- Um cartão é marcado como "concluído" quando todos os seus checklistItems (incluindo subtarefas) estão concluídos
- Timestamp de conclusão é registrado quando o último item do checklist é marcado como completo
- UI reflete status de conclusão em tempo real
- Toggle manual "concluído" é descontinuado em favor do cálculo automático

#### Requisitos Técnicos
- Atualizar lógica de conclusão de cartão na API backend
- Modificar frontend para mostrar conclusão baseada no progresso do checklist
- Adicionar rastreamento de timestamp de conclusão

### 2. Rastreamento de Tempo Médio de Resolução

#### Descrição
Calcular e exibir tempo médio da criação da tarefa até a conclusão.

#### Critérios de Aceitação
- Tempo de resolução = timestamp de conclusão - card.createdAt
- Exibir em dashboards como "Tempo Médio de Resolução: X dias"
- Filtrável por portfólio, usuário, intervalo de datas
- Lidar adequadamente com tarefas incompletas (excluir das médias)

#### Requisitos Técnicos
- Adicionar campo completion_timestamp à tabela cards
- Criar endpoint de API para cálculos de tempo de resolução
- Implementar cálculos de diferença de datas com tratamento adequado de fuso horário

### 3. Mini-Dashboards de Portfólio

#### Descrição
Criar dashboards dedicados para cada portfólio mostrando tarefas, progresso e métricas.

#### Funcionalidades
- **Tabelas de Projetos (Cards):** Três seções em formato de datatable
  - Projetos a Fazer: Projetos pendentes com responsável e data de vencimento
  - Projetos Concluídos: Projetos concluídos com data de conclusão
  - Projetos Atrasados: Projetos com `due_date` passado e não concluídos

- **Tabela de Tarefas Atrasadas (Checklist Items):** Seção separada
  - Lista de subtarefas (checklist items) com `due_date` passado e não concluídas
  - Mostra: nome da tarefa, projeto pai, responsável, data de vencimento
  - **Independente do status do projeto:** uma tarefa pode estar atrasada mesmo que o projeto esteja no prazo

- **Métricas de Portfólio:**
  - Contagens totais de projetos, concluídos, atrasados
  - Contagem de tarefas (checklist items) atrasadas
  - Tempo médio de resolução para o portfólio
  - Porcentagem de taxa de conclusão
  - Tendências semanais/mensais de conclusão

- **Elementos Interativos:**
  - Linhas de tarefas clicáveis vinculando a projetos específicos
  - Filtragem por responsável, data de vencimento, prioridade
  - Funcionalidade de exportação (CSV/PDF)

#### Critérios de Aceitação
- Dados filtrados por portfolio_id
- Atualizações em tempo real quando tarefas mudam
- Design responsivo para mobile/desktop
- Performance otimizada para portfólios grandes

### 4. Dashboard Admin Aprimorado

#### Descrição
Expandir dashboard admin com métricas avançadas de produtividade e sistema.

#### Novas Funcionalidades
- **Tabela de Produtividade do Usuário:**
  - Colunas: Usuário, Tarefas Atribuídas, Tarefas Concluídas, Tarefas Atrasadas, Tempo Médio de Resolução
  - Ordenável e filtrável
  - Indicadores de performance codificados por cores

- **Visão Geral de Portfólio:**
  - Cartões de resumo para cada portfólio
  - Taxas de conclusão, contagens atrasadas, tempos de resolução
  - Drill-down para mini-dashboards de portfólio

- **Métricas do Sistema:**
  - Resumo de logs de atividade diários/semanais
  - Métricas de performance da API
  - Estatísticas de engajamento do usuário

- **Integração de Logs de Auditoria:**
  - Feed de atividades recentes
  - Trilha de auditoria pesquisável
  - Alertas automatizados para atividades suspeitas

#### Critérios de Aceitação
- Todas as métricas atualizam em tempo real ou quase tempo real
- Acesso apenas para admin com verificação adequada de função
- Capacidades de exportação de dados
- Monitoramento de performance para tempos de carregamento do dashboard

### 5. Dashboard de Usuário Aprimorado

#### Descrição
Adicionar insights de produtividade aos dashboards de usuários regulares.

#### Novas Funcionalidades
- **Métricas de Produtividade Pessoal:**
  - Tempo médio de resolução para tarefas do usuário
  - Estatísticas mensais de conclusão
  - Comparação com médias da equipe

- **Distribuição de Carga de Trabalho:**
  - Tarefas por prioridade/status
  - Visualização de calendário de prazos próximos
  - Tarefas atrasadas com botões de ação rápida

#### Critérios de Aceitação
- Personalizado para o usuário logado
- Consistente com padrões de design existentes
- Responsivo para mobile

## Histórias de Usuário

### Gestor de Portfólio
- Como gestor de portfólio, quero ver todos os projetos do meu portfólio de relance para priorizar o trabalho
- Como gestor de portfólio, quero ver tarefas atrasadas separadamente de projetos atrasados para gerenciar adequadamente
- Como gestor de portfólio, quero saber o tempo médio para concluir projetos no meu portfólio para definir prazos realistas
- Como gestor de portfólio, quero identificar projetos e tarefas atrasados rapidamente para reatribuir ou acompanhar

### Administrador do Sistema
- Como admin, quero ver métricas de produtividade de todos os usuários para identificar alto/baixo desempenho
- Como admin, quero monitorar tendências de conclusão de tarefas em todo o sistema para otimizar processos
- Como admin, quero acessar logs de auditoria facilmente para investigar problemas

### Usuário Regular
- Como usuário, quero ver minhas métricas pessoais de produtividade para melhorar meu desempenho
- Como usuário, quero entender como me comparo às médias da equipe para me benchmarkar
- Como usuário, quero acesso rápido às minhas tarefas atrasadas para abordá-las imediatamente

## Especificações Técnicas

### Mudanças no Banco de Dados
- Adicionar campo `completion_timestamp` à tabela `cards`
- Garantir indexação adequada para consultas baseadas em portfólio
- Adicionar views/materialized views para agregações complexas
- Criar migration SQL para Railway PostgreSQL

#### Arquivos de Migração para Railway
**1. Criar Migration SQL:**
```sql
-- Migration: 20251031_add_completion_timestamp_to_cards.sql
-- Adiciona campo completion_timestamp para rastreamento automático de conclusão

ALTER TABLE cards ADD COLUMN completion_timestamp TIMESTAMP;

-- Criar índice para performance em consultas de portfólio
CREATE INDEX idx_cards_portfolio_id ON cards USING HASH (
  (SELECT portfolio_id FROM boards WHERE boards.id = cards.list_id)
);

-- Criar view para métricas de portfólio
CREATE VIEW portfolio_metrics AS
SELECT 
  p.id as portfolio_id,
  p.name as portfolio_name,
  COUNT(c.id) as total_tasks,
  COUNT(CASE WHEN c.completed THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN c.due_date < NOW() AND NOT c.completed THEN 1 END) as overdue_tasks,
  AVG(EXTRACT(EPOCH FROM (c.completion_timestamp - c.created_at))/86400) as avg_resolution_days
FROM portfolios p
LEFT JOIN boards b ON b.portfolio_id = p.id
LEFT JOIN lists l ON l.board_id = b.id
LEFT JOIN cards c ON c.list_id = l.id
GROUP BY p.id, p.name;
```

**2. Atualizar init.sql:**
Adicionar o campo `completion_timestamp` à criação da tabela `cards`:
```sql
-- Adicionar à seção de criação da tabela cards
CREATE TABLE cards (
  -- ... campos existentes ...
  completion_timestamp TIMESTAMP,
  -- ... campos restantes ...
);
```

**3. Atualizar schema-setup.ts:**
```typescript
// Adicionar ao schema da tabela cards
export const cards = pgTable("cards", {
  // ... campos existentes ...
  completionTimestamp: timestamp("completion_timestamp"),
  // ... campos restantes ...
});

// Adicionar view para métricas
export const portfolioMetrics = pgView("portfolio_metrics", {
  portfolioId: integer("portfolio_id").references(() => portfolios.id),
  portfolioName: varchar("portfolio_name", { length: 255 }),
  totalTasks: integer("total_tasks"),
  completedTasks: integer("completed_tasks"),
  overdueTasks: integer("overdue_tasks"),
  avgResolutionDays: decimal("avg_resolution_days"),
}).as(sql`
  SELECT 
    p.id as portfolio_id,
    p.name as portfolio_name,
    COUNT(c.id) as total_tasks,
    COUNT(CASE WHEN c.completed THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN c.due_date < NOW() AND NOT c.completed THEN 1 END) as overdue_tasks,
    AVG(EXTRACT(EPOCH FROM (c.completion_timestamp - c.created_at))/86400) as avg_resolution_days
  FROM portfolios p
  LEFT JOIN boards b ON b.portfolio_id = p.id
  LEFT JOIN lists l ON l.board_id = b.id
  LEFT JOIN cards c ON c.list_id = l.id
  GROUP BY p.id, p.name
`);
```

#### Considerações de Deploy no Railway
- **Migration Order:** Executar migration SQL antes do deploy da aplicação
- **Backup:** Fazer backup completo do banco antes de aplicar mudanças
- **Testing:** Testar migration em ambiente staging antes de produção
- **Rollback:** Preparar script de rollback caso necessário
- **Performance:** Monitorar queries após deploy para ajustar índices se necessário

### Endpoints de API
- `GET /api/portfolios/{id}/tasks` - Dados de projetos (cards) do portfólio categorizados
- `GET /api/portfolios/{id}/overdue-checklist-items` - Tarefas (checklist items) atrasadas do portfólio
- `GET /api/dashboard/resolution-times` - Cálculos de tempo médio de resolução
- `GET /api/admin/productivity-metrics` - Dados de produtividade do usuário
- `GET /api/audit/summary` - Resumo de logs de auditoria

### Componentes Frontend
- `PortfolioMiniDashboard` - Componente reutilizável para visualizações de portfólio
- `ProductivityMetrics` - Componente para exibir métricas baseadas em tempo
- `EnhancedDataTable` - Tabela avançada com ordenação, filtragem, exportação

### Requisitos de Performance
- Tempo de carregamento do dashboard < 2 segundos
- Atualizações em tempo real com WebSocket ou polling (< 30s intervalos)
- Suporte para portfólios com 1000+ tarefas
- Renderização otimizada para mobile

## Dependências

### Bibliotecas Externas
- Chart.js ou Recharts para visualizações avançadas
- date-fns para cálculos de datas
- react-table para datatables aprimorados

### Dependências Internas
- Sistema existente de autenticação e autorização
- Endpoints atuais de dashboard da API
- Funcionalidade de checklists e subtarefas

## Avaliação de Riscos

### Alto Risco
- Impacto de performance em portfólios grandes
- Precisão de dados para timestamps de conclusão
- Consultas complexas para cálculos de tempo de resolução

### Estratégias de Mitigação
- Implementar paginação e carregamento lazy
- Adicionar validação de dados e scripts de migração
- Otimizar consultas de banco de dados com indexação adequada
- Implementar cache para métricas acessadas frequentemente

## Métricas de Sucesso

1. **Adoção do Usuário:** 80% dos gestores de portfólio usam mini-dashboards semanalmente
2. **Performance:** Tempos de carregamento do dashboard permanecem abaixo de 2 segundos
3. **Precisão de Dados:** < 1% de discrepância no rastreamento de conclusão
4. **Satisfação do Usuário:** > 4.5/5 de classificação em pesquisas de feedback do usuário

## Cronograma de Implementação

### Fase 1: Fundação (Semana 1-2)
- Implementar lógica de conclusão de tarefas
- Adicionar rastreamento de timestamp de conclusão
- Criar API básica de tarefas do portfólio

### Fase 2: Mini-Dashboards (Semana 3-4)
- Construir componentes de mini-dashboard de portfólio
- Implementar funcionalidade de datatable
- Adicionar métricas básicas (contagens, taxas)

### Fase 3: Métricas Aprimoradas (Semana 5-6)
- Adicionar cálculos de tempo de resolução
- Implementar análises de produtividade
- Criar gráficos e visualizações avançados

### Fase 4: Aprimoramentos Admin (Semana 7-8)
- Expandir dashboard admin com métricas de usuário
- Integrar logs de auditoria
- Adicionar recursos de monitoramento do sistema

### Fase 5: Testes e Polimento (Semana 9-10)
- Otimização de performance
- Testes de aceitação do usuário
- Documentação e materiais de treinamento

## Estratégia de Testes

### Testes Unitários
- Lógica de conclusão de tarefas
- Cálculos de tempo de resolução
- Respostas de endpoints de API

### Testes de Integração
- Workflows de dashboard de ponta a ponta
- Consistência de dados entre componentes
- Performance sob carga

### Testes de Aceitação do Usuário
- Workflows de gestor de portfólio
- Cenários de monitoramento admin
- Responsividade mobile

## Plano de Lançamento

1. **Lançamento Beta:** Implantar para 20% dos usuários para feedback
2. **Lançamento Gradual:** Aumentar gradualmente o acesso do usuário
3. **Lançamento Completo:** Implantação completa com monitoramento
4. **Pós-Lançamento:** Monitorar métricas e coletar feedback para iterações

## Suporte e Manutenção

### Documentação
- Guias do usuário para novos recursos de dashboard
- Materiais de treinamento admin
- Documentação de API para integrações personalizadas

### Monitoramento
- Métricas de performance do dashboard
- Rastreamento de erros e alertas
- Análises de engajamento do usuário

### Aprimoramentos Futuros
- Insights e recomendações alimentados por IA
- Relatórios e análises avançados
- Integração com ferramentas externas de gerenciamento de projetos

---

*Este PRD é um documento vivo e será atualizado com base no feedback de implementação e requisitos em mudança.*