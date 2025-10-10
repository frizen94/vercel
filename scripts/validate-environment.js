#!/usr/bin/env node
/**
 * Script de Validação de Ambiente para Railway
 * Verifica se todas as variáveis de ambiente necessárias estão configuradas
 */

// Cores para output sem dependência externa
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

function validateEnvironment() {
  console.log(colors.blue('🔍 Validando configuração de ambiente...\n'));

  const isProduction = process.env.NODE_ENV === 'production';
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
  
  let errorCount = 0;
  let warnings = 0;

  // Função para validar variável obrigatória
  function checkRequired(varName, description, value) {
    if (!value) {
      console.log(colors.red(`❌ ${varName}: ${description} - OBRIGATÓRIA`));
      errorCount++;
    } else {
      console.log(colors.green(`✅ ${varName}: Configurada`));
    }
  }

  // Função para validar variável opcional
  function checkOptional(varName, description, value, recommendation) {
    if (!value) {
      console.log(colors.yellow(`⚠️  ${varName}: ${description} - OPCIONAL`));
      if (recommendation) {
        console.log(colors.gray(`   💡 ${recommendation}`));
      }
      warnings++;
    } else {
      console.log(colors.green(`✅ ${varName}: Configurada`));
    }
  }

  console.log(colors.bold('🔐 VARIÁVEIS OBRIGATÓRIAS:'));
  
  // Validar DATABASE_URL
  checkRequired(
    'DATABASE_URL',
    'String de conexão PostgreSQL',
    process.env.DATABASE_URL
  );

  // Validar SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    console.log(colors.red(`❌ SESSION_SECRET: Chave secreta para sessões - OBRIGATÓRIA`));
    errorCount++;
  } else if (sessionSecret.length < 32) {
    console.log(colors.red(`❌ SESSION_SECRET: Muito curta (${sessionSecret.length} chars). Mínimo: 32 caracteres`));
    errorCount++;
  } else if (sessionSecret === 'kanban-board-secret-key') {
    console.log(colors.red(`❌ SESSION_SECRET: Usando valor padrão inseguro!`));
    errorCount++;
  } else {
    console.log(colors.green(`✅ SESSION_SECRET: Configurada (${sessionSecret.length} caracteres)`));
  }

  console.log(colors.bold('\n⚙️  VARIÁVEIS DE SISTEMA:'));

  // Validar NODE_ENV
  checkOptional(
    'NODE_ENV',
    'Ambiente de execução',
    process.env.NODE_ENV,
    'Recomendado: "production" para Railway'
  );

  // Validar PORT
  checkOptional(
    'PORT',
    'Porta do servidor',
    process.env.PORT,
    'Railway define automaticamente'
  );

  console.log(colors.bold('\n🚀 VARIÁVEIS DO RAILWAY:'));

  // Verificar detecção do Railway
  if (isRailway) {
    console.log(colors.green('✅ RAILWAY_ENVIRONMENT: Railway detectado'));
    checkOptional('RAILWAY_PROJECT_ID', 'ID do projeto Railway', process.env.RAILWAY_PROJECT_ID);
    checkOptional('RAILWAY_SERVICE_ID', 'ID do serviço Railway', process.env.RAILWAY_SERVICE_ID);
  } else {
    console.log(colors.yellow('⚠️  RAILWAY: Ambiente Railway não detectado'));
    console.log(colors.gray('   💡 Normal em desenvolvimento local'));
  }

  console.log(colors.bold('\n🔒 CONFIGURAÇÕES DE SEGURANÇA:'));

  // SSL do banco
  const forceSSL = process.env.FORCE_DB_SSL === 'true' || isProduction || isRailway;
  if (forceSSL) {
    console.log(colors.green('✅ SSL do Banco: Habilitado (produção/Railway)'));
  } else {
    console.log(colors.yellow('⚠️  SSL do Banco: Desabilitado (desenvolvimento)'));
  }

  // Configurações de sessão
  if (isProduction) {
    console.log(colors.green('✅ Cookies Seguros: Habilitado (produção)'));
  } else {
    console.log(colors.yellow('⚠️  Cookies Seguros: Desabilitado (desenvolvimento)'));
  }

  console.log(colors.bold('\n📊 RESUMO DA VALIDAÇÃO:'));

  if (errorCount > 0) {
    console.log(colors.red(`❌ ${errorCount} erro(s) encontrado(s)`));
    console.log(colors.red('🚫 Deploy será BLOQUEADO até resolver os erros'));
    console.log(colors.gray('\n💡 Para resolver:'));
    console.log(colors.gray('   1. Acesse o painel do Railway'));
    console.log(colors.gray('   2. Vá em Variables'));
    console.log(colors.gray('   3. Configure as variáveis marcadas como ❌'));
    process.exit(1);
  } else {
    console.log(colors.green(`✅ Ambiente configurado corretamente!`));
    if (warnings > 0) {
      console.log(colors.yellow(`⚠️  ${warnings} aviso(s) - funcional mas pode ser otimizado`));
    }
    console.log(colors.green('🚀 Pronto para deploy no Railway!'));
  }

  console.log(colors.bold('\n🔧 EXEMPLO DE CONFIGURAÇÃO:'));
  console.log(colors.gray('SESSION_SECRET=sua-chave-secreta-de-32-caracteres-ou-mais'));
  console.log(colors.gray('NODE_ENV=production'));
  console.log(colors.gray('# DATABASE_URL será definida automaticamente pelo PostgreSQL add-on'));
}

// Executar validação
try {
  validateEnvironment();
} catch (error) {
  console.log(colors.red('❌ Erro durante validação:'), error.message);
  process.exit(1);
}