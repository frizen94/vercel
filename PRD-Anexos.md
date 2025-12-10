# PRD - Sistema de Anexos para NexusTasks

## 📋 Visão Geral

### 🎯 Objetivo
Implementar funcionalidade de anexos em comentários e cards do NexusTasks, permitindo que usuários façam upload de arquivos (imagens, documentos, etc.) de forma similar ao Asana e Trello.

### 📊 Escopo
- **In Scope**: Anexos em comentários e cards, upload via interface web, armazenamento local
- **Out of Scope**: Integração com cloud storage (Google Drive, Dropbox), edição colaborativa de documentos

---

## 👥 Personas e Cenários de Uso

### 👤 Persona Principal: Gerente de Projetos
**Cenário**: Ana precisa compartilhar um documento de requisitos com a equipe em um comentário específico de uma tarefa.
- **Problema Atual**: Só pode descrever em texto
- **Solução**: Anexa o documento PDF diretamente no comentário
- **Benefício Adicional**: Pode anexar mockups no card e visualizar em tela cheia com zoom

### 👤 Persona: Desenvolvedor
**Cenário**: Carlos quer mostrar um screenshot de um bug para o time.
- **Problema Atual**: Precisa hospedar imagem externamente e compartilhar link
- **Solução**: Anexa screenshot diretamente no comentário
- **Benefício Adicional**: Time clica na imagem para ver detalhes em tamanho completo

### 👤 Persona: Designer
**Cenário**: Maria compartilha wireframes e mockups de uma nova feature.
- **Problema Atual**: Precisa usar ferramentas externas para compartilhar designs
- **Solução**: Anexa múltiplas imagens no card da feature
- **Benefício Adicional**: Time navega entre as imagens usando o lightbox (← →)

---

## 🔧 Requisitos Funcionais

### RF001 - Upload de Anexos em Comentários
**Descrição**: Usuários podem anexar arquivos aos comentários durante a criação ou edição.

**Critérios de Aceitação**:
- Botão de papel clip (📎) na interface de comentários
- Suporte a múltiplos tipos de arquivo
- Limite de tamanho por arquivo: 10MB
- Validação de tipos MIME permitidos

### RF002 - Upload de Anexos em Cards
**Descrição**: Usuários podem anexar arquivos diretamente aos cards (habilitar botão atual).

**Critérios de Aceitação**:
- Botão "Anexo" funcional no card modal
- Mesma validação de RF001
- Anexos ficam visíveis na seção de anexos do card

### RF003 - Visualização de Anexos
**Descrição**: Anexos são exibidos de forma intuitiva nos comentários e cards, com preview inline de imagens.

**Critérios de Aceitação**:
- Preview de imagens inline (thumbnail) nos comentários e cards
- Clique na imagem abre modal/lightbox em tamanho completo
- Ícones apropriados para diferentes tipos de arquivo (PDF, DOC, etc.)
- Nome do arquivo e tamanho exibidos
- Link para download
- Navegação entre múltiplas imagens no lightbox (anterior/próxima)
- Zoom na imagem no lightbox
- Botão para fechar o lightbox (ESC também fecha)

### RF004 - Download de Anexos
**Descrição**: Usuários podem baixar anexos existentes.

**Critérios de Aceitação**:
- Link de download funcional
- Nome original do arquivo preservado
- Funciona em diferentes navegadores

### RF005 - Gerenciamento de Anexos
**Descrição**: Usuários podem remover anexos que criaram.

**Critérios de Aceitação**:
- Botão de exclusão (🗑️) nos próprios anexos
- Confirmação antes da exclusão
- Arquivo removido do servidor

### RF006 - Lightbox/Modal de Visualização de Imagens
**Descrição**: Ao clicar em uma imagem anexada, ela é exibida em tamanho completo em um lightbox/modal.

**Critérios de Aceitação**:
- Modal ocupa a tela com overlay escuro (backdrop)
- Imagem centralizada e responsiva (ajusta ao tamanho da tela)
- Controles de navegação (← → ou setas do teclado) se houver múltiplas imagens
- Botão de fechar (✕) visível no canto superior direito
- Tecla ESC fecha o modal
- Clique fora da imagem (no backdrop) fecha o modal
- Zoom in/out na imagem (botões + - ou scroll do mouse)
- Informações do arquivo exibidas (nome, tamanho, data de upload)
- Botão de download direto no lightbox
- Animação suave de abertura/fechamento

