import { Textarea } from '@/components/ui/textarea';

interface ConclusaoSectionProps {
  conclusao: string;
  onUpdate: (value: string) => void;
}

export function ConclusaoSection({ conclusao, onUpdate }: ConclusaoSectionProps) {
  return (
    <div className="a4-page mb-8">
      <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
        CONCLUSÃO
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Descreva o conteúdo de cada volume e considerações finais do laudo.
      </p>
      <Textarea
        value={conclusao}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Ex: Volume 01 contempla os lindeiros de 1 a 10, localizados na Rua... Volume 02 contempla..."
        className="min-h-[400px] resize-y text-sm"
      />
    </div>
  );
}
