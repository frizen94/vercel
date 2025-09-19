# Deploy no Railway - Solução para Problemas de Banco

## 🎯 Problema Atual
"Aqui no banco do railway faltou algumas migrations"

## 🔍 Diagnóstico
Algumas tabelas importantes estão faltando no banco do Railway, especialmente:
- ❌ **notifications** - Sistema de notificações
- ❌ Algumas colunas adicionais em tabelas existentes
- ❌ Índices de performance

## 🛠️ Solução Passo a Passo

### 1. Verificar Tabelas Existentes
No Railway dashboard, você pode ver que existem as tabelas básicas mas faltam:
- `notifications` (sistema de notificações)
- Algumas colunas adicionais

### 2. Executar Migrações Automáticas
As migrações serão executadas automaticamente quando o aplicativo iniciar, mas você pode forçar a execução:

```bash
# No Railway, acesse o terminal e execute:
npm run db:migrate

# Ou se precisar executar migrações específicas:
npm run db:migrate-missing
```

### 3. Como o Código Foi Atualizado
O arquivo `server/schema-setup.ts` foi modificado para:
- ✅ Criar automaticamente a tabela `notifications`
- ✅ Adicionar colunas faltantes em tabelas existentes
- ✅ Criar índices de performance
- ✅ Executar todas as migrações SQL automaticamente

### 4. Verificação no Railway
Após o deploy, verifique nos logs se aparecem:
```
🔄 Running missing SQL migrations...
✅ Missing SQL migrations completed successfully!
```

### 5. Tabelas que Serão Criadas
As seguintes tabelas/colunas serão adicionadas:

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
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Colunas Adicionais
- `comments.checklist_item_id` - Para comentários em itens de checklist
- `checklist_items.description` - Descrição dos itens
- `checklist_items.parent_item_id` - Para sub-tarefas

#### Tabela `checklist_item_members`
```sql
CREATE TABLE checklist_item_members (
  checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (checklist_item_id, user_id)
);
```

## 🚪 Próximos Passos

1. **Commit e Push**: Fazer commit das alterações
2. **Railway Deploy**: O Railway fará deploy automaticamente
3. **Testar**: Verificar se o banco funciona corretamente

## 🔍 Troubleshooting

### Erro: "DATABASE_URL não está definido"
- Verifique se o PostgreSQL foi adicionado no Railway
- Confirme se as variáveis estão na aba "Variables"

### Erro: "SSL required"
- Defina `FORCE_DB_SSL=true` nas variáveis do Railway

### Erro 400 nos endpoints
- Geralmente relacionado a `SESSION_SECRET` não definido
- Certifique-se que está configurado com uma string forte

## 🚀 Deploy Comando

Para fazer o deploy das alterações:

```bash
git add .
git commit -m "fix: melhorar configuração de banco para Railway"
git push origin main
```

O Railway detectará automaticamente as mudanças e fará o redeploy.