---

## 🔒 Requisitos Não-Funcionais

### RNF001 - Performance
- Upload máximo: 10MB por arquivo
- Tempo de upload: < 30 segundos para arquivos de 10MB
- Preview de imagens (thumbnail): < 2 segundos
- Abertura do lightbox: < 500ms
- Geração de thumbnails automática para imagens grandes

### RNF002 - Segurança
- Validação de tipos MIME no servidor
- Sanitização de nomes de arquivo
- Controle de acesso: só usuários do board podem ver anexos
- Logs de auditoria para uploads

### RNF003 - Usabilidade
- Interface intuitiva similar ao Asana/Trello
- Feedback visual durante upload (progress bar)
- Mensagens de erro claras
- Responsive design

### RNF004 - Escalabilidade
- Armazenamento local inicialmente
- Estrutura preparada para cloud storage futuro
- Limite de anexos por comentário/card: 10

---

## 🏗️ Arquitetura Técnica

### 📊 Modelo de Dados

```sql
-- Nova tabela de anexos
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,           -- Nome único no servidor
  original_name TEXT NOT NULL,      -- Nome original do arquivo
  mime_type TEXT NOT NULL,          -- Tipo MIME
  size INTEGER NOT NULL,            -- Tamanho em bytes
  path TEXT NOT NULL,               -- Caminho no servidor
  thumbnail_path TEXT,              -- Caminho do thumbnail (para imagens)
  url TEXT,                         -- Para cloud storage futuro

  -- Relacionamentos (apenas um deve ser preenchido)
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,

  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_attachments_card_id ON attachments(card_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_mime_type ON attachments(mime_type);
```

### 🛠️ APIs REST

#### Upload de Anexos
```
POST /api/cards/:cardId/attachments
POST /api/comments/:commentId/attachments

Headers:
- Content-Type: multipart/form-data
- Authorization: Bearer token

Body:
- file: File (obrigatório)
- description: string (opcional)

Response: 201 Created
{
  "id": 123,
  "filename": "document.pdf",
  "originalName": "Requisitos v1.2.pdf",
  "mimeType": "application/pdf",
  "size": 2457600,
  "url": "/uploads/attachments/123_document.pdf",
  "thumbnailUrl": "/uploads/attachments/thumbnails/123_document.jpg",
  "isImage": false
}
```

#### Listar Anexos
```
GET /api/cards/:cardId/attachments
GET /api/comments/:commentId/attachments

Response: 200 OK
[
  {
    "id": 123,
    "filename": "document.pdf",
    "originalName": "Requisitos v1.2.pdf",
    "mimeType": "application/pdf",
    "size": 2457600,
    "url": "/uploads/attachments/123_document.pdf",
    "thumbnailUrl": null,
    "isImage": false,
    "uploadedBy": { "id": 1, "name": "João Silva" },
    "createdAt": "2025-12-09T10:30:00Z"
  },
  {
    "id": 124,
    "filename": "screenshot.png",
    "originalName": "Bug Screenshot.png",
    "mimeType": "image/png",
    "size": 1258291,
    "url": "/uploads/attachments/124_screenshot.png",
    "thumbnailUrl": "/uploads/attachments/thumbnails/124_screenshot.jpg",
    "isImage": true,
    "uploadedBy": { "id": 2, "name": "Maria Santos" },
    "createdAt": "2025-12-09T11:15:00Z"
  }
]
```

#### Download de Anexos
```
GET /api/attachments/:id/download

Response: 200 OK (com headers apropriados para download)
Content-Type: application/pdf
Content-Disposition: attachment; filename="Requisitos v1.2.pdf"
```

#### Excluir Anexo
```
DELETE /api/attachments/:id

Response: 204 No Content
```

### 🎨 Interface do Usuário

