import { useState } from 'react';
import type { CanteiroVolume, FotoCategoria } from '@/types/laudo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ImagePlus, X, Loader2, ZoomIn } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';
import { PhotoLightbox } from './PhotoLightbox';

const CATEGORIAS: { value: FotoCategoria['categoria']; label: string; color: string }[] = [
  { value: 'canteiro', label: 'Canteiro', color: 'bg-primary/10 text-primary border-primary/30' },
  { value: 'entorno', label: 'Entorno', color: 'bg-success/10 text-success border-success/30' },
  { value: 'drone', label: 'Drone', color: 'bg-accent/10 text-accent border-accent/30' },
];

interface CanteiroSectionProps {
  canteiro: CanteiroVolume;
  onUpdate: (c: CanteiroVolume) => void;
}

export function CanteiroSection({ canteiro, onUpdate }: CanteiroSectionProps) {
  const [uploading, setUploading] = useState<FotoCategoria['categoria'] | null>(null);
  const [activeCat, setActiveCat] = useState<FotoCategoria['categoria']>('canteiro');
  const [lightbox, setLightbox] = useState<{ index: number; cat: FotoCategoria['categoria'] } | null>(null);

  const fotosPorCat = (cat: FotoCategoria['categoria']) =>
    canteiro.fotos.filter(f => f.categoria === cat);

  const handleUpload = async (cat: FotoCategoria['categoria'], files: FileList) => {
    setUploading(cat);
    try {
      const fotos = [...canteiro.fotos];
      const existentes = fotos.filter(f => f.categoria === cat).length;
      const uploads = Array.from(files).map(async (file, i) => {
        const path = `canteiro/${crypto.randomUUID()}.jpg`;
        const url = await uploadImage(file, path);
        return {
          id: crypto.randomUUID(),
          dataUrl: url,
          legenda: `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${existentes + i + 1}`,
          ordem: existentes + i,
          categoria: cat,
        } as FotoCategoria;
      });
      const novas = await Promise.all(uploads);
      onUpdate({ ...canteiro, fotos: [...fotos, ...novas] });
    } finally {
      setUploading(null);
    }
  };

  const removeFoto = (id: string) => {
    onUpdate({ ...canteiro, fotos: canteiro.fotos.filter(f => f.id !== id) });
  };

  const updateLegenda = (id: string, legenda: string) => {
    onUpdate({ ...canteiro, fotos: canteiro.fotos.map(f => f.id === id ? { ...f, legenda } : f) });
  };

  const getLightboxImages = (cat: FotoCategoria['categoria']) =>
    fotosPorCat(cat).map(f => ({ url: f.dataUrl, label: f.legenda }));

  return (
    <div className="space-y-6">
      <div className="a4-page mb-4">
        <h2 className="mb-4 text-base font-bold text-center uppercase"
          style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}>
          VOLUME 1 — CANTEIRO DE OBRAS / ENTORNO / DRONE
        </h2>

        {/* Dados gerais */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Endereço do Canteiro</label>
            <Input
              value={canteiro.endereco}
              onChange={e => onUpdate({ ...canteiro, endereco: e.target.value })}
              placeholder="Rua Exemplo, 123 — Cidade/UF"
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Data da Vistoria</label>
            <Input
              value={canteiro.dataVistoria}
              onChange={e => onUpdate({ ...canteiro, dataVistoria: e.target.value })}
              placeholder="DD/MM/AAAA"
              className="h-8 text-sm mt-1"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground">Estado de Conservação</label>
              <div className="mt-1 h-8 flex items-center">
                <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-muted-foreground/20">
                  N/A — Canteiro de Obras
                </Badge>
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Características Gerais</label>
            <Textarea
              value={canteiro.caracteristicasGerais}
              onChange={e => onUpdate({ ...canteiro, caracteristicasGerais: e.target.value })}
              placeholder="Descreva as características gerais do canteiro de obras, entorno e condições observadas..."
              className="mt-1 min-h-[140px] resize-y text-sm"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>
        </div>

        {/* Abas de categorias */}
        <div className="flex gap-2 mb-4">
          {CATEGORIAS.map(cat => {
            const count = fotosPorCat(cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCat(cat.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  activeCat === cat.value
                    ? cat.color + ' font-semibold shadow-sm'
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {cat.label}
                <span className="ml-1 tabular-nums opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Fotos da categoria ativa */}
        {CATEGORIAS.filter(c => c.value === activeCat).map(cat => {
          const fotos = fotosPorCat(cat.value);
          return (
            <div key={cat.value}>
              {fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {fotos.map((foto, fi) => (
                    <div key={foto.id} className="group relative">
                      <img
                        src={foto.dataUrl}
                        alt={foto.legenda}
                        className="h-32 w-full cursor-pointer rounded border object-cover hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onClick={() => setLightbox({ index: fi, cat: cat.value })}
                      />
                      <div className="absolute right-1 top-1 flex gap-1">
                        <button
                          onClick={() => setLightbox({ index: fi, cat: cat.value })}
                          className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
                          title="Ampliar"
                        >
                          <ZoomIn className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFoto(foto.id)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-destructive text-destructive-foreground hover:bg-destructive/80"
                          title="Excluir"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <Input
                        value={foto.legenda}
                        onChange={e => updateLegenda(foto.id, e.target.value)}
                        className="mt-1 h-6 text-[9pt]"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-muted-foreground/30 p-2 text-xs text-muted-foreground hover:bg-muted/40">
                {uploading === cat.value
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ImagePlus className="h-4 w-4" />}
                {uploading === cat.value ? 'Enviando...' : `Adicionar fotos — ${cat.label}`}
                <input
                  type="file" multiple accept="image/*" className="hidden"
                  disabled={uploading === cat.value}
                  onChange={e => e.target.files && handleUpload(cat.value, e.target.files)}
                />
              </label>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          images={getLightboxImages(lightbox.cat)}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={idx => setLightbox({ ...lightbox, index: idx })}
        />
      )}
    </div>
  );
}
