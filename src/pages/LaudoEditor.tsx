import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { CoverPage } from '@/components/editor/CoverPage';
import { SectionPage } from '@/components/editor/SectionPage';
import { LindeirosSection } from '@/components/editor/LindeirosSection';
import { CroquiSection } from '@/components/editor/CroquiSection';
import { ARTSection } from '@/components/editor/ARTSection';
import { DocumentacoesSection } from '@/components/editor/DocumentacoesSection';
import { FichasSection } from '@/components/editor/FichasSection';
import { ConclusaoSection } from '@/components/editor/ConclusaoSection';
import { gerarPDF } from '@/lib/pdfGenerator';
import type { SecaoId, Laudo } from '@/types/laudo';
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const LaudoEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLaudo, atualizarLaudo } = useLaudoStore();
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>('capa');
  const [zoom, setZoom] = useState(0.6);

  const { loading } = useLaudoStore();
  const laudo = getLaudo(id || '');

  useEffect(() => {
    // Only redirect if loading is done AND laudo is not found
    if (!loading && !laudo && id) {
      navigate('/');
    }
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-editor-bg">
      <EditorToolbar
        titulo={laudo.titulo}
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
        <EditorSidebar secaoAtiva={secaoAtiva} onSecaoClick={setSecaoAtiva} lindeiros={laudo.lindeiros} />

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
            {(secaoAtiva === 'capa' || secaoAtiva === 'indice') && (
              <div id="secao-capa" className="mb-8">
                <CoverPage dadosCapa={laudo.dadosCapa} onUpdate={(dadosCapa) => handleUpdate({ dadosCapa })} />
              </div>
            )}

            {secaoAtiva === 'indice' && (
              <div id="secao-indice" className="a4-page mb-8">
                <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>ÍNDICE</h2>
                <div className="space-y-2">
                  {SECOES_NAVEGAVEIS.filter(s => s.id !== 'capa' && s.id !== 'indice').map((secao, i) => (
                    <div key={secao.id} className="flex cursor-pointer items-center justify-between border-b border-dotted border-muted-foreground/30 py-1 text-sm hover:text-primary" onClick={() => setSecaoAtiva(secao.id)}>
                      <span>{secao.label}</span>
                      <span className="text-muted-foreground">{i + 3}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {secoesTexto.includes(secaoAtiva) && (
              <div id={`secao-${secaoAtiva}`} className="mb-8">
                <SectionPage
                  secaoId={secaoAtiva}
                  conteudo={laudo.textos[secaoAtiva as keyof typeof laudo.textos]}
                  onUpdate={(conteudo) => handleUpdate({ textos: { ...laudo.textos, [secaoAtiva]: conteudo } })}
                />
              </div>
            )}

            {secaoAtiva === 'lindeiros' && (
              <div id="secao-lindeiros" className="mb-8">
                <LindeirosSection lindeiros={laudo.lindeiros} onUpdate={(lindeiros) => handleUpdate({ lindeiros })} />
              </div>
            )}

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

            {secaoAtiva === 'conclusao' && (
              <div id="secao-conclusao" className="mb-8">
                <ConclusaoSection
                  conclusao={laudo.conclusao || ''}
                  onUpdate={(conclusao) => handleUpdate({ conclusao })}
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
