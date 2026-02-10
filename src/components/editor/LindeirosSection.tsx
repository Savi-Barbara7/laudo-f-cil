import { useCallback } from 'react';
import type { Lindeiro, Ambiente, Foto } from '@/types/laudo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ImagePlus, X } from 'lucide-react';

interface LindeirosProps {
  lindeiros: Lindeiro[];
  onUpdate: (lindeiros: Lindeiro[]) => void;
}

export function LindeirosSection({ lindeiros, onUpdate }: LindeirosProps) {
  const addLindeiro = () => {
    const novo: Lindeiro = {
      id: crypto.randomUUID(),
      tipoImovel: 'Casa',
      tipoUso: 'Residencial',
      endereco: '',
      responsavel: '',
      telefone: '',
      dataVistoria: '',
      descricao: '',
      estadoConservacao: 'Bom',
      ambientes: [],
    };
    onUpdate([...lindeiros, novo]);
  };

  const updateLindeiro = (index: number, updates: Partial<Lindeiro>) => {
    const updated = lindeiros.map((l, i) => (i === index ? { ...l, ...updates } : l));
    onUpdate(updated);
  };

  const removeLindeiro = (index: number) => {
    onUpdate(lindeiros.filter((_, i) => i !== index));
  };

  const addAmbiente = (lindIndex: number) => {
    const amb: Ambiente = { id: crypto.randomUUID(), nome: '', fotos: [] };
    const updated = [...lindeiros];
    updated[lindIndex] = { ...updated[lindIndex], ambientes: [...updated[lindIndex].ambientes, amb] };
    onUpdate(updated);
  };

  const removeAmbiente = (lindIndex: number, ambIndex: number) => {
    const updated = [...lindeiros];
    updated[lindIndex] = {
      ...updated[lindIndex],
      ambientes: updated[lindIndex].ambientes.filter((_, i) => i !== ambIndex),
    };
    onUpdate(updated);
  };

  const updateAmbienteNome = (lindIndex: number, ambIndex: number, nome: string) => {
    const updated = [...lindeiros];
    const ambs = [...updated[lindIndex].ambientes];
    ambs[ambIndex] = { ...ambs[ambIndex], nome };
    updated[lindIndex] = { ...updated[lindIndex], ambientes: ambs };
    onUpdate(updated);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
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
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(url);
        resolve(compressed);
      };
      img.src = url;
    });
  };

  const handleFotoUpload = async (lindIndex: number, ambIndex: number, files: FileList) => {
    const updated = [...lindeiros];
    const ambs = [...updated[lindIndex].ambientes];
    const fotos = [...ambs[ambIndex].fotos];
    const startCount = fotos.length;

    for (let i = 0; i < files.length; i++) {
      const dataUrl = await compressImage(files[i]);
      const newFoto: Foto = {
        id: crypto.randomUUID(),
        dataUrl,
        legenda: `Foto ${startCount + i + 1}`,
        ordem: startCount + i,
      };
      fotos.push(newFoto);
    }

    ambs[ambIndex] = { ...ambs[ambIndex], fotos: [...fotos] };
    updated[lindIndex] = { ...updated[lindIndex], ambientes: [...ambs] };
    onUpdate([...updated]);
  };

  const removeFoto = (lindIndex: number, ambIndex: number, fotoIndex: number) => {
    const updated = [...lindeiros];
    const ambs = [...updated[lindIndex].ambientes];
    ambs[ambIndex] = {
      ...ambs[ambIndex],
      fotos: ambs[ambIndex].fotos.filter((_, i) => i !== fotoIndex),
    };
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

  return (
    <div>
      {/* Each lindeiro as an A4 page */}
      {lindeiros.map((lind, li) => (
        <div key={lind.id} className="a4-page mb-8">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-base font-bold"
              style={{ color: 'hsl(213, 56%, 24%)', fontFamily: 'Arial, sans-serif' }}
            >
              LINDEIRO {li + 1}: {lind.tipoImovel.toUpperCase()} {lind.tipoUso.toUpperCase()}
            </h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLindeiro(li)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Info fields */}
          <div className="mb-4 grid grid-cols-2 gap-3" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tipo do Imóvel</label>
              <Select value={lind.tipoImovel} onValueChange={(v) => updateLindeiro(li, { tipoImovel: v as Lindeiro['tipoImovel'] })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Casa', 'Prédio', 'Condomínio', 'Loja', 'Galpão', 'Terreno', 'Outro'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Uso</label>
              <Select value={lind.tipoUso} onValueChange={(v) => updateLindeiro(li, { tipoUso: v as Lindeiro['tipoUso'] })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Residencial', 'Comercial', 'Misto', 'Industrial', 'Público'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
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
                  {['Bom', 'Regular', 'Ruim', 'Novo'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Descrição Geral</label>
            <Textarea
              value={lind.descricao}
              onChange={(e) => updateLindeiro(li, { descricao: e.target.value })}
              className="mt-1 min-h-[60px] text-sm"
              style={{ fontFamily: 'Arial, sans-serif' }}
            />
          </div>

          {/* Ambientes */}
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
                  <Input
                    value={amb.nome}
                    onChange={(e) => updateAmbienteNome(li, ai, e.target.value)}
                    placeholder="Nome do ambiente (ex: Fachada Frontal)"
                    className="h-7 flex-1 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAmbiente(li, ai)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Photo upload */}
                <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-muted-foreground/30 p-2 text-xs text-muted-foreground hover:bg-muted/40">
                  <ImagePlus className="h-4 w-4" />
                  Adicionar fotos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFotoUpload(li, ai, e.target.files)}
                  />
                </label>

                {/* Photo grid: 2 per row */}
                {amb.fotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {amb.fotos.map((foto, fi) => (
                      <div key={foto.id} className="group relative">
                        <img
                          src={foto.dataUrl}
                          alt={foto.legenda}
                          className="h-32 w-full rounded border object-cover"
                        />
                        <button
                          onClick={() => removeFoto(li, ai, fi)}
                          className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <Input
                          value={foto.legenda}
                          onChange={(e) => updateFotoLegenda(li, ai, fi, e.target.value)}
                          className="mt-1 h-6 text-[9pt]"
                          style={{ fontFamily: 'Arial, sans-serif' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add lindeiro button */}
      <div className="flex justify-center py-6">
        <Button onClick={addLindeiro} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Lindeiro
        </Button>
      </div>
    </div>
  );
}
