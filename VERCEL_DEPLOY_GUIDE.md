# Deploy na Vercel - Guia de Configuração

Este projeto foi adaptado para deploy na Vercel. Siga os passos abaixo para configurar corretamente.

## ⚠️ Problema Atual

O projeto atual está mostrando código JavaScript bundled ao invés da interface porque:

1. **Arquitetura não compatível**: Este é um projeto fullstack (frontend + backend) que foi originalmente criado para Replit
2. **Vercel é principalmente para frontend**: A Vercel é otimizada para aplicações frontend e APIs serverless, não para servidores Express completos

## 🔄 Soluções Recomendadas

### Opção 1: Separar Frontend e Backend (RECOMENDADO)

1. **Frontend na Vercel**: Deploy apenas do cliente React
2. **Backend separado**: Deploy do servidor Express em:
   - Railway.app
   - Render.com
   - Heroku
   - DigitalOcean App Platform

### Opção 2: Refatorar para API Routes da Vercel

Converter todas as rotas Express para Vercel API Routes (muito trabalhoso).

### Opção 3: Usar Plataforma Fullstack

Deploy em plataformas que suportam fullstack:
- Railway.app
- Render.com
- Fly.io

## 🚀 Deploy Rápido (Opção 1)

### 1. Frontend na Vercel

```bash
# 1. Crie um novo projeto só para o frontend
mkdir kanban-frontend
cd kanban-frontend

# 2. Copie apenas a pasta client/
cp -r ../kanban-project/client/* .

# 3. Ajuste o package.json para apenas frontend
# 4. Configure as variáveis de ambiente apontando para a API
# 5. Deploy na Vercel
```

### 2. Backend no Railway

```bash
# 1. Mantenha o projeto atual
# 2. Remova as configurações do Vite/React
# 3. Configure para servir apenas API
# 4. Deploy no Railway.app
```

## 🔧 Configuração de Variáveis

Configure estas variáveis na Vercel (Project Settings > Environment Variables):

```env
# URL da API (quando backend estiver em outra plataforma)
VITE_API_URL=https://seu-backend.railway.app

# Outras configurações frontend
VITE_APP_NAME=Kanban Project
```

## 📝 Próximos Passos

1. **Decisão**: Escolha qual opção seguir
2. **Separação**: Se optar pela Opção 1, separe frontend e backend
3. **Deploy**: Deploy cada parte na plataforma apropriada
4. **Configuração**: Configure as URLs e variáveis de ambiente
5. **Teste**: Teste a aplicação completa

## 🆘 Problemas Comuns

### \"Vendo código JS ao invés da página\"
- Isso acontece quando a Vercel tenta servir o bundle do servidor
- Solução: Separar frontend e backend

### \"API não funciona\"
- Configure CORS no backend
- Ajuste URLs no frontend
- Verifique variáveis de ambiente

### \"Database não conecta\"
- Use banco compatível com serverless (Neon, PlanetScale)
- Configure connection pooling
- Ajuste timeouts

## 🔗 Links Úteis

- [Vercel Documentation](https://vercel.com/docs)
- [Railway.app](https://railway.app)
- [Neon Database](https://neon.tech)
- [Render.com](https://render.com)

---

**Recomendação**: Para maior simplicidade e funcionalidade completa, considere usar Railway.app que suporta fullstack nativamente.