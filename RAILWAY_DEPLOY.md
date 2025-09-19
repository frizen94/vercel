# Deploy no Railway - Solução para Problemas de Banco

## 🎯 Problema Atual
"Não estou conseguindo interagir com o banco de dados"

## 🔍 Diagnóstico
O problema é que o Railway precisa das variáveis de ambiente configuradas corretamente para conectar ao banco PostgreSQL.

## 🛠️ Solução Passo a Passo

### 1. Verificar se o PostgreSQL está ativo no Railway
1. Acesse seu projeto no Railway
2. Confirme que há um serviço PostgreSQL rodando
3. Se não houver, clique em "+ New" > "Database" > "PostgreSQL"

### 2. Configurar Variáveis de Ambiente
No Railway dashboard, na aba "Variables", configure:

```env
# Banco de dados (gerado automaticamente pelo Railway)
DATABASE_URL=postgresql://postgres:senha@host:5432/railway

# Sessão (OBRIGATÓRIO)
SESSION_SECRET=sua-chave-secreta-super-forte-aqui-123456789

# Ambiente
NODE_ENV=production

# SSL para produção
FORCE_DB_SSL=true
```

### 3. Como o Código Foi Atualizado
O arquivo `server/database.ts` foi modificado para:
- ✅ Detectar automaticamente variáveis do Railway
- ✅ Construir DATABASE_URL a partir de variáveis individuais se necessário
- ✅ Habilitar SSL automaticamente em produção/Railway
- ✅ Melhor tratamento de erros de conexão

### 4. Verificação no Railway
Após o deploy, nos logs você deve ver:
```
🔧 DATABASE_URL construída a partir de variáveis individuais
🔒 Database SSL habilitado via configuração (sslmode=require)
🔄 Tentativa de conexão com o banco... (1/10)
✅ Banco de dados conectado com sucesso!
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