#### 1. Interface de Comentários (com Preview de Imagens)
```
┌─────────────────────────────────────────────────┐
│ 💬 Comentários                                  │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [Avatar] João Silva                       │ │
│ │                                             │ │
│ │ Este é meu comentário com anexo...         │ │
│ │                                             │ │
│ │ ┌──────────┐  📎 document.pdf (2.3 MB)    │ │
│ │ │   🖼️    │                    [🗑️]       │ │
│ │ │ [THUMB]  │  ← Clique para maximizar      │ │
│ │ │  IMAGE   │                               │ │
│ │ └──────────┘                                │ │
│ │ screenshot.png (1.2 MB)                     │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [Avatar] Maria Santos                      │ │
│ │ Escrever um comentário...                  │ │
│ │                                             │ │
│ │ [📎 Anexar] [Enviar]                       │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### 2. Modal de Card (com Seção de Anexos)
```
┌─────────────────────────────────────────────────┐
│ Card: Implementar Feature X              [✕]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Descrição: ...                                  │
│                                                 │
│ 📎 Anexos (3)                                   │
│ ┌──────────┐ ┌──────────┐  📄 specs.pdf       │
│ │   🖼️    │ │   🖼️    │     (2.5 MB)        │
│ │ [THUMB]  │ │ [THUMB]  │     [↓] [🗑️]       │
│ │ design.png│ │ bug.jpg  │                     │
│ └──────────┘ └──────────┘                      │
│                                                 │
│ [📎 Adicionar Anexo]                            │
│                                                 │
│ 💬 Comentários                                  │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

#### 3. Lightbox/Modal de Visualização de Imagem
```
┌─────────────────────────────────────────────────┐
│                                           [✕]   │
│  ◀                                          ▶   │
│                                                 │
│            ┌─────────────────────┐              │
│            │                     │              │
│            │                     │              │
│            │   IMAGEM COMPLETA   │              │
│            │    (Maximizada)     │              │
│            │                     │              │
│            └─────────────────────┘              │
│                                                 │
│  screenshot.png • 1.2 MB • 22 out 2025          │
│  [🔍+] [🔍-] [↓ Download]                       │
│                                                 │
│  [1 de 3]           ← Clique ESC para fechar    │
└─────────────────────────────────────────────────┘
        ↑ Backdrop escuro (clique fecha)
```

#### 4. Modal de Upload
```
┌─────────────────────────────────────────────────┐
│ 📎 Anexar Arquivo                              │
├─────────────────────────────────────────────────┤
│ Arraste arquivos aqui ou clique para selecionar │
│                                                 │
│ 📄 document.pdf ✓                               │
│ 🖼️ image.jpg ✓  [👁️ Preview]                   │
│                                                 │
│ [Cancelar] [Anexar 2 arquivos]                  │
└─────────────────────────────────────────────────┘
```

---

## 📋 Critérios de Aceitação Gerais

### Funcionalidades Core
- [ ] Upload de arquivos via drag & drop
- [ ] Upload via clique no botão
- [ ] Preview de imagens (thumbnails)
- [ ] Lightbox para visualização de imagens em tamanho completo
- [ ] Navegação entre imagens no lightbox
- [ ] Zoom in/out de imagens
- [ ] Download de arquivos
- [ ] Exclusão de anexos próprios
- [ ] Validação de tipos e tamanhos
- [ ] Anexos tanto em cards quanto em comentários

### Qualidade
- [ ] Testes unitários para APIs
- [ ] Testes de integração para upload
- [ ] Validação de segurança
- [ ] Performance adequada
- [ ] Interface responsiva

### Documentação
- [ ] API documentation atualizada
- [ ] Guia de usuário
- [ ] Documentação técnica

---

## 🚀 Plano de Implementação

### Fase 1: Backend (Semanas 1-2)
1. Criar tabela `attachments` com campo `thumbnail_path`
2. Implementar endpoints de upload/download
3. Configurar Multer para anexos (cards e comentários)
4. Adicionar validações de segurança
5. Implementar geração automática de thumbnails para imagens
6. Endpoint para servir imagens em tamanho completo

### Fase 2: Frontend (Semanas 3-4)
1. Interface de upload em comentários
2. Interface de upload em cards (habilitar botão existente)
3. Componentes de preview/download
4. Componente de lightbox para visualização de imagens
5. Navegação entre imagens no lightbox
6. Zoom e controles do lightbox
7. Integração com APIs

