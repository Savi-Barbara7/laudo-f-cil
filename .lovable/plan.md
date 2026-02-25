

# Plano de Implementação

Este plano cobre 4 mudanças principais solicitadas.

---

## 1. Editor rico direto nas seções Croqui, ART e Conclusão

**Situação atual:** Essas seções têm upload de imagens + importação Word separada. O RichTextEditor só aparece após importar um Word.

**Mudança:** Remover o botão de importação Word separado (o `WordImportButton` no `LaudoEditor.tsx`) e mostrar o `RichTextEditor` diretamente como editor principal dessas seções. O RichTextEditor já possui botão de importar Word embutido na toolbar (o ícone `FileUp`), então a funcionalidade de importação não se perde.

### Arquivos alterados:
- **`CroquiSection.tsx`** — Mostrar `RichTextEditor` sempre (não apenas quando `richText` existe). Manter upload de imagens acima do editor.
- **`ARTSection.tsx`** — Mesma lógica: RichTextEditor sempre visível. Manter upload de imagens.
- **`ConclusaoSection.tsx`** — RichTextEditor já está presente, apenas garantir que o layout está adequado.
- **`LaudoEditor.tsx`** — Remover o bloco de `WordImportButton` no final do componente (linhas ~130-142), pois o editor já tem importação embutida.

---

## 2. Inserção de PDF na seção Documentações

**Problema:** Atualmente só aceita imagens. O usuário quer inserir PDFs.

**Solução:** Usar a biblioteca `pdfjs-dist` para renderizar cada página do PDF como imagem (canvas → dataURL), e inserir as imagens resultantes na lista de documentações.

### Arquivos alterados:
- **`DocumentacoesSection.tsx`** — Alterar o `input accept` para incluir `application/pdf`. Ao detectar um PDF, usar `pdfjs-dist` para converter cada página em imagem e adicioná-las à lista de imagens do documento.
- **`package.json`** — Adicionar dependência `pdfjs-dist`.

### Fluxo:
1. Usuário clica "Adicionar Ficha" e seleciona um PDF
2. Cada página do PDF é renderizada em um canvas (resolução 150dpi)
3. Cada canvas é convertido em JPEG e enviado ao storage
4. As URLs resultantes são adicionadas como imagens da documentação

---

## 3. Dashboard agrupado por Obra (estilo pasta)

**Situação atual:** O dashboard já agrupa por obra usando `Collapsible`, mas o visual é simples.

**Mudança:** Melhorar o visual para parecer uma estrutura de pastas como na imagem de referência:
- Ícone de pasta azul para cada obra
- Laudos como sub-itens dentro da pasta
- Indentação e visual de árvore de arquivos

### Arquivos alterados:
- **`Dashboard.tsx`** — Redesenhar a seção "Obras" com visual de árvore de pastas. Cada obra é uma pasta expansível com ícone de pasta. Laudos dentro aparecem com ícone de documento e indentação.

---

## 4. Sistema de Login

**Mudança fundamental:** Implementar autenticação com email/senha usando Lovable Cloud.

### Banco de dados (migrações SQL):

1. **Tabela `profiles`** — Armazena dados do usuário (nome, empresa, cargo)
2. **Tabela `obras`** — Agrupa laudos por obra, vinculada ao `user_id`
3. **Tabela `laudos`** — Migração do localStorage para banco de dados, vinculada ao `user_id` e `obra_id`
4. **Trigger** — Auto-criar perfil ao cadastrar
5. **RLS policies** — Cada usuário só vê seus próprios dados
6. **Storage bucket `laudo-fotos`** — Já existe, adicionar policy de acesso por usuário autenticado

### Novos arquivos:
- **`src/pages/Auth.tsx`** — Página de login/cadastro com email e senha
- **`src/hooks/useAuth.tsx`** — Context provider de autenticação (sessão, login, logout, cadastro)
- **`src/hooks/useLaudoStore.ts`** — Refatorar para usar Supabase ao invés de localStorage
- **`src/pages/ResetPassword.tsx`** — Página para redefinir senha

### Rotas:
- `/auth` — Login/Cadastro
- `/reset-password` — Redefinição de senha
- `/` — Dashboard (protegida)
- `/laudos/:id/editor` — Editor (protegida)

### Fluxo:
1. Usuário acessa o app → se não autenticado, redireciona para `/auth`
2. Cadastro com email + senha (verificação por email)
3. Após login, dashboard mostra apenas laudos do usuário
4. Laudos salvos no banco vinculados ao `user_id`

---

## Detalhes Técnicos

### Estrutura do banco de dados:

```text
profiles
├── id (uuid, FK → auth.users)
├── nome (text)
├── empresa (text)
├── cargo (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

obras
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── nome (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

laudos
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── obra_id (uuid, FK → obras, nullable)
├── titulo (text)
├── status (text, default 'rascunho')
├── dados_capa (jsonb)
├── textos (jsonb)
├── lindeiros (jsonb)
├── croqui_images (jsonb)
├── croqui_rich_text (text)
├── art_images (jsonb)
├── art_rich_text (text)
├── documentacoes (jsonb)
├── documentacoes_rich_text (text)
├── conclusao (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### RLS Policies:
- `profiles`: SELECT/UPDATE próprio perfil
- `obras`: CRUD onde `user_id = auth.uid()`
- `laudos`: CRUD onde `user_id = auth.uid()`

### Ordem de implementação:
1. Migrações SQL (tabelas + RLS)
2. Página de Auth + hook de autenticação
3. Refatorar `useLaudoStore` para Supabase
4. Seções do editor (Croqui, ART, Conclusão com editor rico)
5. Documentações com suporte a PDF
6. Dashboard com visual de pastas

