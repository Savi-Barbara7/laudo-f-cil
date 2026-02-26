import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FolderOpen, ZoomIn, ImagePlus, Pencil, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';
import type { Documentacao } from '@/types/laudo';
import { toast } from '@/hooks/use-toast';
import { ImageAnnotator } from './ImageAnnotator';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/integrations/supabase/client';

interface FichasSectionProps {
  fichas: Documentacao[];
  onUpdate: (docs: Documentacao[]) => void;
  richText?: string;
  onRichTextUpdate?: (html: string) => void;
}

async function pdfToImages(file: File): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const urls: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 150 / 72;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
    );
    const path = `fichas/${crypto.randomUUID()}.jpg`;
    const { data, error } = await supabase.storage
      .from('laudo-fotos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('laudo-fotos').getPublicUrl(data.path);
    urls.push(urlData.publicUrl);
  }

  return urls;
}

export function FichasSection({ fichas, onUpdate, richText, onRichTextUpdate }: FichasSectionProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [annotating, setAnnotating] = useState<{ docId: string; imgIndex: number; url: string } | null>(null);

  const handleAddDoc = () => {
    const nova: Documentacao = { id: crypto.randomUUID(), nome: '', imagens: [] };
    onUpdate([...fichas, nova]);
  };

  const handleRemoveDoc = (id: string) => onUpdate(fichas.filter(d => d.id !== id));
  const handleNomeChange = (id: string, nome: string) => onUpdate(fichas.map(d => d.id === id ? { ...d, nome } : d));

  const handleUploadFile = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(docId);
    try {
      let urls: string[];
      if (file.type === 'application/pdf') {
        urls = await pdfToImages(file);
        toast({ title: `${urls.length} página(s) do PDF inseridas!` });
      } else {
        const path = `fichas/${crypto.randomUUID()}.jpg`;
        const url = await uploadImage(file, path);
        urls = [url];
        toast({ title: 'Ficha adicionada!' });
      }
      onUpdate(fichas.map(d =>
        d.id === docId ? { ...d, imagens: [...d.imagens, ...urls] } : d
      ));
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: String(err), variant: 'destructive' });
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleRemoveImagem = (docId: string, imgIndex: number) => {
    onUpdate(fichas.map(d =>
      d.id === docId ? { ...d, imagens: d.imagens.filter((_, i) => i !== imgIndex) } : d
    ));
  };

  return (
    <div className="space-y-4">
      <div className="a4-page mb-4">
        <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
          FICHAS DE VISTORIA
        </h2>

        {fichas.length === 0 && !richText && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <p className="mb-2 text-muted-foreground">Nenhuma ficha adicionada</p>
            <p className="mb-4 text-xs text-muted-foreground">Adicione fichas de vistoria (imagens ou PDF)</p>
          </div>
        )}

        <div className="space-y-6">
          {fichas.map((doc) => (
            <div key={doc.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Título / Descrição da Ficha</Label>
                  <Input value={doc.nome} onChange={e => handleNomeChange(doc.id, e.target.value)} placeholder="Ex: Ficha de Vistoria Técnica" />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveDoc(doc.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {doc.imagens.map((url, ii) => (
                  <div key={ii} className="relative rounded border group">
                    <img src={url} alt={`Ficha ${ii + 1}`} className="w-full cursor-pointer rounded object-contain" style={{ maxHeight: '300px' }} onClick={() => setAnnotating({ docId: doc.id, imgIndex: ii, url })} title="Clique para editar/anotar" />
                    <div className="absolute right-1 top-1 flex gap-1">
                      <button className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80" onClick={e => { e.stopPropagation(); setLightbox(url); }} title="Ampliar"><ZoomIn className="h-3 w-3" /></button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={() => handleRemoveImagem(doc.id, ii)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <button className="absolute left-1 top-1 rounded bg-primary p-0.5 text-primary-foreground hover:bg-primary/80" onClick={e => { e.stopPropagation(); setAnnotating({ docId: doc.id, imgIndex: ii, url }); }} title="Anotar imagem"><Pencil className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" className="gap-1" disabled={uploading === doc.id} asChild>
                  <label className="cursor-pointer">
                    {uploading === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    {uploading === doc.id ? 'Processando...' : 'Adicionar Ficha (Imagem/PDF)'}
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleUploadFile(doc.id, e)} />
                  </label>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline" className="gap-2" onClick={handleAddDoc}><Plus className="h-4 w-4" />Adicionar Ficha</Button>
        </div>
      </div>

      {onRichTextUpdate && (
        <RichTextEditor
          content={richText || ''}
          onUpdate={onRichTextUpdate}
          placeholder="Conteúdo adicional ou importado do Word..."
          minHeight="300px"
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Ficha ampliada" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      {annotating && (
        <ImageAnnotator
          imageUrl={annotating.url}
          onCancel={() => setAnnotating(null)}
          onSave={(dataUrl) => {
            const { docId, imgIndex } = annotating;
            onUpdate(fichas.map(d => d.id === docId ? { ...d, imagens: d.imagens.map((url, i) => i === imgIndex ? dataUrl : url) } : d));
            setAnnotating(null);
          }}
        />
      )}
    </div>
  );
}
