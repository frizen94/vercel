Resumo das alterações realizadas na funcionalidade de Etiquetas (Labels) e instruções rápidas de teste.

Contexto
- Arquivo principal de frontend: `client/src/components/label-manager.tsx`
- Contexto de bordos: `client/src/lib/board-context.tsx`
- Helper de API: `client/src/lib/queryClient.ts` (`apiRequest`)
- Toaster: `client/src/hooks/use-toast.ts`

Principais mudanças aplicadas
1. UX e layout
   - Inline edit: agora ao clicar no ícone de lápis a etiqueta vira inputs inline (nome + hexadecimal)
   - Swatch de cor clicável com overlay `input[type=color]` para abrir o seletor nativo próximo ao modal
   - Removida grade de cores na tela de criação; passou a ser apenas hex input + color picker
   - Modal (DialogContent) com `max-w-2xl` e `max-h-[72vh]` para evitar overflow e permitir scroll interno
   - Layout responsivo: em telas pequenas as linhas ficam em coluna (flex-col) e em telas maiores em linha (sm:flex-row)

2. Confirmação de exclusão
   - Substituído `confirm()` nativo por um `Dialog` estilizado com mensagem e botões "Cancelar" / "Excluir"
   - Feedback via toasts para sucesso/erro

3. Robustez e correções de bugs
   - Muitos erros observados em dev (ex: `deleteLabel is not a function` / `updateLabel is not a function`) ocorreram quando o componente era renderizado sem o `BoardProvider` (HMR ou fluxo de inicialização)
   - Adicionados wrappers seguros: o manager usa primeiro os métodos do `board-context` (ex: `updateLabel`, `deleteLabel`) quando disponíveis; se não, chama `apiRequest('PATCH'|'DELETE', /api/labels/:id)` como fallback
   - Após operações de CRUD, chama `fetchLabels(boardId)` para refazer o refresh e manter a UI consistente

Como testar (passo-a-passo)
1. Reinicie o Vite (hard reload) para garantir que o bundle mais recente está carregado
2. Abra um quadro com labels e clique no botão de editar (ícone de lápis)
   - Altere o nome e a cor (hex) e clique em Salvar
   - Resultado esperado: toast "Etiqueta atualizada" e a lista de etiquetas é atualizada
3. Clique no ícone de deletar (lixeira) em uma etiqueta
   - Um diálogo bonito aparece. Clique em "Excluir"
   - Resultado esperado: toast "Etiqueta excluída" e a etiqueta some da lista
4. Abrir um cartão, acessar "Etiquetas" e aplicar/remoção de etiquetas deve funcionar (usa API ou contexto)

Commit sugerido (pt-BR)
- "pt-BR: Melhorias em Etiquetas, confirmação estilizada e correções\n  - Edição inline de etiquetas com input hexadecimal e swatch\n  - Seletor de cor nativo ancorado ao swatch\n  - Diálogo de exclusão estilizado + toasts\n  - Wrappers seguros para CRUD (contexto ou apiRequest)\n  - Ajustes de modal e layout responsivo"

Notas adicionais
- Alguns avisos TypeScript/JSX foram observados (implicit any, JSX.IntrinsicElements). São melhorias de tipo que podem ser aplicadas separadamente.
- Se o usuário prefere, posso commitar e dar push agora com a mensagem acima. Solicite permissão para que eu execute o git no seu repositório.
