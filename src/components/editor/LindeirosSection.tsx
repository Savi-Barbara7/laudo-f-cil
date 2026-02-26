import { useState } from 'react';
import type { Lindeiro, Ambiente, Foto } from '@/types/laudo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ImagePlus, X, Loader2, Pencil, ZoomIn } from 'lucide-react';
import { uploadImage } from '@/lib/storageHelper';
import { ImageAnnotator } from './ImageAnnotator';
import { PhotoLightbox } from './PhotoLightbox';

interface LindeirosProps {
  lindeiros: Lindeiro[];
  onUpdate: (lindeiros: Lindeiro[]) => void;
}

export function LindeirosSection({ lindeiros, onUpdate }: LindeirosProps) {
  const [uploadingAmb, setUploadingAmb] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ lindIndex: number; ambIndex: number; fotoIndex: number } | null>(null);
  const [annotating, setAnnotating] = useState<{ lindIndex: number; ambIndex: number; fotoIndex: number; url: string } | null>(null);

  const addLindeiro = () => {
    const novo: Lindeiro = {
      id: crypto.randomUUID(), tipoImovel: 'Casa', tipoUso: 'Residencial',
      endereco: '', responsavel: '', telefone: '', dataVistoria: '',
      descricao: '', estadoConservacao: 'Bom', ambientes: [],
    };
    onUpdate([...lindeiros, novo]);
  };

  const updateLindeiro = (index: number, updates: Partial<Lindeiro>) => {
    onUpdate(lindeiros.map((l, i) => (i === index ? { ...l, ...updates } : l)));
  };

  const removeLindeiro = (index: number) => onUpdate(lindeiros.filter((_, i) => i !== index));

  const addAmbiente = (lindIndex: number) => {
    const amb: Ambiente = { id: crypto.randomUUID(), nome: '', fotos: [] };
    const updated = [...lindeiros];
    updated[lindIndex] = { ...updated[lindIndex], ambientes: [...updated[lindIndex].ambientes, amb] };
    onUpdate(updated);
  };

  const removeAmbiente = (lindIndex: number, ambIndex: number) => {
    const updated = [...lindeiros];
    updated[lindIndex] = { ...updated[lindIndex], ambientes: updated[lindIndex].ambientes.filter((_, i) => i !== ambIndex) };
    onUpdate(updated);
  };

  const updateAmbienteNome = (lindIndex: number, ambIndex: number, nome: string) => {
    const updated = [...lindeiros];
    const ambs = [...updated[lindIndex].ambientes];
    ambs[ambIndex] = { ...ambs[ambIndex], nome };
    updated[lindIndex] = { ...updated[lindIndex], ambientes: ambs };
    onUpdate(updated);
  };

  const handleFotoUpload = async (lindIndex: number, ambIndex: number, files: FileList) => {
    const ambId = lindeiros[lindIndex].ambientes[ambIndex].id;
    setUploadingAmb(ambId);
    try {
      const updated = [...lindeiros];
      const ambs = [...updated[lindIndex].ambientes];
      const fotos = [...ambs[ambIndex].fotos];
      const startCount = fotos.length;

      const uploads = Array.from(files).map(async (file, i) => {
        const path = `lindeiros/${lindeiros[lindIndex].id}/${ambId}/${crypto.randomUUID()}.jpg`;
        const publicUrl = await uploadImage(file, path);
        return { id: crypto.randomUUID(), dataUrl: publicUrl, legenda: `Foto ${startCount + i + 1}`, ordem: startCount + i } as Foto;
      });

      const newFotos = await Promise.all(uploads);
      fotos.push(...newFotos);
      ambs[ambIndex] = { ...ambs[ambIndex], fotos: [...fotos] };
      updated[lindIndex] = { ...updated[lindIndex], ambientes: [...ambs] };
      onUpdate([...updated]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingAmb(null);
    }
  };

  const handleInsertFotoAt = async (lindIndex: number, ambIndex: number, insertAt: number, files: FileList) => {
    const ambId = lindeiros[lindIndex].ambientes[ambIndex].id;
    setUploadingAmb(ambId);
    try {
      const updated = [...lindeiros];
      const ambs = [...updated[lindIndex].ambientes];
      const fotos = [...ambs[ambIndex].fotos];

      const uploads = Array.from(files).map(async (file, i) => {
        const path = `lindeiros/${lindeiros[lindIndex].id}/${ambId}/${crypto.randomUUID()}.jpg`;
        const publicUrl = await uploadImage(file, path);
        return { id: crypto.randomUUID(), dataUrl: publicUrl, legenda: `Foto ${insertAt + i + 1}`, ordem: insertAt + i } as Foto;
      });

      const newFotos = await Promise.all(uploads);
      fotos.splice(insertAt, 0, ...newFotos);
      fotos.forEach((f, i) => { f.ordem = i; });

      ambs[ambIndex] = { ...ambs[ambIndex], fotos };
      updated[lindIndex] = { ...updated[lindIndex], ambientes: ambs };
      onUpdate([...updated]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingAmb(null);
    }
  };

  const removeFoto = (lindIndex: number, ambIndex: number, fotoIndex: number) => {
    const updated = [...lindeiros];
    const ambs = [...updated[lindIndex].ambientes];
    ambs[ambIndex] = { ...ambs[ambIndex], fotos: ambs[ambIndex].fotos.filter((_, i) => i !== fotoIndex) };
    updated[lindIndex] = { ...updated[lindIndex], ambientes: ambs };
    onUpdate(updated);
  };

  const updateFotoLegenda = (lindIndex: number, ambIndex: number, fotoIndex: number, legenda: string) => {
    const updated = [...lindeiros];
    const ambs = [...updated[lindIndex].ambientes];
    const fotos = [...ambs[ambIndex].fotos];
    fotos[fotoIndex] = { ...fotos[fotoIndex], legenda };
    ambs[ambIndex] = { ...ambs[ambIndex], fotos };
    updated[lindIndex] = { ...updated[lindIndex], ambientes: ambs };
    onUpdate(updated);
  };

  // Get all photos for a specific ambiente for lightbox navigation
  const getLightboxImages = () => {
    if (!lightbox) return [];
    const amb = lindeiros[lightbox.lindIndex]?.ambientes[lightbox.ambIndex];
    if (!amb) return [];
    return amb.fotos.map(f => ({ url: f.dataUrl, label: f.legenda }));
  };

  // Get all photos for annotator navigation
  const getAnnotatorPhotos = () => {
    if (!annotating) return { fotos: [] as Foto[], total: 0 };
    const amb = lindeiros[annotating.lindIndex]?.ambientes[annotating.ambIndex];
    return { fotos: amb?.fotos || [], total: amb?.fotos.length || 0 };
  };

  return (
    <div>
      {/* Lightbox with navigation */}
      {lightbox && (
        <PhotoLightbox
          images={getLightboxImages()}
          currentIndex={lightbox.fotoIndex}
          onClose={() => setLightbox(null)}
          onNavigate={(idx) => setLightbox({ ...lightbox, fotoIndex: idx })}
        />
      )}

      {lindeiros.map((lind, li) => (
        <div key={lind.id} className="a4-page mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}>
              LINDEIRO {li + 1}: {lind.tipoImovel.toUpperCase()} {lind.tipoUso.toUpperCase()}
            </h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLindeiro(li)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tipo do Imóvel</label>
              <Select value={lind.tipoImovel} onValueChange={(v) => updateLindeiro(li, { tipoImovel: v as Lindeiro['tipoImovel'] })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Casa', 'Prédio', 'Condomínio', 'Loja', 'Galpão', 'Terreno', 'Outro'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Uso</label>
              <Select value={lind.tipoUso} onValueChange={(v) => updateLindeiro(li, { tipoUso: v as Lindeiro['tipoUso'] })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Residencial', 'Comercial', 'Misto', 'Industrial', 'Público'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Endereço</label>
              <Input value={lind.endereco} onChange={(e) => updateLindeiro(li, { endereco: e.target.value })} placeholder="Rua Exemplo, 123" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Data Vistoria</label>
              <Input value={lind.dataVistoria} onChange={(e) => updateLindeiro(li, { dataVistoria: e.target.value })} placeholder="DD/MM/AAAA" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Acompanhante</label>
              <Input value={lind.responsavel} onChange={(e) => updateLindeiro(li, { responsavel: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Telefone</label>
              <Input value={lind.telefone} onChange={(e) => updateLindeiro(li, { telefone: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Estado de Conservação</label>
              <Select value={lind.estadoConservacao} onValueChange={(v) => updateLindeiro(li, { estadoConservacao: v as Lindeiro['estadoConservacao'] })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Bom', 'Regular', 'Ruim', 'Novo'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Descrição Geral</label>
            <Textarea value={lind.descricao} onChange={(e) => updateLindeiro(li, { descricao: e.target.value })} className="mt-1 min-h-[200px] resize-y text-sm" style={{ fontFamily: 'Arial, sans-serif' }} />
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Ambientes e Fotos</h3>
              <Button variant="outline" size="sm" onClick={() => addAmbiente(li)} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Ambiente
              </Button>
            </div>

            {lind.ambientes.map((amb, ai) => (
              <div key={amb.id} className="rounded border bg-muted/20 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input value={amb.nome} onChange={(e) => updateAmbienteNome(li, ai, e.target.value)} placeholder="Nome do ambiente (ex: Fachada Frontal)" className="h-7 flex-1 text-sm" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAmbiente(li, ai)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {amb.fotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {amb.fotos.map((foto, fi) => (
                      <div key={foto.id} className="group relative">
                        <img src={foto.dataUrl} alt={foto.legenda} className="h-32 w-full cursor-pointer rounded border object-cover transition-opacity hover:opacity-90" loading="lazy" onClick={() => setAnnotating({ lindIndex: li, ambIndex: ai, fotoIndex: fi, url: foto.dataUrl })} title="Clique para editar/anotar" />
                        <div className="absolute right-1 top-1 flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setLightbox({ lindIndex: li, ambIndex: ai, fotoIndex: fi }); }} className="flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80" title="Ampliar">
                            <ZoomIn className="h-3 w-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeFoto(li, ai, fi); }} className="flex h-6 w-6 items-center justify-center rounded bg-destructive text-destructive-foreground hover:bg-destructive/80" title="Excluir foto">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setAnnotating({ lindIndex: li, ambIndex: ai, fotoIndex: fi, url: foto.dataUrl }); }} className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/80" title="Anotar foto">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <div className="mt-1 flex items-center gap-1">
                          <Input value={foto.legenda} onChange={(e) => updateFotoLegenda(li, ai, fi, e.target.value)} className="h-6 flex-1 text-[9pt]" style={{ fontFamily: 'Arial, sans-serif' }} />
                          <label className="cursor-pointer" title="Inserir foto após esta">
                            <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:bg-muted/40">
                              <Plus className="h-3 w-3" />
                            </div>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleInsertFotoAt(li, ai, fi + 1, e.target.files)} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <label className="mt-2 flex cursor-pointer items-center gap-2 rounded border border-dashed border-muted-foreground/30 p-2 text-xs text-muted-foreground hover:bg-muted/40">
                  {uploadingAmb === amb.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploadingAmb === amb.id ? 'Enviando...' : 'Adicionar fotos'}
                  <input type="file" multiple accept="image/*" className="hidden" disabled={uploadingAmb === amb.id} onChange={(e) => e.target.files && handleFotoUpload(li, ai, e.target.files)} />
                </label>
              </div>
            ))}

            {lind.ambientes.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => addAmbiente(li)} className="mt-2 w-full gap-1 text-xs">
                <Plus className="h-3 w-3" /> Adicionar Ambiente
              </Button>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-center py-6">
        <Button onClick={addLindeiro} className="gap-2"><Plus className="h-4 w-4" /> Adicionar Lindeiro</Button>
      </div>

      {/* Image Annotator with navigation */}
      {annotating && (() => {
        const { fotos, total } = getAnnotatorPhotos();
        return (
          <ImageAnnotator
            imageUrl={annotating.url}
            onCancel={() => setAnnotating(null)}
            currentIndex={annotating.fotoIndex}
            totalCount={total}
            canGoPrev={annotating.fotoIndex > 0}
            canGoNext={annotating.fotoIndex < total - 1}
            onPrev={() => {
              const prev = annotating.fotoIndex - 1;
              if (prev >= 0) {
                setAnnotating({ ...annotating, fotoIndex: prev, url: fotos[prev].dataUrl });
              }
            }}
            onNext={() => {
              const next = annotating.fotoIndex + 1;
              if (next < total) {
                setAnnotating({ ...annotating, fotoIndex: next, url: fotos[next].dataUrl });
              }
            }}
            onSave={(dataUrl) => {
              const { lindIndex, ambIndex, fotoIndex } = annotating;
              const updated = [...lindeiros];
              const ambs = [...updated[lindIndex].ambientes];
              const fotosArr = [...ambs[ambIndex].fotos];
              fotosArr[fotoIndex] = { ...fotosArr[fotoIndex], dataUrl };
              ambs[ambIndex] = { ...ambs[ambIndex], fotos: fotosArr };
              updated[lindIndex] = { ...updated[lindIndex], ambientes: ambs };
              onUpdate(updated);
              setAnnotating(null);
            }}
          />
        );
      })()}
    </div>
  );
}
