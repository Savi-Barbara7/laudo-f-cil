

# Plano: Transformacao Visual SaaS + Dashboard Profissional

## Resumo

Redesign completo da identidade visual do sistema para parecer um software pago profissional, incluindo logo, paleta de cores refinada, tipografia moderna e um dashboard com metricas e filtros.

---

## 1. Identidade Visual - Paleta e Variaveis CSS

Atualizar `src/index.css` com paleta profissional refinada:
- Azul escuro primario mais sofisticado (hsl 215, 50%, 18%)
- Cinza claro de fundo mais limpo
- Bordas mais sutis
- Sombras mais suaves nos cards
- Transicoes suaves em hover states
- Sidebar com tom mais escuro e elegante

## 2. Logo e Header do Sistema

Atualizar o header em `src/pages/Dashboard.tsx` e `src/components/editor/EditorToolbar.tsx`:
- Logo textual estilizado "LVL PRO" com icone de escudo/documento ao lado
- Subtitulo menor e mais discreto
- Header com fundo branco, sombra sutil e borda inferior refinada
- Espacamento mais generoso

## 3. Dashboard com Metricas (src/pages/Dashboard.tsx)

Redesign completo do Dashboard:
- **Cards de metricas no topo:**
  - Total de laudos criados no mes (com icone FileText)
  - Total finalizados (com icone CheckCircle)
  - Total em andamento/rascunho (com icone Clock)
  - Total de lindeiros registrados (com icone MapPin)
- **Filtro por periodo:** Select com opcoes (Este mes, Ultimo mes, Ultimos 3 meses, Este ano, Todos)
- **Lista "Ultimos Laudos":** Tabela limpa com os 5 laudos mais recentes, mostrando titulo, obra, status, data
- **Botao "Criar Novo Laudo"** em destaque com icone e cor primaria
- **Secao de obras agrupadas** abaixo das metricas (mantendo o agrupamento existente mas com visual melhorado)

## 4. Cards e Componentes Padronizados

- Cards com border-radius maior (8px), sombra sutil, hover com elevacao
- Badges de status com cores consistentes (verde para finalizado, amarelo para rascunho)
- Botoes com padding mais generoso, cantos arredondados, transicoes suaves
- Espacamento vertical entre secoes mais generoso (gap-6 em vez de gap-3)

## 5. Editor - Melhorias Visuais

Atualizar `src/pages/LaudoEditor.tsx` e `src/components/editor/EditorToolbar.tsx`:
- Toolbar mais limpa com fundo branco e sombra
- Sidebar com hover states mais suaves
- Area de edicao com fundo mais limpo
- Controle de zoom mais discreto

## 6. Tipografia

- Usar Inter ou manter system font stack mas com pesos mais consistentes
- Titulos em font-weight 700, subtitulos em 600, corpo em 400
- Line-height mais confortavel (1.6)
- Tamanhos de fonte mais hierarquicos

---

## Detalhes Tecnicos

### Arquivos a modificar:
- `src/index.css` - Variaveis CSS, estilos globais, tipografia
- `src/pages/Dashboard.tsx` - Redesign completo com metricas, filtros e lista recente
- `src/pages/LaudoEditor.tsx` - Ajustes visuais no editor
- `src/components/editor/EditorToolbar.tsx` - Header/toolbar mais profissional
- `src/components/editor/EditorSidebar.tsx` - Sidebar mais elegante
- `tailwind.config.ts` - Ajustes de tema se necessario

### Metricas do Dashboard:
- Calculadas a partir dos dados existentes em localStorage (array de laudos)
- Filtro por periodo filtra `criadoEm` dos laudos
- Nao requer mudancas no backend ou banco de dados
- Usa os mesmos dados do `useLaudoStore`

### Compatibilidade:
- Nenhuma mudanca estrutural nos dados
- Apenas visual e layout
- Funcionalidades existentes permanecem intactas

