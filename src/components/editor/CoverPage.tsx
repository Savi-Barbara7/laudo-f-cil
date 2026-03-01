import { useCallback, useState } from 'react';
import type { DadosCapa } from '@/types/laudo';
import { Input } from '@/components/ui/input';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';

interface CoverPageProps {
  dadosCapa: DadosCapa;
  onUpdate: (data: DadosCapa) => void;
}

export function CoverPage({ dadosCapa, onUpdate }: CoverPageProps) {
  const [uploading, setUploading] = useState(false);

  const handleChange = useCallback(
    (field: keyof DadosCapa, value: string | number) => {
      onUpdate({ ...dadosCapa, [field]: value });
    },
    [dadosCapa, onUpdate]
  );

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `capas/${crypto.randomUUID()}.jpg`;
      const publicUrl = await uploadImage(file, path);
      onUpdate({ ...dadosCapa, fotoCapaUrl: publicUrl });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const fields: { key: keyof DadosCapa; label: string; placeholder: string }[] = [
    { key: 'empreendimento', label: 'Empreendimento', placeholder: 'Nome do empreendimento' },
    { key: 'localObra', label: 'Local da Obra', placeholder: 'Endereço completo da obra' },
    { key: 'solicitante', label: 'Solicitante', placeholder: 'Nome da empresa contratante' },
    { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
    { key: 'datasVistorias', label: 'Datas das Vistorias', placeholder: 'Ex: 10/01/2025, 11/01/2025' },
    { key: 'terrenoBenfeitorias', label: 'Terreno / Benfeitorias', placeholder: 'Ex: sem benfeitorias / com benfeitorias a demolir' },
  ];

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
        <div className="group relative my-4 h-[100mm] w-full overflow-hidden rounded">
          <img src={dadosCapa.fotoCapaUrl} alt="Foto da capa" className="h-full w-full object-cover" />
          <button
            onClick={() => onUpdate({ ...dadosCapa, fotoCapaUrl: undefined })}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="my-4 flex h-[100mm] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-muted-foreground/20 bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Enviando...' : 'Clique para adicionar foto da capa'}
          </p>
          <input
            type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCoverUpload(file); }}
          />
        </label>
      )}

      {/* Title block */}
      <div className="my-4 w-full text-center">
        <h2 className="text-lg font-bold leading-tight" style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}>
          LAUDO TÉCNICO CAUTELAR DE<br />
          VISTORIA DE LINDEIROS
        </h2>
        <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
          Volume{' '}
          <input
            type="number" value={dadosCapa.volumeAtual}
            onChange={(e) => handleChange('volumeAtual', parseInt(e.target.value) || 1)}
            className="inline-block w-10 border-b border-muted-foreground/30 bg-transparent text-center text-sm focus:outline-none"
          />
          {' de '}
          <input
            type="number" value={dadosCapa.totalVolumes}
            onChange={(e) => handleChange('totalVolumes', parseInt(e.target.value) || 1)}
            className="inline-block w-10 border-b border-muted-foreground/30 bg-transparent text-center text-sm focus:outline-none"
          />
        </p>
      </div>

      {/* Editable fields */}
      <div className="w-full space-y-2" style={{ fontFamily: 'Arial, sans-serif' }}>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="flex items-center gap-2 border-b border-muted/40 pb-1">
            <span className="w-36 shrink-0 text-[9pt] font-semibold uppercase text-muted-foreground">{label}:</span>
            <Input
              value={(dadosCapa[key] as string) || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="h-7 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-1 px-0"
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto w-full pt-4">
        <div className="h-px w-full bg-border" />
        <p className="mt-2 text-center text-[8pt] text-muted-foreground" style={{ fontFamily: 'Arial, sans-serif' }}>
          Este laudo é de uso exclusivo do solicitante, não podendo ser reproduzido parcial ou totalmente sem autorização.
        </p>
      </div>
    </div>
  );
}
