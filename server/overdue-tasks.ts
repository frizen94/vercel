import { storage as appStorage } from './db-storage';
import { sql } from './database';

/**
 * Executa uma verificação global de tarefas e subtarefas atrasadas.
 * Cria notificações para os membros atribuídos quando necessário.
 * Retorna o número de notificações criadas.
 */
export async function runOverdueCheck(): Promise<number> {
  let cardNotificationsCreated = 0;
  let subtaskNotificationsCreated = 0;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  console.log(`[OVERDUE-CHECK] Iniciando verificação às ${now.toLocaleString('pt-BR')}`);

  try {
    // 1. Verificar cartões atrasados com membros
    console.log('[OVERDUE-CHECK] Buscando cartões atrasados...');
    
    const overdueCardsQuery = await sql`
      SELECT DISTINCT 
        c.id as card_id,
        c.title as card_title,
        c.due_date,
        cm.user_id,
        l.board_id,
        b.title as board_title
      FROM cards c
      INNER JOIN card_members cm ON c.id = cm.card_id
      INNER JOIN lists l ON c.list_id = l.id
      INNER JOIN boards b ON l.board_id = b.id
      WHERE c.due_date IS NOT NULL 
        AND c.due_date < ${now.toISOString()}
    `;

    console.log(`[OVERDUE-CHECK] Encontrados ${overdueCardsQuery.length} cartões atrasados com membros`);

    for (const row of overdueCardsQuery) {
      try {
        // Verificar se já existe notificação recente para este cartão e usuário
        const duplicateCheck = await sql`
          SELECT id FROM notifications 
          WHERE user_id = ${row.user_id}
            AND type = 'deadline'
            AND related_card_id = ${row.card_id}
            AND created_at > ${oneDayAgo.toISOString()}
          LIMIT 1
        `;

        if (duplicateCheck.length === 0) {
          await appStorage.createNotification({
            userId: row.user_id,
            type: 'deadline',
            title: 'Tarefa atrasada',
            message: `A tarefa "${row.card_title}" está atrasada desde ${new Date(row.due_date).toLocaleDateString('pt-BR')}`,
            relatedCardId: row.card_id,
            actionUrl: `/boards/${row.board_id}/cards/${row.card_id}`
          });
          cardNotificationsCreated++;
          console.log(`[OVERDUE-CHECK] Notificação criada: cartão "${row.card_title}" para usuário ${row.user_id}`);
        } else {
          console.log(`[OVERDUE-CHECK] Pulando duplicata: cartão "${row.card_title}" para usuário ${row.user_id}`);
        }
      } catch (error) {
        console.error(`[OVERDUE-CHECK] Erro ao processar cartão ${row.card_id} para usuário ${row.user_id}:`, error);
      }
    }

    // 2. Verificar subtarefas (checklist items) atrasadas
    console.log('[OVERDUE-CHECK] Buscando subtarefas atrasadas...');
    
    const overdueSubtasksQuery = await sql`
      SELECT DISTINCT
        ci.id as item_id,
        ci.content as item_content,
        ci.due_date,
        ci.assigned_to_user_id,
        c.id as card_id,
        c.title as card_title,
        l.board_id,
        b.title as board_title
      FROM checklist_items ci
      INNER JOIN checklists cl ON ci.checklist_id = cl.id
      INNER JOIN cards c ON cl.card_id = c.id
      INNER JOIN lists l ON c.list_id = l.id
      INNER JOIN boards b ON l.board_id = b.id
      WHERE ci.due_date IS NOT NULL 
        AND ci.due_date < ${now.toISOString()}
        AND ci.assigned_to_user_id IS NOT NULL
    `;

    console.log(`[OVERDUE-CHECK] Encontradas ${overdueSubtasksQuery.length} subtarefas atrasadas`);

    for (const row of overdueSubtasksQuery) {
      try {
        // Verificar se já existe notificação recente para esta subtarefa
        const duplicateCheck = await sql`
          SELECT id FROM notifications 
          WHERE user_id = ${row.assigned_to_user_id}
            AND type = 'deadline'
            AND related_checklist_item_id = ${row.item_id}
            AND created_at > ${oneDayAgo.toISOString()}
          LIMIT 1
        `;

        if (duplicateCheck.length === 0) {
          await appStorage.createNotification({
            userId: row.assigned_to_user_id,
            type: 'deadline',
            title: 'Subtarefa atrasada',
            message: `A subtarefa "${row.item_content}" no cartão "${row.card_title}" está atrasada desde ${new Date(row.due_date).toLocaleDateString('pt-BR')}`,
            relatedChecklistItemId: row.item_id,
            relatedCardId: row.card_id,
            actionUrl: `/boards/${row.board_id}/cards/${row.card_id}`
          });
          subtaskNotificationsCreated++;
          console.log(`[OVERDUE-CHECK] Notificação criada: subtarefa "${row.item_content}" para usuário ${row.assigned_to_user_id}`);
        } else {
          console.log(`[OVERDUE-CHECK] Pulando duplicata: subtarefa "${row.item_content}" para usuário ${row.assigned_to_user_id}`);
        }
      } catch (error) {
        console.error(`[OVERDUE-CHECK] Erro ao processar subtarefa ${row.item_id}:`, error);
      }
    }

  } catch (error) {
    console.error('[OVERDUE-CHECK] Erro geral na verificação de tarefas atrasadas:', error);
  }

  const totalNotifications = cardNotificationsCreated + subtaskNotificationsCreated;
  console.log(`[OVERDUE-CHECK] Concluído: ${cardNotificationsCreated} notificações de cartões + ${subtaskNotificationsCreated} notificações de subtarefas = ${totalNotifications} total`);
  
  return totalNotifications;
}
