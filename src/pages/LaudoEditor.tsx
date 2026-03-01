import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { CoverPage } from '@/components/editor/CoverPage';
import { SectionPage } from '@/components/editor/SectionPage';
import { LindeirosSection } from '@/components/editor/LindeirosSection';
import { CanteiroSection } from '@/components/editor/CanteiroSection';
import { CroquiSection } from '@/components/editor/CroquiSection';
import { ARTSection } from '@/components/editor/ARTSection';
import { DocumentacoesSection } from '@/components/editor/DocumentacoesSection';
import { FichasSection } from '@/components/editor/FichasSection';
import { ConclusaoSection } from '@/components/editor/ConclusaoSection';
import { gerarPDF } from '@/lib/pdfGenerator';
import type { SecaoId, Laudo } from '@/types/laudo';
import { aplicarPlaceholders, SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const LaudoEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLaudo, atualizarLaudo, loading } = useLaudoStore();
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>('capa');
  const [zoom, setZoom] = useState(0.6);

  const laudo = getLaudo(id || '');

  useEffect(() => {
    if (!loading && !laudo && id) navigate('/');
  }, [laudo, id, navigate, loading]);

  const handleUpdate = useCallback(
    (updates: Partial<Laudo>) => {
      if (id) atualizarLaudo(id, updates);
    },
    [id, atualizarLaudo]
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!laudo) return null;

  const secoesTexto: SecaoId[] = ['introducao', 'objeto', 'objetivo', 'finalidade', 'responsabilidades', 'classificacao'];

  // Detecta se é seção de lindeiro individual
  const isLindeiroAtivo = secaoAtiva.startsWith('lindeiro-');
  const lindeiroAtivoId = isLindeiroAtivo ? secaoAtiva.replace('lindeiro-', '') : null;
  const lindeiroAtivo = lindeiroAtivoId ? laudo.lindeiros.find(l => l.id === lindeiroAtivoId) : null;
  const lindeiroAtivoIndex = lindeiroAtivoId ? laudo.lindeiros.findIndex(l => l.id === lindeiroAtivoId) : -1;

  // Aplica placeholders automaticamente nas seções de texto
  const getTextoComPlaceholders = (secao: keyof typeof laudo.textos) => {
    return aplicarPlaceholders(laudo.textos[secao] || '', laudo.dadosCapa);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-editor-bg">
      <EditorToolbar
        titulo={laudo.titulo}
        status={laudo.status}
        onTituloChange={(titulo) => handleUpdate({ titulo })}
        onVoltar={() => navigate('/')}
        onExportPDF={async () => {
          try {
            await gerarPDF(laudo);
            toast({ title: 'PDF gerado com sucesso!', description: 'O download começou automaticamente.' });
          } catch (err) {
            toast({ title: 'Erro ao gerar PDF', description: String(err), variant: 'destructive' });
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar secaoAtiva={secaoAtiva} onSecaoClick={setSecaoAtiva} lindeiros={laudo.lindeiros} titulo={laudo.titulo} />

        <main className="flex-1 overflow-auto p-8" style={{ background: 'hsl(var(--editor-bg))' }}>
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[4rem] text-center text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: '210mm' }}>

            {/* CAPA */}
            {(secaoAtiva === 'capa' || secaoAtiva === 'indice') && (
              <div id="secao-capa" className="mb-8">
                <CoverPage dadosCapa={laudo.dadosCapa} onUpdate={(dadosCapa) => handleUpdate({ dadosCapa })} />
              </div>
            )}

            {/* ÍNDICE */}
            {secaoAtiva === 'indice' && (
              <div id="secao-indice" className="a4-page mb-8">
                <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>ÍNDICE</h2>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mt-4 mb-2 uppercase tracking-wide">I. Informações Gerais</p>
                  {['introducao', 'objeto', 'objetivo', 'finalidade', 'responsabilidades', 'classificacao'].map((s, i) => (
                    <div key={s} className="flex cursor-pointer items-center justify-between border-b border-dotted border-muted-foreground/20 py-1 text-sm hover:text-primary"
                      onClick={() => setSecaoAtiva(s as SecaoId)}>
                      <span>{i + 1}. {SECOES_NAVEGAVEIS.find(sn => sn.id === s)?.label?.replace(/^[IVX]+\.\s/, '') ?? s}</span>
                      <span className="text-muted-foreground">3</span>
                    </div>
                  ))}

                  <p className="text-xs font-semibold text-muted-foreground mt-4 mb-2 uppercase tracking-wide">II. Volumes</p>
                  <div className="flex cursor-pointer items-center justify-between border-b border-dotted border-muted-foreground/20 py-1 text-sm hover:text-primary"
                    onClick={() => setSecaoAtiva('canteiro')}>
                    <span>Volume 1 — Canteiro / Entorno / Drone</span>
                    <span className="text-muted-foreground">—</span>
                  </div>
                  {laudo.lindeiros.map((l, i) => (
                    <div key={l.id} className="flex cursor-pointer items-center justify-between border-b border-dotted border-muted-foreground/20 py-1 text-sm hover:text-primary"
                      onClick={() => setSecaoAtiva(`lindeiro-${l.id}` as SecaoId)}>
                      <span>Volume {i + 2} — Lindeiro {i + 1}: {l.endereco || '—'}</span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  ))}

                  <p className="text-xs font-semibold text-muted-foreground mt-4 mb-2 uppercase tracking-wide">Anexos &amp; Conclusão</p>
                  {['croqui', 'art', 'documentacoes', 'fichas', 'conclusao'].map((s) => (
                    <div key={s} className="flex cursor-pointer items-center justify-between border-b border-dotted border-muted-foreground/20 py-1 text-sm hover:text-primary"
                      onClick={() => setSecaoAtiva(s as SecaoId)}>
                      <span>{SECOES_NAVEGAVEIS.find(sn => sn.id === s)?.label ?? s}</span>
                      <span className="text-muted-foreground">—</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÕES DE TEXTO — com placeholders aplicados */}
            {secoesTexto.includes(secaoAtiva) && (
              <div id={`secao-${secaoAtiva}`} className="mb-8">
                <SectionPage
                  secaoId={secaoAtiva}
                  conteudo={laudo.textos[secaoAtiva as keyof typeof laudo.textos]}
                  onUpdate={(conteudo) => handleUpdate({ textos: { ...laudo.textos, [secaoAtiva]: conteudo } })}
                  placeholder={getTextoComPlaceholders(secaoAtiva as keyof typeof laudo.textos)}
                />
              </div>
            )}

            {/* VOLUME 1 — CANTEIRO */}
            {secaoAtiva === 'canteiro' && (
              <div id="secao-canteiro" className="mb-8">
                <CanteiroSection
                  canteiro={laudo.canteiroVolume || { endereco: '', dataVistoria: '', caracteristicasGerais: '', fotos: [] }}
                  onUpdate={(canteiroVolume) => handleUpdate({ canteiroVolume })}
                />
              </div>
            )}

            {/* VOLUME LINDEIRO INDIVIDUAL */}
            {isLindeiroAtivo && lindeiroAtivo && (
              <div id={`secao-${secaoAtiva}`} className="mb-8">
                <LindeirosSection
                  lindeiros={[lindeiroAtivo]}
                  onUpdate={(updated) => {
                    const todos = laudo.lindeiros.map((l, i) =>
                      i === lindeiroAtivoIndex ? updated[0] : l
                    );
                    handleUpdate({ lindeiros: todos });
                  }}
                  volumeNumero={lindeiroAtivoIndex + 2}
                />
              </div>
            )}

            {/* GERENCIAR TODOS OS LINDEIROS */}
            {secaoAtiva === 'lindeiros' && (
              <div id="secao-lindeiros" className="mb-8">
                <LindeirosSection lindeiros={laudo.lindeiros} onUpdate={(lindeiros) => handleUpdate({ lindeiros })} />
              </div>
            )}

            {/* CROQUI */}
            {secaoAtiva === 'croqui' && (
              <div id="secao-croqui" className="mb-8">
                <CroquiSection
                  images={laudo.croquiImages || []}
                  onUpdate={(croquiImages) => handleUpdate({ croquiImages })}
                  richText={laudo.croquiRichText || ''}
                  onRichTextUpdate={(croquiRichText) => handleUpdate({ croquiRichText })}
                />
              </div>
            )}

            {/* ART */}
            {secaoAtiva === 'art' && (
              <div id="secao-art" className="mb-8">
                <ARTSection
                  images={laudo.artImages || []}
                  onUpdate={(artImages) => handleUpdate({ artImages })}
                  richText={laudo.artRichText || ''}
                  onRichTextUpdate={(artRichText) => handleUpdate({ artRichText })}
                />
              </div>
            )}

            {/* DOCUMENTAÇÕES */}
            {secaoAtiva === 'documentacoes' && (
              <div id="secao-documentacoes" className="mb-8">
                <DocumentacoesSection
                  documentacoes={laudo.documentacoes || []}
                  onUpdate={(documentacoes) => handleUpdate({ documentacoes })}
                  richText={laudo.documentacoesRichText || ''}
                  onRichTextUpdate={(documentacoesRichText) => handleUpdate({ documentacoesRichText })}
                />
              </div>
            )}

            {/* FICHAS */}
            {secaoAtiva === 'fichas' && (
              <div id="secao-fichas" className="mb-8">
                <FichasSection
                  fichas={laudo.fichas || []}
                  onUpdate={(fichas) => handleUpdate({ fichas })}
                  richText={laudo.fichasRichText || ''}
                  onRichTextUpdate={(fichasRichText) => handleUpdate({ fichasRichText })}
                />
              </div>
            )}

            {/* CONCLUSÃO */}
            {secaoAtiva === 'conclusao' && (
              <div id="secao-conclusao" className="mb-8">
                <ConclusaoSection
                  conclusao={laudo.conclusao || ''}
                  onUpdate={(conclusao) => handleUpdate({ conclusao })}
                  lindeiros={laudo.lindeiros}
                  dadosCapa={laudo.dadosCapa}
                  canteiroVolume={laudo.canteiroVolume}
                  volumeAtual={laudo.dadosCapa.volumeAtual}
                  totalVolumes={laudo.dadosCapa.totalVolumes}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaudoEditor;
