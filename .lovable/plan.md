

## Diagnóstico dos Problemas

### 1. Anotador de imagens não funciona
O `ImageAnnotator` é renderizado **dentro** do container com `transform: scale(0.6)` (zoom). Isso quebra completamente o fabric.js porque as coordenadas do mouse ficam deslocadas pela transformação CSS. Mesmo que o canvas apareça, clicar/desenhar não funciona corretamente.

**Solução:** Renderizar o `ImageAnnotator` como um modal `fixed` em tela cheia (fora do container com zoom), garantindo que o fabric.js receba coordenadas corretas.

### 2. Importação Word não mostra todos os arquivos
O atributo `accept=".docx"` no file input filtra os arquivos visíveis no seletor do sistema operacional. Arquivos `.doc` não aparecem.

**Solução:** Alterar o accept para `.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document` para mostrar todos os formatos Word. Se o usuário selecionar um `.doc`, exibir um toast explicativo pedindo para salvar como `.docx`.

---

## Plano de Implementação

### Arquivo 1: `src/components/editor/ImageAnnotator.tsx`
- Alterar o container principal para `fixed inset-0 z-50` com fundo escuro semitransparente
- Centralizar o editor no viewport
- Isso resolve tanto o problema de coordenadas do fabric.js quanto o posicionamento visual

### Arquivo 2: `src/components/editor/WordImportButton.tsx`
- Alterar `input.accept` para aceitar `.doc,.docx` e MIME types correspondentes
- Manter a validação que verifica se é `.docx` e exibe toast informativo para `.doc`

### Arquivo 3: `src/components/editor/LindeirosSection.tsx`
- Mover o `<ImageAnnotator>` para fora do container com zoom (renderizar como portal/fixed)
- Já está fora do zoom no código atual, mas precisa garantir que funcione como modal fixo

### Arquivos 4-6: `CroquiSection.tsx`, `ARTSection.tsx`, `DocumentacoesSection.tsx`
- Mesma correção: garantir que o `ImageAnnotator` funcione como modal fixo