### Fase 3: Testes e Refinamentos (Semana 5)
1. Testes end-to-end
2. Ajustes de UX
3. Otimizações de performance
4. Documentação

---

## ⚠️ Riscos e Mitigações

### Risco 1: Armazenamento Local
**Impacto**: Alto (espaço em disco, backup)
**Mitigação**: Implementar estrutura preparada para cloud storage futuro

### Risco 2: Performance com Arquivos Grandes
**Impacto**: Médio
**Mitigação**: Implementar upload em chunks se necessário

### Risco 3: Segurança de Arquivos
**Impacto**: Alto
**Mitigação**: Validação rigorosa de tipos MIME e conteúdo

---

## 📈 Métricas de Sucesso

- **Adoption Rate**: 70% dos usuários ativos usam anexos em comentários e/ou cards
- **Upload Success Rate**: > 95% de uploads bem-sucedidos
- **Performance**: < 5 segundos para upload de arquivos de 5MB
- **Lightbox Usage**: 80% dos usuários que veem imagens clicam para visualizar em tela cheia
- **User Satisfaction**: > 4.0/5.0 em feedback de usuários
- **Image Attachments**: 60% dos anexos são imagens (indicador de uso do lightbox)

---

## 📅 Marcos e Entregas

| Marco | Data | Entregáveis |
|-------|------|-------------|
| Kickoff | Semana 1 | PRD aprovado, arquitetura definida |
| Backend MVP | Semana 2 | APIs funcionais, testes básicos |
| Frontend MVP | Semana 4 | Interface funcional, integração |
| Lançamento | Semana 5 | Feature completa em produção |
| Follow-up | Semana 6 | Métricas coletadas, ajustes |

---

## 🔧 Status de Implementação

### ✅ Completo - Backend
- [x] Tabela `attachments` criada com todos os campos incluindo `thumbnail_path`
- [x] Migrations implementadas (init.sql, schema-setup.ts)
- [x] 6 endpoints REST implementados:
  - POST /api/cards/:cardId/attachments
  - POST /api/comments/:commentId/attachments
  - GET /api/cards/:cardId/attachments
  - GET /api/comments/:commentId/attachments
  - GET /api/attachments/:id/download
  - DELETE /api/attachments/:id
- [x] Multer configurado: single('file'), 10MB limit, validação de tipos MIME
- [x] Sharp v0.34.5 configurado para geração de thumbnails (300x300px, JPEG 80%)
- [x] Docker Alpine com dependências nativas do sharp (vips-dev, fftw-dev, etc)
- [x] Validação de segurança e autenticação implementadas
- [x] Logs de auditoria para uploads

### ✅ Completo - Frontend
- [x] Componente `AttachmentUpload` criado (drag-drop, validação, preview)
- [x] Componente `ImageLightbox` criado (zoom, navegação, download)
- [x] Integração no `card-modal.tsx`:
  - Botão de anexo habilitado (removido disabled)
  - Upload via botão funcional (interface)
  - Lista de anexos com thumbnails
  - Handlers de download e delete
  - Paste image com Ctrl+V implementado
  - Lightbox integrado para visualização

### ❌ Bloqueado - Upload de Arquivos
**Status**: Implementação completa mas não funcional

**Problema Atual**: 
```
POST /api/cards/1/attachments 400 Bad Request
Response: {"message":"No file uploaded"}
```

**Sintomas**:
- Upload via botão: Falha com 400
- Upload via Ctrl+V (paste): Falha com 400
- CSRF token validado com sucesso (✓)
- Arquivo não chega ao Multer (req.file é undefined)

**Investigação Realizada**:
1. ✅ Verificado Multer configurado como `uploadAttachment.single('file')`
2. ✅ Corrigido campo FormData de 'attachment' para 'file'
3. ✅ Adicionado parâmetro `isFormData: true` no apiRequest
4. ✅ Debug logging adicionado ao endpoint (linha ~1840 de routes.ts)
5. ⏳ Aguardando análise do debug output

