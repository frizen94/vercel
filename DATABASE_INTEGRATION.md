# 🗄️ Integração de Banco de Dados - Guia Completo

## 🎯 Visão Geral

Seu projeto já está **100% configurado** para trabalhar com PostgreSQL usando Drizzle ORM. Aqui está como integrar:

## 🚀 **Passo 1: Configurar PostgreSQL no Railway**

### 1.1 Adicionar Banco de Dados
1. **Acesse seu projeto** no Railway Dashboard
2. **Clique em "+ New"**
3. **Selecione "Database" → "PostgreSQL"**
4. ✅ **Aguarde 30-60 segundos** para provisionar

### 1.2 Verificar Variável Criada
- 🔍 **Vá em "Variables"**
- ✅ **Confirme que `DATABASE_URL` apareceu automaticamente**
- 📝 **Formato**: `postgresql://postgres:password@host:port/database`

## 🔧 **Passo 2: Configurar Variáveis de Ambiente**

### Adicionar no Railway (Variables):
```env
# ✅ Criada automaticamente pelo Railway
DATABASE_URL=postgresql://postgres:xxxxx@host:port/railway

# 🔑 Você precisa adicionar manualmente
SESSION_SECRET=minha-chave-secreta-super-forte-aqui-123456789

# 🎯 Ambiente de produção
NODE_ENV=production
```

## 📊 **Passo 3: Schema e Migrações**

### 3.1 Schema já Configurado
O projeto usa [`shared/schema.ts`](../shared/schema.ts) com as tabelas:

- ✅ **users** - Usuários e autenticação
- ✅ **boards** - Quadros Kanban
- ✅ **lists** - Listas dentro dos quadros
- ✅ **cards** - Cartões das listas
- ✅ **labels** - Etiquetas para cartões
- ✅ **comments** - Comentários dos cartões
- ✅ **checklists** - Checklists dos cartões
- ✅ **checklist_items** - Itens dos checklists
- ✅ **board_members** - Membros dos quadros
- ✅ **card_members** - Membros dos cartões

### 3.2 Migrações Automáticas
- 🔄 **Auto-executa** quando a aplicação inicia
- 📝 **Logs visíveis** no Railway
- ✅ **Sem intervenção manual** necessária

## 👤 **Passo 4: Dados Iniciais (Seeder)**

### 4.1 Administrador Automático
Na primeira execução, o sistema cria automaticamente:

```
👤 Username: admin
🔑 Password: admin123
📧 Email: admin@kanban.local
🎯 Role: Administrador
```

### 4.2 Verificar Logs
No Railway, vá em **"Deployments" → "View Logs"** e procure por:

```
🌱 Executando seeder...
✅ Administrador criado com sucesso!
👤 Username: admin
🔑 Password: admin123
```

## 🔍 **Passo 5: Verificar Conexão**

### 5.1 Health Check
Acesse: `https://sua-app.railway.app/api/health`

**Resposta esperada:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-09T17:00:00.000Z",
  "uptime": 123.456
}
```

### 5.2 Se der erro:
- ❌ **"database": "disconnected"** → Verificar `DATABASE_URL`
- ❌ **500 error** → Verificar logs no Railway
- ❌ **Timeout** → Banco ainda está inicializando

## 📱 **Passo 6: Testar Login**

### 6.1 Acessar Aplicação
1. **Abra**: `https://sua-app.railway.app`
2. **Login com**: 
   - Username: `admin`
   - Password: `admin123`
3. ✅ **Deve aparecer o dashboard**

### 6.2 Funcionalidades Disponíveis
- 📊 **Dashboard** com estatísticas
- 📝 **Criar quadros** Kanban
- 👥 **Gerenciar usuários** (só admin)
- 🎯 **Arrastar e soltar** cartões
- 💬 **Comentários** e checklists

## 🛠️ **Comandos de Banco (Opcionais)**

### Se precisar executar migrações manualmente:
```bash
# No Railway Terminal ou localmente
npm run db:push
```

### Para reset completo (CUIDADO!):
```bash
# Conectar diretamente ao PostgreSQL no Railway
# Dashboard → Database → Connect → psql

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

## 🔧 **Configurações Avançadas**

### Conexão Local (Desenvolvimento):
```env
# .env.local
DATABASE_URL=postgresql://localhost:5432/kanban_dev
SESSION_SECRET=dev-secret-key
NODE_ENV=development
```

### Backup e Restauração:
- 💾 **Railway faz backup automático**
- 📤 **Export**: Dashboard → Database → Backup
- 📥 **Import**: Use psql ou cliente SQL

## 🆘 **Troubleshooting**

### Problema: "Database not connected"
```bash
# Verificar variáveis
echo $DATABASE_URL

# Deve começar com: postgresql://
```

### Problema: "Admin não criado"
```bash
# Verificar logs do seeder
# Railway → Deployments → View Logs
# Procurar por: "🌱 Executando seeder..."
```

### Problema: "Tabelas não existem"
```bash
# Verificar migração
# Logs devem mostrar: "🔄 Tentativa de conexão com o banco..."
```

## ✅ **Checklist Final**

- [ ] PostgreSQL adicionado no Railway
- [ ] `DATABASE_URL` visível nas Variables
- [ ] `SESSION_SECRET` configurado
- [ ] Deploy concluído sem erros
- [ ] Health check retorna "connected"
- [ ] Login admin funciona
- [ ] Dashboard carrega corretamente

## 🎉 **Resultado Final**

Após seguir estes passos, você terá:

- 🗄️ **PostgreSQL** funcionando perfeitamente
- 👤 **Sistema de usuários** completo
- 📊 **Dashboard** com estatísticas
- 🎯 **Quadros Kanban** totalmente funcionais
- 🔒 **Autenticação** segura
- 📱 **Interface responsiva**

**🚀 Tempo total: 10-15 minutos máximo!**