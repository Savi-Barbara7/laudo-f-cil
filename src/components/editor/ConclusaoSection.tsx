import { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import type { Lindeiro } from '@/types/laudo';

interface ConclusaoSectionProps {
  conclusao: string;
  onUpdate: (value: string) => void;
  lindeiros?: Lindeiro[];
  dadosCapa?: { empreendimento?: string; localObra?: string; solicitante?: string };
  canteiroVolume?: { caracteristicasGerais?: string };
  volumeAtual?: number;
  totalVolumes?: number;
}

export function ConclusaoSection({ conclusao, onUpdate, lindeiros = [], dadosCapa, canteiroVolume, volumeAtual = 1, totalVolumes = 1 }: ConclusaoSectionProps) {
  const [generating, setGenerating] = useState(false);

  const gerarConclusaoAutomatica = async () => {
    setGenerating(true);
    try {
      const counts = { Bom: 0, Regular: 0, Ruim: 0, Novo: 0 };
      for (const l of lindeiros) {
        if (l.estadoConservacao in counts) counts[l.estadoConservacao as keyof typeof counts]++;
      }
      const total = lindeiros.length;
      const empreendimento = dadosCapa?.empreendimento || '[EMPREENDIMENTO]';
      const local = dadosCapa?.localObra || '[LOCAL DA OBRA]';
      const solicitante = dadosCapa?.solicitante || '[SOLICITANTE]';

      // Composição por volumes
      const volItem1 = `<li>Volume 1 — Canteiro de Obras / Entorno / Drone${canteiroVolume?.caracteristicasGerais ? '' : ''}</li>`;
      const volItemsLind = lindeiros.map((l, i) =>
        `<li>Volume ${i + 2} — Lindeiro ${i + 1}: ${l.endereco || 'Endereço não informado'} — ${l.tipoImovel} ${l.tipoUso} — Estado: <strong>${l.estadoConservacao}</strong></li>`
      ).join('\n');

      const estadoParts: string[] = [];
      if (counts.Bom > 0) estadoParts.push(`${counts.Bom} em bom estado`);
      if (counts.Regular > 0) estadoParts.push(`${counts.Regular} em estado regular`);
      if (counts.Ruim > 0) estadoParts.push(`${counts.Ruim} em estado ruim`);
      if (counts.Novo > 0) estadoParts.push(`${counts.Novo} novo(s)`);
      const estadoDesc = estadoParts.join(', ') || 'sem classificação definida';

      let recomendacoes = '';
      if (counts.Ruim > 0) {
        recomendacoes = `<p>Foram identificados imóveis em estado ruim de conservação, com manifestações patológicas preexistentes que devem ser monitoradas durante a execução da obra. Recomenda-se atenção especial ao monitoramento estrutural nesses casos.</p>`;
      } else if (counts.Regular > 0) {
        recomendacoes = `<p>Alguns imóveis apresentam estado regular de conservação com necessidade de reparos. Recomenda-se monitoramento periódico durante a obra.</p>`;
      } else {
        recomendacoes = `<p>As edificações vistoriadas apresentam bom estado geral de conservação. Recomenda-se monitoramento preventivo durante as fases de maior impacto da obra.</p>`;
      }

      const html = `<p>As vistorias procedidas nos imóveis lindeiros têm finalidade exclusivamente preventiva e documental, com o objetivo de registrar as condições preexistentes das edificações vizinhas ao empreendimento, antes do início das obras.</p>

<p>O presente Laudo Técnico Cautelar de Vistoria de Lindeiros foi elaborado pela empresa <strong>Competence Consultoria e Perícias</strong>, a pedido de <strong>${solicitante}</strong>, referente ao empreendimento <strong>${empreendimento}</strong>, localizado em <strong>${local}</strong>.</p>

<p>Este laudo cautelar é composto por <strong>${totalVolumes} volume(s)</strong> e estão distribuídos da seguinte forma:</p>
<ul>
${volItem1}
${volItemsLind}
</ul>

<p>Neste volume (${volumeAtual} de ${totalVolumes}), foram vistoriados <strong>${total} imóvel(is) lindeiro(s)</strong>, com o seguinte resumo: ${estadoDesc}.</p>

<p>As vistorias foram realizadas por profissional habilitado, com registro fotográfico detalhado e ficha de vistoria assinada pelos responsáveis pelos imóveis, quando presentes. O levantamento seguiu os critérios estabelecidos pela <strong>NBR 12722:1992</strong> e demais normas técnicas vigentes.</p>

${recomendacoes}
<p>Este documento foi elaborado com base nas vistorias realizadas in loco, sendo de responsabilidade exclusiva do profissional técnico responsável a veracidade das informações registradas.</p>`;

      onUpdate(html);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="a4-page mb-4">
        <h2 className="mb-4 text-center text-lg font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
          CONCLUSÃO
        </h2>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Geração automática</p>
            <p className="text-xs text-muted-foreground">
              Gera a conclusão com base nos {lindeiros.length} lindeiro(s) cadastrado(s) e seus estados de conservação.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={gerarConclusaoAutomatica}
            disabled={generating || lindeiros.length === 0}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {generating ? 'Gerando...' : 'Gerar Conclusão'}
          </Button>
        </div>
      </div>
      <RichTextEditor
        content={conclusao}
        onUpdate={onUpdate}
        placeholder="Ex: Volume 01 contempla os lindeiros de 1 a 10, localizados na Rua..."
        minHeight="400px"
      />
    </div>
  );
}
