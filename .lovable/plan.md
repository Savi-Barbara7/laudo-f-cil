
# Plano de Implementacao - Novas Secoes e Organizacao por Obra

## Resumo

Adicionar 4 novas secoes ao laudo (Croqui, ART, Documentacoes, Conclusao), criar componentes de edicao para cada uma, atualizar a geracao de PDF, e reorganizar o Dashboard para agrupar laudos por obra.

---

## 1. Atualizar Tipos (src/types/laudo.ts)

- Adicionar novos campos ao tipo `Laudo`:
  - `croquiImages: CroquiImage[]` - array de imagens de croqui com legendas
  - `artImages: string[]` - array de URLs de imagens/PDFs da ART
  - `documentacoes: Documentacao[]` - lista de fichas com nome, descricao e imagens anexadas
  - `conclusao: string` - texto livre da conclusao
  - `obra: string` - nome da obra para agrupamento no Dashboard
- Adicionar novos valores ao tipo `SecaoId`: `'croqui' | 'art' | 'documentacoes' | 'conclusao'`
- Criar interfaces: `CroquiImage` (id, url, legenda) e `Documentacao` (id, nome, imagens)

## 2. Atualizar Secoes Navegaveis (src/data/defaultTexts.ts)

- Adicionar ao array `SECOES_NAVEGAVEIS`:
  - `{ id: 'croqui', label: 'VIII. Croqui' }`
  - `{ id: 'art', label: 'IX. ART' }`
  - `{ id: 'documentacoes', label: 'X. Documentacoes' }`
  - `{ id: 'conclusao', label: 'XI. Conclusao' }`
- Adicionar texto padrao para conclusao em `TEXTOS_PADRAO` ou no tipo Laudo

## 3. Criar Componentes de Edicao

### 3a. CroquiSection (src/components/editor/CroquiSection.tsx)
- Permite upload de imagens de croqui (mapa aereo com marcacoes)
- Cada imagem tem um campo de legenda editavel
- Botao para adicionar/remover imagens
- Visualizacao das imagens em tamanho grande dentro da pagina A4

### 3b. ARTSection (src/components/editor/ARTSection.tsx)
- Upload de imagens ou PDFs (convertidos em imagem) da ART
- Visualizacao das imagens anexadas
- Botao para adicionar/remover

### 3c. DocumentacoesSection (src/components/editor/DocumentacoesSection.tsx)
- Campo de texto para descricao/titulo de cada documentacao (ex: "Ficha de Vistoria Tecnica - PAVILHAO COMERCIAL - Avenida Victor Kunz, 2740")
- Upload de imagens das fichas de vistoria
- Botao para adicionar/remover documentacoes
- Secao opcional (pode ficar vazia quando nao ha fichas)

### 3d. ConclusaoSection (src/components/editor/ConclusaoSection.tsx)
- Textarea grande e redimensionavel para o texto da conclusao
- Semelhante ao SectionPage mas dedicado

## 4. Atualizar LaudoEditor (src/pages/LaudoEditor.tsx)

- Importar e renderizar os 4 novos componentes condicionalmente com base em `secaoAtiva`
- Adicionar handlers de update para cada nova secao

## 5. Atualizar EditorSidebar (src/components/editor/EditorSidebar.tsx)

- Adicionar icones para as novas secoes (Map para Croqui, FileCheck para ART, FolderOpen para Documentacoes, CheckCircle para Conclusao)

## 6. Atualizar useLaudoStore (src/hooks/useLaudoStore.ts)

- Inicializar os novos campos ao criar um laudo: `croquiImages: []`, `artImages: []`, `documentacoes: []`, `conclusao: ''`, `obra: ''`

## 7. Atualizar Geracao de PDF (src/lib/pdfGenerator.ts)

- Apos a secao de Lindeiros, adicionar:
  - **Croqui**: nova pagina com titulo "Croqui de Localizacao", renderizar cada imagem de croqui em pagina cheia com legenda
  - **ART**: nova pagina com titulo "ART", renderizar imagens da ART
  - **Documentacoes**: pagina com lista de documentacoes e, em seguida, as imagens das fichas
  - **Conclusao**: pagina com titulo "Conclusao" e texto com quebra automatica de pagina
- Atualizar o indice para incluir as 4 novas secoes com numeros de pagina

## 8. Reorganizar Dashboard por Obra (src/pages/Dashboard.tsx)

- Adicionar campo "Obra" ao criar um laudo (dialog ou input)
- Agrupar laudos por `obra` no Dashboard
- Exibir como acordeao ou secoes colapsaveis: nome da obra como cabecalho, volumes/laudos como cards dentro
- Laudos sem obra definida ficam em grupo "Sem obra"
- Cada card mostra o volume e titulo do laudo

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/components/editor/CroquiSection.tsx`
- `src/components/editor/ARTSection.tsx`
- `src/components/editor/DocumentacoesSection.tsx`
- `src/components/editor/ConclusaoSection.tsx`

### Arquivos a modificar:
- `src/types/laudo.ts` - novos tipos e SecaoId
- `src/data/defaultTexts.ts` - novas secoes navegaveis
- `src/hooks/useLaudoStore.ts` - inicializacao dos novos campos
- `src/pages/LaudoEditor.tsx` - renderizacao das novas secoes
- `src/components/editor/EditorSidebar.tsx` - icones das novas secoes
- `src/lib/pdfGenerator.ts` - renderizacao PDF das novas secoes + indice atualizado
- `src/pages/Dashboard.tsx` - agrupamento por obra

### Upload de imagens:
- Reutilizar `uploadImage` de `src/lib/storageHelper.ts` para Croqui, ART e Documentacoes
- Armazenar URLs no estado do laudo (mesmo padrao dos ambientes/fotos dos lindeiros)

### Compatibilidade:
- Laudos existentes sem os novos campos receberao valores padrao via fallback no codigo (`laudo.croquiImages || []`)
