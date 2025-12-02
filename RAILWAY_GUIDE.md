# Guia Completo de Deploy no Railway

## 📋 Índice
1. [Variáveis de Ambiente](#variáveis-de-ambiente)
2. [Configuração Inicial](#configuração-inicial)
3. [Migrações de Banco de Dados](#migrações-de-banco-de-dados)
4. [Troubleshooting](#troubleshooting)
5. [Monitoramento](#monitoramento)

---

## 🔐 Variáveis de Ambiente

### Variáveis Obrigatórias

#### 1. SESSION_SECRET (Configuração Manual Obrigatória)
```bash
# ⚠️ DEVE SER CONFIGURADA MANUALMENTE
SESSION_SECRET=sua-chave-secreta-super-forte-minimo-32-caracteres
```

#### 2. DATABASE_URL (Automática)
```bash
# ✅ Automática ao adicionar PostgreSQL Add-on
DATABASE_URL=postgresql://postgres:password@hostname:port/database
```

#### 3. NODE_ENV (Automática)
```bash
# ✅ Automática no Railway
NODE_ENV=production
```

#### 4. PORT (Automática)
```bash
# ✅ Automática no Railway
PORT=8080
```

### Variáveis Opcionais

#### SSL do Banco
```bash
# ✅ Automática (detecta Railway automaticamente)
FORCE_DB_SSL=true
```

---

## 🚀 Configuração Inicial

### Passo 1: Configurar Variáveis Manualmente

No painel Railway > Variables, adicione:
```bash
SESSION_SECRET=gere-uma-chave-aleatoria-de-32-caracteres-ou-mais
```

**Exemplo de SESSION_SECRET segura:**
```bash
SESSION_SECRET=minha-super-chave-secreta-nexustasks-2024-railway-deploy-123456789abc
```

### Passo 2: Adicionar PostgreSQL

1. No Railway Dashboard, clique em "New"
2. Selecione "Database" > "PostgreSQL"
3. A variável `DATABASE_URL` será criada automaticamente

### Passo 3: Deploy

```bash
git add .
git commit -m "feat: configurar para Railway"
git push origin main
```

O Railway detectará automaticamente e iniciará o deploy.

---

## 🗄️ Migrações de Banco de Dados

### Migrações Automáticas

As migrações são executadas automaticamente no primeiro deploy através do `server/schema-setup.ts`:

- ✅ Criar tabela `notifications`
- ✅ Adicionar colunas faltantes
- ✅ Criar índices de performance
- ✅ Executar todas as migrações SQL

### Verificar Migrações nos Logs

Após o deploy, procure nos logs:
```
🔄 Running missing SQL migrations...
✅ Missing SQL migrations completed successfully!
```

### Forçar Migrações Manualmente

Se necessário, execute no terminal do Railway:
```bash
npm run db:migrate
```

### Estrutura das Tabelas Principais

#### Tabela `notifications`
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  related_card_id INTEGER REFERENCES cards(id),
  related_checklist_item_id INTEGER REFERENCES checklist_items(id),
  from_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);
```

#### Tabela `checklist_item_members`
```sql
CREATE TABLE checklist_item_members (
  checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (checklist_item_id, user_id)
);
```

---

## 🔍 Troubleshooting

### Erro: "DATABASE_URL não está definido"
**Solução:**
- Verifique se o PostgreSQL foi adicionado no Railway
- Confirme se as variáveis estão na aba "Variables"

### Erro: "SSL required"
**Solução:**
- Defina `FORCE_DB_SSL=true` nas variáveis do Railway
- Geralmente detectado automaticamente

### Erro 400 nos endpoints
**Solução:**
- Geralmente relacionado a `SESSION_SECRET` não definido
- Certifique-se que está configurado com uma string forte (mínimo 32 caracteres)

### Dashboard não carrega
**Verificar:**
1. ✅ `SESSION_SECRET` configurada
2. ✅ `DATABASE_URL` conectando
3. ✅ Verificar logs: `railway logs`

### Arquivamento não funciona
**Verificar:**
1. ✅ Migrações executaram
2. ✅ Coluna `archived` existe: `\d boards`
3. ✅ Endpoint: `/api/boards/archived`

### Comandos de Diagnóstico

```bash
# Conectar no banco Railway
railway connect

# Ver estrutura da tabela boards
\d boards

# Verificar se colunas existem
SELECT column_name FROM information_schema.columns WHERE table_name = 'boards';

# Ver todas as tabelas
\dt
```

---

## 📊 Monitoramento

### Health Check Endpoint
```
GET /api/health
```

### Logs de Aplicação
```bash
railway logs
```

### Conectar ao Banco
```bash
railway connect
\l  # Lista databases
\d  # Lista tabelas
```

---

## 🛡️ Segurança

Configurações de segurança ativas em produção:

- ✅ **CSRF Protection** - Configurado para produção
- ✅ **Session Security** - Cookies seguros em HTTPS
- ✅ **SSL/TLS** - Forçado em produção
- ✅ **Audit Logs** - Funcionando em produção
- ✅ **XSS Protection** - Sanitização de entrada/saída
- ✅ **CSP** - Content Security Policy ativa

---

## ⚡ Comandos de Deploy

### Build Command (Automático)
```bash
npm install && npm run build
```

### Start Command (Definido no railway.json)
```bash
npm start
```

### Processo de Deploy
1. Railway executa `npm install`
2. Railway executa `npm run build`
3. Railway executa `npm start`
4. Aplicação inicia e executa migrações automáticas
5. Dashboard e todas as funcionalidades ficam disponíveis

---

## ✅ Checklist de Deploy

- [ ] PostgreSQL adicionado no Railway
- [ ] `SESSION_SECRET` configurada manualmente
- [ ] Código commitado e pushed
- [ ] Deploy iniciado automaticamente
- [ ] Logs verificados (sem erros)
- [ ] Migrações executadas com sucesso
- [ ] Health check respondendo: `/api/health`
- [ ] Login funcionando
- [ ] Dashboard acessível

**Tudo pronto! 🚀**
