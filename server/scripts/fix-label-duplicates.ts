#!/usr/bin/env tsx
/**
 * Script para executar a limpeza de duplicatas de etiquetas
 * 
 * Execute com: npm run fix-label-duplicates
 * ou: tsx server/scripts/fix-label-duplicates.ts
 */

async function main() {
  console.log('🚀 Iniciando script de limpeza de duplicatas de etiquetas...');
  
  try {
    // Import dinâmico para evitar problemas de dependências
    const { LabelDuplicatesCleaner } = await import('../utils/label-duplicates-cleaner');
    
    // 1. Verificar duplicatas existentes
    console.log('\n📊 Verificando duplicatas existentes...');
    const duplicates = await LabelDuplicatesCleaner.checkForDuplicates();
    
    if (duplicates.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada! Sistema está limpo.');
      return;
    }
    
    console.log(`⚠️ Encontradas ${duplicates.length} duplicatas:`);
    duplicates.forEach(dup => {
      console.log(`   - Cartão ${dup.cardId} + Etiqueta ${dup.labelId}: ${dup.count} associações`);
    });
    
    // 2. Executar limpeza
    console.log('\n🧹 Executando limpeza...');
    const result = await LabelDuplicatesCleaner.removeDuplicates();
    
    console.log('\n✅ Limpeza concluída!');
    console.log(`   📉 Duplicatas removidas: ${result.removed}`);
    console.log(`   📈 Associações restantes: ${result.total}`);
    
    // 3. Verificar novamente
    console.log('\n🔍 Verificação final...');
    const remainingDuplicates = await LabelDuplicatesCleaner.checkForDuplicates();
    
    if (remainingDuplicates.length === 0) {
      console.log('🎉 Sucesso! Todas as duplicatas foram removidas.');
    } else {
      console.log(`⚠️ Ainda existem ${remainingDuplicates.length} duplicatas. Verifique manualmente.`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}