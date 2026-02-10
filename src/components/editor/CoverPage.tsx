import { useCallback, useRef } from 'react';
import type { DadosCapa } from '@/types/laudo';
import { Input } from '@/components/ui/input';
import { ImagePlus, X } from 'lucide-react';

interface CoverPageProps {
  dadosCapa: DadosCapa;
  onUpdate: (data: DadosCapa) => void;
}

export function CoverPage({ dadosCapa, onUpdate }: CoverPageProps) {
  const handleChange = useCallback(
    (field: keyof DadosCapa, value: string | number) => {
      onUpdate({ ...dadosCapa, [field]: value });
    },
    [dadosCapa, onUpdate]
  );

  return (
    <div className="a4-page flex flex-col items-center justify-between" style={{ minHeight: '297mm' }}>
      {/* Header - Logo */}
      <div className="w-full">
        <div className="mb-2 text-center">
          <h1
            className="text-2xl font-bold tracking-wide"
            style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}
          >
            COMPETENCE
          </h1>
          <p className="text-[9pt] text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
            Consultoria e Perícias · Avaliações de Imóveis · Ensaios Não Destrutivos · Inspeções e Laudos Técnicos
          </p>
        </div>
        <div className="my-4 h-px w-full bg-border" />
      </div>

      {/* Cover image area */}
      {dadosCapa.fotoCapaUrl ? (
        <div className="group relative my-4 h-[120mm] w-full overflow-hidden rounded">
          <img
            src={dadosCapa.fotoCapaUrl}
            alt="Foto da capa"
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => onUpdate({ ...dadosCapa, fotoCapaUrl: undefined })}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="my-4 flex h-[120mm] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50">
          <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Clique para adicionar foto da capa</p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                  const MAX = 1200;
                  let w = img.width, h = img.height;
                  if (w > MAX || h > MAX) {
                    const ratio = Math.min(MAX / w, MAX / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                  }
                  const canvas = document.createElement('canvas');
                  canvas.width = w;
                  canvas.height = h;
                  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                  const compressed = canvas.toDataURL('image/jpeg', 0.7);
                  URL.revokeObjectURL(url);
                  onUpdate({ ...dadosCapa, fotoCapaUrl: compressed });
                };
                img.src = url;
              }
            }}
          />
        </label>
      )}

      {/* Title block */}
      <div className="my-6 w-full text-center">
        <h2
          className="text-lg font-bold leading-tight"
          style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}
        >
          LAUDO TÉCNICO CAUTELAR DE<br />
          VISTORIA DE LINDEIROS
        </h2>
        <p className="mt-3 text-sm text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
          Volume{' '}
          <input
            type="number"
            value={dadosCapa.volumeAtual}
            onChange={(e) => handleChange('volumeAtual', parseInt(e.target.value) || 1)}
            className="inline-block w-10 border-b border-muted-foreground/30 bg-transparent text-center text-sm focus:outline-none"
          />
          {' de '}
          <input
            type="number"
            value={dadosCapa.totalVolumes}
            onChange={(e) => handleChange('totalVolumes', parseInt(e.target.value) || 1)}
            className="inline-block w-10 border-b border-muted-foreground/30 bg-transparent text-center text-sm focus:outline-none"
          />
        </p>
      </div>

      {/* Editable fields */}
      <div className="w-full space-y-3" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center gap-2">
          <span className="w-32 text-xs font-semibold uppercase text-muted-foreground">Empreendimento:</span>
          <Input
            value={dadosCapa.empreendimento}
            onChange={(e) => handleChange('empreendimento', e.target.value)}
            placeholder="Nome do empreendimento"
            className="h-8 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32 text-xs font-semibold uppercase text-muted-foreground">Local da Obra:</span>
          <Input
            value={dadosCapa.localObra}
            onChange={(e) => handleChange('localObra', e.target.value)}
            placeholder="Endereço completo"
            className="h-8 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32 text-xs font-semibold uppercase text-muted-foreground">Solicitante:</span>
          <Input
            value={dadosCapa.solicitante}
            onChange={(e) => handleChange('solicitante', e.target.value)}
            placeholder="Nome do solicitante"
            className="h-8 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32 text-xs font-semibold uppercase text-muted-foreground">CNPJ:</span>
          <Input
            value={dadosCapa.cnpj}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
            className="h-8 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto w-full pt-6">
        <div className="h-px w-full bg-border" />
        <p className="mt-2 text-center text-[8pt] text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
          Este laudo é de uso exclusivo do solicitante, não podendo ser reproduzido parcial ou totalmente sem autorização.
        </p>
      </div>
    </div>
  );
}
