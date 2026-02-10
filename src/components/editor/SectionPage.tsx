import { useCallback, useRef } from 'react';
import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import type { SecaoId } from '@/types/laudo';

interface SectionPageProps {
  secaoId: SecaoId;
  conteudo: string;
  onUpdate: (conteudo: string) => void;
}

export function SectionPage({ secaoId, conteudo, onUpdate }: SectionPageProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const secao = SECOES_NAVEGAVEIS.find((s) => s.id === secaoId);

  const handleBlur = useCallback(() => {
    if (editorRef.current) {
      onUpdate(editorRef.current.innerText);
    }
  }, [onUpdate]);

  // Convert plain text with <b> tags to display
  const renderContent = (text: string) => {
    // Simple conversion: bold markers and line breaks
    return text
      .replace(/</g, '&lt;')
      .replace(/&lt;b&gt;/g, '<b>')
      .replace(/&lt;\/b&gt;/g, '</b>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="a4-page">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between text-[9pt]">
        <span className="font-bold" style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}>
          COMPETENCE
        </span>
        <span className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
          Consultoria e Perícias · Avaliações de Imóveis
        </span>
      </div>
      <div className="mb-6 h-px w-full bg-border" />

      {/* Section title */}
      <h2
        className="mb-4 text-base font-bold"
        style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}
      >
        {secao?.label?.toUpperCase() || ''}
      </h2>

      {/* Editable content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        className="min-h-[200mm] whitespace-pre-wrap text-[12pt] leading-relaxed"
        style={{ fontFamily: 'Arial, sans-serif', textAlign: 'justify' }}
        dangerouslySetInnerHTML={{ __html: renderContent(conteudo) }}
      />

      {/* Footer */}
      <div className="mt-auto pt-4">
        <div className="h-px w-full bg-border" />
        <p className="mt-2 text-center text-[8pt] text-muted-foreground">Página X de Y</p>
      </div>
    </div>
  );
}
