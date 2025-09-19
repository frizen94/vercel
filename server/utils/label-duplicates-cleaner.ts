import { db } from '../database';
import * as schema from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Utilitário para remover duplicatas de etiquetas em cartões
 * e garantir integridade dos dados
 */
export class LabelDuplicatesCleaner {
  
  /**
   * Remove todas as duplicatas de etiquetas em cartões
   * Mantém apenas a primeira associação para cada par (cardId, labelId)
   */
  static async removeDuplicates(): Promise<{ removed: number; total: number }> {
    try {
      console.log('🔍 Iniciando limpeza de duplicatas de etiquetas...');
      
      // 1. Buscar todos os card_labels
      const allCardLabels = await db
        .select()
        .from(schema.cardLabels)
        .orderBy(schema.cardLabels.id);

      console.log(`📊 Total de associações encontradas: ${allCardLabels.length}`);

      // 2. Identificar duplicatas
      const seen = new Set<string>();
      const duplicates: number[] = [];

      for (const cardLabel of allCardLabels) {
        const key = `${cardLabel.cardId}-${cardLabel.labelId}`;
        
        if (seen.has(key)) {
          // É uma duplicata
          duplicates.push(cardLabel.id);
        } else {
          // Primeira ocorrência - manter
          seen.add(key);
        }
      }

      console.log(`🗑️ Duplicatas identificadas: ${duplicates.length}`);

      // 3. Remover duplicatas
      let removedCount = 0;
      for (const duplicateId of duplicates) {
        await db
          .delete(schema.cardLabels)
          .where(eq(schema.cardLabels.id, duplicateId));
        removedCount++;
      }

      console.log(`✅ Duplicatas removidas: ${removedCount}`);
      console.log(`📈 Associações restantes: ${allCardLabels.length - removedCount}`);

      return {
        removed: removedCount,
        total: allCardLabels.length - removedCount
      };

    } catch (error) {
      console.error('❌ Erro ao remover duplicatas:', error);
      throw error;
    }
  }

  /**
   * Verifica se existem duplicatas no sistema
   */
  static async checkForDuplicates(): Promise<Array<{ cardId: number; labelId: number; count: number }>> {
    try {
      const result = await db
        .select({
          cardId: schema.cardLabels.cardId,
          labelId: schema.cardLabels.labelId,
          count: schema.cardLabels.id // Será contado
        })
        .from(schema.cardLabels);

      // Agrupar por cardId + labelId e contar
      const grouped = new Map<string, { cardId: number; labelId: number; count: number }>();
      
      for (const row of result) {
        const key = `${row.cardId}-${row.labelId}`;
        if (grouped.has(key)) {
          grouped.get(key)!.count++;
        } else {
          grouped.set(key, { cardId: row.cardId, labelId: row.labelId, count: 1 });
        }
      }

      // Retornar apenas as duplicatas (count > 1)
      return Array.from(grouped.values()).filter(item => item.count > 1);

    } catch (error) {
      console.error('❌ Erro ao verificar duplicatas:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma associação cardId + labelId já existe
   */
  static async associationExists(cardId: number, labelId: number): Promise<boolean> {
    try {
      const existing = await db
        .select()
        .from(schema.cardLabels)
        .where(
          and(
            eq(schema.cardLabels.cardId, cardId),
            eq(schema.cardLabels.labelId, labelId)
          )
        )
        .limit(1);

      return existing.length > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar associação:', error);
      return false;
    }
  }

  /**
   * Adiciona uma etiqueta a um cartão apenas se ainda não existir
   */
  static async safeAddLabelToCard(cardId: number, labelId: number): Promise<boolean> {
    try {
      // Verificar se já existe
      const exists = await this.associationExists(cardId, labelId);
      
      if (exists) {
        console.log(`⚠️ Etiqueta ${labelId} já associada ao cartão ${cardId}`);
        return false;
      }

      // Adicionar se não existir
      await db.insert(schema.cardLabels).values({
        cardId,
        labelId
      });

      console.log(`✅ Etiqueta ${labelId} adicionada ao cartão ${cardId}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao adicionar etiqueta:', error);
      throw error;
    }
  }
}