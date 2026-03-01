import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ZoomIn, Pencil, ClipboardPaste } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';
import type { CroquiImage } from '@/types/laudo';
import { toast } from '@/hooks/use-toast';
import { ImageAnnotator } from './ImageAnnotator';
import { RichTextEditor } from './RichTextEditor';

interface CroquiSectionProps {
  images: CroquiImage[];
  onUpdate: (images: CroquiImage[]) => void;
  richText?: string;
  onRichTextUpdate?: (html: string) => void;
}

export function CroquiSection({ images, onUpdate, richText, onRichTextUpdate }: CroquiSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `croqui/${crypto.randomUUID()}.jpg`;
      const url = await uploadImage(file, path);
      const nova: CroquiImage = { id: crypto.randomUUID(), url, legenda: '' };
      onUpdate([...images, nova]);
      toast({ title: 'Imagem adicionada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar imagem', description: String(err), variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Paste image from clipboard
  const handlePasteImage = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setPasting(true);
        try {
          const path = `croqui/${crypto.randomUUID()}.jpg`;
          const url = await uploadImage(file, path);
          const nova: CroquiImage = { id: crypto.randomUUID(), url, legenda: '' };
          onUpdate([...images, nova]);
          toast({ title: 'Imagem colada com sucesso!' });
        } catch (err) {
          toast({ title: 'Erro ao colar imagem', description: String(err), variant: 'destructive' });
        } finally {
          setPasting(false);
        }
        break;
      }
    }
  }, [images, onUpdate]);

  useEffect(() => {
    document.addEventListener('paste', handlePasteImage);
    return () => document.removeEventListener('paste', handlePasteImage);
  }, [handlePasteImage]);

  const handleRemove = (id: string) => onUpdate(images.filter(img => img.id !== id));
  const handleLegendaChange = (id: string, legenda: string) => onUpdate(images.map(img => img.id === id ? { ...img, legenda } : img));

  return (
    <div className="space-y-4">
      <div className="a4-page mb-4">
        <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
          CROQUI DE LOCALIZAÇÃO
        </h2>

        {/* Paste hint */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <ClipboardPaste className="h-4 w-4 text-primary/60 flex-shrink-0" />
          <span>
            <strong className="text-foreground">Dica:</strong> Cole uma imagem diretamente com <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Ctrl+V</kbd> ou use o botão abaixo para carregar do disco.
            {pasting && <span className="ml-2 text-primary animate-pulse">Processando imagem colada...</span>}
          </span>
        </div>

        {/* Images */}
        <div className="space-y-6">
          {images.map((img, i) => (
            <div key={img.id} className="rounded-lg border p-4">
              <div className="relative mb-3">
                <img
                  src={img.url}
                  alt={`Croqui ${i + 1}`}
                  className="w-full cursor-pointer rounded object-contain"
                  style={{ maxHeight: '500px' }}
                  onClick={() => setAnnotatingIndex(i)}
                  title="Clique para editar/anotar"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80"
                    onClick={e => { e.stopPropagation(); setLightbox(img.url); }}
                    title="Ampliar"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
                <button
                  className="absolute left-2 top-2 rounded bg-primary p-1 text-primary-foreground hover:bg-primary/80"
                  onClick={e => { e.stopPropagation(); setAnnotatingIndex(i); }}
                  title="Anotar imagem"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Legenda</Label>
                  <Input
                    value={img.legenda}
                    onChange={e => handleLegendaChange(img.id, e.target.value)}
                    placeholder="Ex: Croqui de localização"
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemove(img.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" className="gap-2" disabled={uploading || pasting} asChild>
            <label className="cursor-pointer">
              <Plus className="h-4 w-4" />
              {uploading ? 'Enviando...' : 'Adicionar do Disco'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={pasting}
            onClick={async () => {
              try {
                const clipItems = await navigator.clipboard.read();
                for (const clipItem of clipItems) {
                  const imgType = clipItem.types.find(t => t.startsWith('image/'));
                  if (imgType) {
                    const blob = await clipItem.getType(imgType);
                    const file = new File([blob], 'paste.png', { type: imgType });
                    setPasting(true);
                    const path = `croqui/${crypto.randomUUID()}.jpg`;
                    const url = await uploadImage(file, path);
                    const nova: CroquiImage = { id: crypto.randomUUID(), url, legenda: '' };
                    onUpdate([...images, nova]);
                    toast({ title: 'Imagem colada com sucesso!' });
                    setPasting(false);
                    break;
                  }
                }
              } catch {
                toast({ title: 'Use Ctrl+V para colar', description: 'Clique na página e pressione Ctrl+V', variant: 'destructive' });
              }
            }}
          >
            <ClipboardPaste className="h-4 w-4" />
            {pasting ? 'Processando...' : 'Colar Imagem'}
          </Button>
        </div>
      </div>

      {/* Always show RichTextEditor */}
      {onRichTextUpdate && (
        <RichTextEditor
          content={richText || ''}
          onUpdate={onRichTextUpdate}
          placeholder="Descreva o croqui de localização ou importe um arquivo Word..."
          minHeight="300px"
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Croqui ampliado" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      {annotatingIndex !== null && images[annotatingIndex] && (
        <ImageAnnotator
          imageUrl={images[annotatingIndex].url}
          onCancel={() => setAnnotatingIndex(null)}
          onSave={(dataUrl) => {
            onUpdate(images.map((img, i) => i === annotatingIndex ? { ...img, url: dataUrl } : img));
            setAnnotatingIndex(null);
          }}
        />
      )}
    </div>
  );
}
