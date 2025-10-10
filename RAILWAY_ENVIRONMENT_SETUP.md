# ✅ VARIÁVEIS DE AMBIENTE PARA RAILWAY

## 📋 **CHECKLIST COMPLETO - RAILWAY DEPLOY**

### **🔐 VARIÁVEIS OBRIGATÓRIAS**

#### **1. Banco de Dados PostgreSQL**
```bash
# ✅ Automática no Railway (PostgreSQL Add-on)
DATABASE_URL=postgresql://postgres:password@hostname:port/database
```

#### **2. Configuração de Sessão**
```bash
# ⚠️  DEVE SER CONFIGURADA MANUALMENTE
SESSION_SECRET=sua-chave-secreta-super-forte-minimo-32-caracteres
```

#### **3. Ambiente de Produção**
```bash
# ✅ Automática no Railway
NODE_ENV=production
```

#### **4. Porta do Servidor**
```bash
# ✅ Automática no Railway
PORT=8080
```

### **🔧 VARIÁVEIS OPCIONAIS (Configuração Avançada)**

#### **5. SSL do Banco**
```bash
# ✅ Automática (detecta Railway automaticamente)
FORCE_DB_SSL=true
```

#### **6. Configurações Railway (Automáticas)**
```bash
# ✅ Definidas automaticamente pelo Railway
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=xxx
RAILWAY_SERVICE_ID=xxx
RAILWAY_DEPLOYMENT_ID=xxx
```

---

## **🚀 CONFIGURAÇÃO NO RAILWAY**

### **Passo 1: Variáveis que DEVEM ser configuradas manualmente**

```bash
# No painel Railway > Variables:
SESSION_SECRET=gere-uma-chave-aleatoria-de-32-caracteres-ou-mais
```

### **Passo 2: Variáveis automáticas (Railway configura)**

✅ **DATABASE_URL** - Criada automaticamente quando adicionar PostgreSQL  
✅ **PORT** - Railway define automaticamente (8080 ou similar)  
✅ **NODE_ENV** - Será "production" no deploy  
✅ **RAILWAY_*** - Variáveis internas do Railway  

---

## **🔍 VERIFICAÇÃO DE FUNCIONALIDADES**

### **Dashboard funcionará se:**
- ✅ `DATABASE_URL` conectando com PostgreSQL
- ✅ `SESSION_SECRET` configurada (para autenticação)
- ✅ `NODE_ENV=production` (para configurações de produção)

### **Arquivamento funcionará se:**
- ✅ Banco PostgreSQL com colunas `archived` e `updated_at`
- ✅ Migrações executadas automaticamente no primeiro deploy
- ✅ APIs de arquivamento (`/api/boards/*/archive`) funcionando

---

## **⚡ COMANDOS DE DEPLOY**

### **Build Command (Automático):**
```bash
npm install && npm run build
```

### **Start Command (Definido no railway.json):**
```bash
npm start
```

### **Processo de Deploy:**
1. Railway executa `npm install`
2. Railway executa `npm run build`
3. Railway executa `npm start`
4. Aplicação inicia e executa migrações automáticas
5. Dashboard e arquivamento ficam disponíveis

---

## **🛡️ SEGURANÇA CONFIGURADA**

✅ **CSRF Protection** - Configurado para produção  
✅ **Session Security** - Cookies seguros em HTTPS  
✅ **SSL/TLS** - Forçado em produção  
✅ **Audit Logs** - Funcionando em produção  

---

## **📊 MONITORAMENTO**

### **Health Check Endpoint:**
```
GET /api/health
```

### **Logs de Aplicação:**
```bash
railway logs
```

### **Status do Banco:**
```bash
railway connect
\l  # Lista databases
\d  # Lista tabelas
```

---

## **🔧 TROUBLESHOOTING**

### **Se o dashboard não carregar:**
1. Verificar `SESSION_SECRET` configurada
2. Verificar `DATABASE_URL` conectando
3. Verificar logs: `railway logs`

### **Se arquivamento não funcionar:**
1. Verificar se migrações executaram
2. Verificar coluna `archived` existe: `\d boards`
3. Verificar endpoint: `/api/boards/archived`

### **Comandos de diagnóstico:**
```bash
# Conectar no banco Railway
railway connect

# Ver estrutura da tabela boards
\d boards

# Verificar se colunas existem
SELECT column_name FROM information_schema.columns WHERE table_name = 'boards';
```

---

## **✅ RESUMO - READY TO DEPLOY**

**Única ação manual necessária:**
```bash
# No Railway > Variables
SESSION_SECRET=cole-aqui-uma-chave-de-32-caracteres-ou-mais
```

**Exemplo de SESSION_SECRET segura:**
```bash
SESSION_SECRET=minha-super-chave-secreta-kanban-2024-railway-deploy-123456789abc
```

**Tudo mais é automático! 🚀**