/**
 * Script para executar migrações faltantes no Railway
 * 
 * Este script executa todas as migrações SQL que podem estar faltando
 * no banco de dados do Railway, especialmente a tabela de notificações.
 */

const { runMissingSqlMigrations, runPortfolioMigrations } = require('./server/schema-setup.ts');

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migrações no Railway...');
    
    // Executar migrações de portfólio
    console.log('📁 Executando migrações de portfólio...');
    await runPortfolioMigrations();
    
    // Executar migrações SQL faltantes (incluindo notificações)
    console.log('🔔 Executando migrações de notificações e outras...');
    await runMissingSqlMigrations();
    
    console.log('✅ Todas as migrações foram executadas com sucesso!');
    console.log('🎯 Verifique no Railway se a tabela "notifications" foi criada.');
    
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  }
}

// Executar migrações
runMigrations();