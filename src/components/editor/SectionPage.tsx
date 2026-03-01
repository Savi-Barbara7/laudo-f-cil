import { RichTextEditor } from './RichTextEditor';
import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import type { SecaoId } from '@/types/laudo';

interface SectionPageProps {
  secaoId: SecaoId;
  conteudo: string;
  onUpdate: (conteudo: string) => void;
  placeholder?: string;
}

export function SectionPage({ secaoId, conteudo, onUpdate, placeholder }: SectionPageProps) {
  const secao = SECOES_NAVEGAVEIS.find((s) => s.id === secaoId);

  return (
    <div className="a4-page">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between text-[9pt]">
        <span className="font-bold" style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}>
          COMPETENCE
        </span>
        <span className="text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
          Consultoria e Perícias · Avaliações de Imóveis
        </span>
      </div>
      <div className="mb-4 h-px w-full bg-border" />

      {/* Section title */}
      <h2
        className="mb-4 text-base font-bold"
        style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}
      >
        {secao?.label?.toUpperCase() || ''}
      </h2>

      {/* RichText editor (full editing with toolbar) */}
      <RichTextEditor
        content={conteudo}
        onUpdate={onUpdate}
        placeholder={placeholder || 'Clique para editar...'}
        minHeight="200mm"
      />

      {/* Footer */}
      <div className="mt-6 pt-4">
        <div className="h-px w-full bg-border" />
        <p className="mt-2 text-center text-[8pt] text-muted-foreground">Página X de Y</p>
      </div>
    </div>
  );
}
