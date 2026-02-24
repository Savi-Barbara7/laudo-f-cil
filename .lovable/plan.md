

## Diagnóstico

O problema principal é que `position: fixed` **não funciona corretamente dentro de um elemento com `transform` CSS**. O container do editor (linha 82 de `LaudoEditor.tsx`) aplica `transform: scale(${zoom})`, o que cria um novo "containing block" — fazendo com que o `fixed inset-0` do `ImageAnnotator` fique relativo ao container com zoom em vez do viewport.

Por isso a caixa de anotações aparece deslocada e reduzida dentro do laudo.

## Solução

Usar `ReactDOM.createPortal` no `ImageAnnotator` para renderizá-lo diretamente no `document.body`, escapando completamente da hierarquia CSS com transform/zoom.

## Alteração

### `src/components/editor/ImageAnnotator.tsx`
- Importar `createPortal` de `react-dom`
- Envolver todo o JSX retornado com `createPortal(..., document.body)`
- Manter o layout `fixed inset-0 z-50` como modal em tela cheia
- Isso garante que o fabric.js receba coordenadas corretas do mouse independentemente do zoom aplicado no editor

A mudança é mínima — apenas 2 linhas (import + wrap com portal). Nenhum outro arquivo precisa ser alterado.