**Código de Upload (card-modal.tsx)**:
```typescript
// Upload via botão
const formData = new FormData();
formData.append('file', file); // ✓ Campo correto
const response = await apiRequest(
  'POST',
  `/api/cards/${currentCard.id}/attachments`,
  formData,
  {},
  true // ✓ isFormData
);

// Upload via Ctrl+V
const formData = new FormData();
formData.append('file', file); // ✓ Campo correto
const response = await apiRequest(
  'POST',
  `/api/cards/${currentCard.id}/attachments`,
  formData,
  {},
  true // ✓ isFormData
);
```

**Debug Logging (server/routes.ts)**:
```typescript
console.log('📎 Upload attempt:', {
  hasFile: !!req.file,
  contentType: req.headers['content-type'],
  bodyKeys: Object.keys(req.body),
  filesKeys: req.files ? Object.keys(req.files) : 'no files object'
});
```

**Hipóteses**:
1. Content-Type header não está sendo configurado corretamente pelo browser
2. FormData boundary não está sendo incluído
3. csrfFetch pode estar interferindo com FormData
4. apiRequest pode estar sobrescrevendo Content-Type indevidamente

**Próximos Passos**:
1. Analisar output do debug logging
2. Verificar headers da requisição no browser DevTools
3. Confirmar se FormData está sendo enviado corretamente
4. Ajustar apiRequest se necessário (não definir Content-Type para FormData)

### ⏸ Não Testado - Features Dependentes
- [ ] Thumbnail generation (depende de upload funcionar)
- [ ] Image lightbox com navegação
- [ ] Download de anexos
- [ ] Delete de anexos
- [ ] Drag & drop upload
- [ ] Validação de tamanho e tipo de arquivo
- [ ] Anexos em comentários (mesma issue que cards)

---

## 🐛 Issues Conhecidos

### Issue #1: Upload de Arquivos Não Funciona
**Severidade**: 🔴 Crítica (Blocker)  
**Reportado**: 10 de dezembro de 2025  
**Status**: Em investigação

**Descrição**: Tanto upload via botão quanto paste (Ctrl+V) resultam em erro 400 "No file uploaded". O arquivo não chega ao middleware Multer.

**Logs do Servidor**:
```
🔒 [CSRF] Token validado ✓
POST /api/cards/1/attachments 400 in 6ms :: {"message":"No file uploaded"}
```

**Impacto**: Nenhuma funcionalidade de anexos está operacional. Bloqueia todo o teste da feature.

**Workarounds**: Nenhum disponível.

---

## 📝 Notas Técnicas

### Docker & Sharp
- Container rodando Node 20 Alpine Linux
- Pacotes instalados: vips-dev, fftw-dev, build-base, python3, pkgconfig
- ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1 configurada
- Sharp v0.34.5 importa sem erros (ERR_MODULE_NOT_FOUND resolvido)
- Application inicia com sucesso, 20 tabelas criadas

### Estrutura de Arquivos
```
server/
  routes.ts           - 6 endpoints de attachments + debug logging
  db-storage.ts       - 5 métodos CRUD de attachments
  schema-setup.ts     - Migration de attachments
  migrations/         - SQL files
  
client/src/components/
  attachment-upload.tsx   - Upload UI component
  image-lightbox.tsx      - Lightbox viewer
  card-modal.tsx          - Integração completa
  
shared/
  schema.ts           - attachments pgTable definition
  
init.sql              - CREATE TABLE attachments com 4 índices
```

### API Request Flow
```
Browser → FormData { file: File }
    ↓
card-modal.tsx → apiRequest(..., formData, {}, true)
    ↓
csrfFetch → adiciona X-CSRF-Token header
    ↓
Express → CSRF middleware (✓ validado)
    ↓
Multer → uploadAttachment.single('file')
    ↓
❌ req.file = undefined → 400 "No file uploaded"
```

---

*Documento criado em: 9 de dezembro de 2025*
*Última atualização: 10 de dezembro de 2025*
*Versão: 2.1*
*Autor: GitHub Copilot*
*Mudanças v2.1: Adicionado status de implementação, issues conhecidos, debugging em andamento*</content>
<parameter name="filePath">/home/falcao/Documentos/Breno/Projetos/NexusTasks/PRD-Anexos.md