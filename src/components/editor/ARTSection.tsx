import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ZoomIn, Pencil } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';
import { toast } from '@/hooks/use-toast';
import { ImageAnnotator } from './ImageAnnotator';
import { RichTextEditor } from './RichTextEditor';

interface ARTSectionProps {
  images: string[];
  onUpdate: (images: string[]) => void;
  richText?: string;
  onRichTextUpdate?: (html: string) => void;
}

export function ARTSection({ images, onUpdate, richText, onRichTextUpdate }: ARTSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `art/${crypto.randomUUID()}.jpg`;
      const url = await uploadImage(file, path);
      onUpdate([...images, url]);
      toast({ title: 'ART adicionada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: String(err), variant: 'destructive' });
    } finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <div className="space-y-4">
      <div className="a4-page mb-4">
        <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
          ART - ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA
        </h2>

        <div className="space-y-4">
          {images.map((url, i) => (
            <div key={i} className="relative rounded-lg border p-3">
              <div className="relative">
                <img src={url} alt={`ART ${i + 1}`} className="w-full cursor-pointer rounded object-contain" style={{ maxHeight: '500px' }} onClick={() => setAnnotatingIndex(i)} title="Clique para editar/anotar" />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button className="flex h-7 w-7 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80" onClick={e => { e.stopPropagation(); setLightbox(url); }} title="Ampliar"><ZoomIn className="h-4 w-4" /></button>
                </div>
                <button className="absolute left-2 top-2 rounded bg-primary p-1 text-primary-foreground hover:bg-primary/80" onClick={e => { e.stopPropagation(); setAnnotatingIndex(i); }} title="Anotar"><Pencil className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ART - Página {i + 1}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onUpdate(images.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="gap-2" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <Plus className="h-4 w-4" />
              {uploading ? 'Enviando...' : 'Adicionar Imagem da ART'}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </Button>
        </div>
      </div>

      {/* Always show RichTextEditor */}
      {onRichTextUpdate && (
        <RichTextEditor
          content={richText || ''}
          onUpdate={onRichTextUpdate}
          placeholder="Descreva a ART ou importe um arquivo Word..."
          minHeight="300px"
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="ART ampliada" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      {annotatingIndex !== null && images[annotatingIndex] && (
        <ImageAnnotator imageUrl={images[annotatingIndex]} onCancel={() => setAnnotatingIndex(null)} onSave={(dataUrl) => { onUpdate(images.map((u, i) => i === annotatingIndex ? dataUrl : u)); setAnnotatingIndex(null); }} />
      )}
    </div>
  );
}
