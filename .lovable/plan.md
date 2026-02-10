

# LVL PRO — Editor de Laudos Técnicos de Vistoria Cautelar

## Visão Geral
Aplicação web profissional para criação e edição de Laudos Técnicos de Vistoria Cautelar de Lindeiros (LVL), com experiência visual tipo Adobe Acrobat — WYSIWYG, índice navegável, organização automática de fotos e exportação PDF fiel ao modelo fornecido.

---

## Fase 1: Editor Completo (Frontend — Dados Locais)

### 1. Tela Inicial — Dashboard Simples
- Lista de laudos salvos localmente (localStorage)
- Botão "Criar Novo Laudo" a partir do template padrão
- Status do laudo (rascunho/finalizado)
- Importar/exportar projeto como JSON (compatível com o formato Streamlit existente)

### 2. Editor de Laudo — Layout Principal
- **Área central**: Visualização WYSIWYG das páginas em formato A4, com zoom in/out
- **Sidebar esquerda**: Índice lateral navegável com marcadores (Capa, Índice, I. Informações Gerais, II. Vistoria do Canteiro, III. Vistoria do Entorno, IV. Croqui, V. ART, VI. Conclusão)
- **Barra superior**: Ferramentas de edição (fonte, tamanho, negrito, itálico, sublinhado, alinhamento, copiar formatação)

### 3. Páginas do Laudo — Estrutura Fiel ao Modelo

#### Capa
- Logo Competence no topo
- Foto aérea/imagem do empreendimento (editável)
- Título "LAUDO TÉCNICO CAUTELAR DE VISTORIA DE LINDEIROS"
- Volume (ex: "Volume 1 de 8")
- Campos editáveis: Empreendimento, Local da obra, Solicitante, CNPJ
- Texto legal pré-preenchido
- QR Code e informações de contato no rodapé

#### Índice
- Gerado automaticamente com base nas seções
- Números de página atualizados automaticamente
- Navegação clicável para cada seção

#### Informações Gerais (Seções 1-6)
- Todas as seções pré-preenchidas com os textos padrão do modelo:
  1. Introdução
  2. Objeto
  3. Objetivo
  4. Finalidade
  5. Responsabilidades e Procedimentos
  6. Conceito de Estados de Conservação
- Texto totalmente editável com editor rico (negrito, itálico, listas, parágrafos justificados)
- Fonte Arial 12 como padrão, texto justificado

#### Vistoria dos Lindeiros
- Adicionar/remover lindeiros
- Para cada lindeiro: tipo de imóvel, uso, endereço, data, acompanhante, telefone, descrição
- Adicionar/remover ambientes por lindeiro
- Upload de fotos (múltiplas) por ambiente
- Layout automático: 2 fotos por linha com legendas editáveis (ex: "Canteiro de Obras - Fig:0001")
- Tabela de classificação do estado de conservação (Bom, Regular, Ruim, Novo)

### 4. Cabeçalho e Rodapé (em todas as páginas internas)
- **Cabeçalho**: Logo Competence à esquerda, serviços à direita (Consultoria e Perícias, Avaliações de Imóveis, etc.)
- **Rodapé**: QR code, numeração "Página X de Y"

### 5. Funcionalidades do Editor
- Quebra automática de página quando o conteúdo excede o espaço
- Inserção manual de quebra de página
- Zoom in/out na visualização
- Salvamento automático no localStorage
- Desfazer/refazer (Ctrl+Z / Ctrl+Y)

### 6. Exportação PDF
- Geração de PDF com layout idêntico ao modelo fornecido
- Numeração de páginas correta
- Índice com páginas corretas
- Fotos organizadas em grid 2x1 com legendas
- Download direto do navegador

### 7. Gestão de Fotos
- Upload de múltiplas fotos por arrastar/soltar
- Legendas editáveis individualmente
- Reordenar fotos por drag & drop
- Apagar fotos individuais ou todas de um ambiente
- Numeração automática (Fig:0001, Fig:0002...)

---

## Fase 2: Backend com Lovable Cloud (após validação do editor)
- Autenticação de usuários (login/cadastro)
- Salvamento de laudos no banco de dados
- Storage para fotos (sem armazenar no banco)
- Histórico e versionamento de laudos
- Compartilhamento de laudos entre usuários

---

## Design e Estética
- Visual profissional e limpo, inspirado no Adobe Acrobat
- Fundo cinza neutro com páginas brancas centralizadas
- Sidebar escura com índice navegável
- Tipografia Arial como padrão nos documentos
- Interface focada em produtividade para documentos extensos (+300 páginas)
- Cores da marca Competence (azul escuro) nos elementos de interface

