import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { CoverPage } from '@/components/editor/CoverPage';
import { SectionPage } from '@/components/editor/SectionPage';
import { LindeirosSection } from '@/components/editor/LindeirosSection';
import { gerarPDF } from '@/lib/pdfGenerator';
import type { SecaoId, Laudo } from '@/types/laudo';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const LaudoEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLaudo, atualizarLaudo } = useLaudoStore();
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>('capa');
  const [zoom, setZoom] = useState(0.6);

  const laudo = getLaudo(id || '');

  useEffect(() => {
    if (!laudo && id) {
      navigate('/');
    }
  }, [laudo, id, navigate]);

  const handleUpdate = useCallback(
    (updates: Partial<Laudo>) => {
      if (id) atualizarLaudo(id, updates);
    },
    [id, atualizarLaudo]
  );

  if (!laudo) return null;

  const secoesTexto: SecaoId[] = ['introducao', 'objeto', 'objetivo', 'finalidade', 'responsabilidades', 'classificacao'];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-editor-bg">
      {/* Top toolbar */}
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
        {/* Sidebar */}
        <EditorSidebar
          secaoAtiva={secaoAtiva}
          onSecaoClick={setSecaoAtiva}
          lindeiros={laudo.lindeiros}
        />

        {/* Main canvas area */}
        <main className="flex-1 overflow-auto p-8" style={{ background: 'hsl(var(--editor-bg))' }}>
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[4rem] text-center text-sm text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="mx-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: '210mm',
            }}
          >
            {/* Cover Page */}
            {(secaoAtiva === 'capa' || secaoAtiva === 'indice') && (
              <div id="secao-capa" className="mb-8">
                <CoverPage
                  dadosCapa={laudo.dadosCapa}
                  onUpdate={(dadosCapa) => handleUpdate({ dadosCapa })}
                />
              </div>
            )}

            {/* Index Page */}
            {secaoAtiva === 'indice' && (
              <div id="secao-indice" className="a4-page mb-8">
                <h2 className="mb-6 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
                  ÍNDICE
                </h2>
                <div className="space-y-2">
                  {SECOES_NAVEGAVEIS.filter(s => s.id !== 'capa' && s.id !== 'indice').map((secao, i) => (
                    <div
                      key={secao.id}
                      className="flex cursor-pointer items-center justify-between border-b border-dotted border-muted-foreground/30 py-1 text-sm hover:text-primary"
                      onClick={() => setSecaoAtiva(secao.id)}
                    >
                      <span>{secao.label}</span>
                      <span className="text-muted-foreground">{i + 3}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section Pages */}
            {secoesTexto.includes(secaoAtiva) && (
              <div id={`secao-${secaoAtiva}`} className="mb-8">
                <SectionPage
                  secaoId={secaoAtiva}
                  conteudo={laudo.textos[secaoAtiva as keyof typeof laudo.textos]}
                  onUpdate={(conteudo) =>
                    handleUpdate({
                      textos: { ...laudo.textos, [secaoAtiva]: conteudo },
                    })
                  }
                />
              </div>
            )}

            {/* Lindeiros Section */}
            {secaoAtiva === 'lindeiros' && (
              <div id="secao-lindeiros" className="mb-8">
                <LindeirosSection
                  lindeiros={laudo.lindeiros}
                  onUpdate={(lindeiros) => handleUpdate({ lindeiros })}
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
