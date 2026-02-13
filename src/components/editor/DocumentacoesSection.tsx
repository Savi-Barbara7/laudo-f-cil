import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FolderOpen, ZoomIn, ImagePlus, Pencil } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';
import type { Documentacao } from '@/types/laudo';
import { toast } from '@/hooks/use-toast';
import { ImageAnnotator } from './ImageAnnotator';

interface DocumentacoesSectionProps {
  documentacoes: Documentacao[];
  onUpdate: (docs: Documentacao[]) => void;
}

export function DocumentacoesSection({ documentacoes, onUpdate }: DocumentacoesSectionProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [annotating, setAnnotating] = useState<{ docId: string; imgIndex: number; url: string } | null>(null);

  const handleAddDoc = () => {
    const nova: Documentacao = { id: crypto.randomUUID(), nome: '', imagens: [] };
    onUpdate([...documentacoes, nova]);
  };

  const handleRemoveDoc = (id: string) => {
    onUpdate(documentacoes.filter(d => d.id !== id));
  };

  const handleNomeChange = (id: string, nome: string) => {
    onUpdate(documentacoes.map(d => d.id === id ? { ...d, nome } : d));
  };

  const handleUploadImagem = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(docId);
    try {
      const path = `documentacoes/${crypto.randomUUID()}.jpg`;
      const url = await uploadImage(file, path);
      onUpdate(documentacoes.map(d =>
        d.id === docId ? { ...d, imagens: [...d.imagens, url] } : d
      ));
      toast({ title: 'Ficha adicionada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: String(err), variant: 'destructive' });
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleRemoveImagem = (docId: string, imgIndex: number) => {
    onUpdate(documentacoes.map(d =>
      d.id === docId ? { ...d, imagens: d.imagens.filter((_, i) => i !== imgIndex) } : d
    ));
  };

  return (
    <div className="a4-page mb-8">
      <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
        DOCUMENTAÇÕES
      </h2>

      {documentacoes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/40" />
          <p className="mb-2 text-muted-foreground">Nenhuma documentação adicionada</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Adicione fichas de vistoria técnica quando disponíveis
          </p>
        </div>
      )}

      <div className="space-y-6">
        {documentacoes.map((doc) => (
          <div key={doc.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Título / Descrição da Documentação</Label>
                <Input
                  value={doc.nome}
                  onChange={(e) => handleNomeChange(doc.id, e.target.value)}
                  placeholder="Ex: Ficha de Vistoria Técnica - PAVILHÃO COMERCIAL - Av. Victor Kunz, 2740"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveDoc(doc.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {doc.imagens.map((url, ii) => (
                <div key={ii} className="relative rounded border group">
                  <div className="cursor-pointer" onClick={() => setLightbox(url)}>
                    <img src={url} alt={`Ficha ${ii + 1}`} className="w-full rounded object-contain" style={{ maxHeight: '300px' }} />
                    <div className="absolute right-1 top-1 rounded bg-black/50 p-0.5">
                      <ZoomIn className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <button
                    className="absolute left-1 top-1 hidden rounded bg-primary p-0.5 text-primary-foreground group-hover:block"
                    onClick={() => setAnnotating({ docId: doc.id, imgIndex: ii, url })}
                    title="Anotar imagem"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <Button
                    variant="ghost" size="icon"
                    className="absolute bottom-1 right-1 h-6 w-6 bg-background/80 text-destructive"
                    onClick={() => handleRemoveImagem(doc.id, ii)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-center">
              <Button variant="outline" size="sm" className="gap-1" disabled={uploading === doc.id} asChild>
                <label className="cursor-pointer">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploading === doc.id ? 'Enviando...' : 'Adicionar Ficha'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadImagem(doc.id, e)} />
                </label>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" className="gap-2" onClick={handleAddDoc}>
          <Plus className="h-4 w-4" />
          Adicionar Documentação
        </Button>
      </div>

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
            onUpdate(documentacoes.map(d =>
              d.id === docId ? { ...d, imagens: d.imagens.map((url, i) => i === imgIndex ? dataUrl : url) } : d
            ));
            setAnnotating(null);
          }}
        />
      )}
    </div>
  );
}
