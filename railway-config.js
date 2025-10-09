// railway-config.js
// Configurações específicas para deploy no Railway

module.exports = {
  // Configurações de ambiente para Railway
  environment: {
    PORT: process.env.PORT || 8080,
    NODE_ENV: 'production',
    // Trust proxy é importante para Railway
    TRUST_PROXY: '1'
  },
  
  // Configurações de health check
  healthCheck: {
    path: '/api/health',
    timeout: 30000
  },
  
  // Configurações de sessão para Railway
  session: {
    secure: true,
    sameSite: 'none',
    domain: undefined // Deixar o Railway gerenciar
  }
};