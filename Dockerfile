# Dockerfile para desenvolvimento local
FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache git

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./
COPY theme.json ./

# Instalar dependências apenas
RUN npm install

# Copiar código fonte
COPY . .

# Fazer build da aplicação
RUN npm run build

# Criar diretório para uploads
RUN mkdir -p public/uploads/profile_pictures

# Expor porta
EXPOSE 5000

# Comando para produção
CMD ["npm", "start"]