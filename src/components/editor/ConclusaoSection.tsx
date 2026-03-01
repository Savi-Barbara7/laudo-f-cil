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
  volumeAtual?: number;
  totalVolumes?: number;
}

export function ConclusaoSection({ conclusao, onUpdate, lindeiros = [], dadosCapa, volumeAtual = 1, totalVolumes = 1 }: ConclusaoSectionProps) {
  const [generating, setGenerating] = useState(false);

  const gerarConclusaoAutomatica = async () => {
    setGenerating(true);
    try {
      // Count by estado de conservação
      const counts = { Bom: 0, Regular: 0, Ruim: 0, Novo: 0 };
      for (const l of lindeiros) {
        if (l.estadoConservacao in counts) counts[l.estadoConservacao as keyof typeof counts]++;
      }
      const total = lindeiros.length;
      const empreendimento = dadosCapa?.empreendimento || '[EMPREENDIMENTO]';
      const local = dadosCapa?.localObra || '[LOCAL DA OBRA]';
      const solicitante = dadosCapa?.solicitante || '[SOLICITANTE]';

      const estadoParts: string[] = [];
      if (counts.Bom > 0) estadoParts.push(`${counts.Bom} em bom estado de conservação`);
      if (counts.Regular > 0) estadoParts.push(`${counts.Regular} em estado regular`);
      if (counts.Ruim > 0) estadoParts.push(`${counts.Ruim} em estado ruim`);
      if (counts.Novo > 0) estadoParts.push(`${counts.Novo} classificado(s) como novo(s)`);

      const estadoDesc = estadoParts.length > 0 ? estadoParts.join(', ') : 'estado de conservação a ser avaliado';

      const temRuim = counts.Ruim > 0;
      const temRegular = counts.Regular > 0;

      let recomendacoes = '';
      if (temRuim) {
        recomendacoes = `\n\n<b>Recomendações:</b> Foram identificados imóveis em estado ruim de conservação, com manifestações patológicas preexistentes que devem ser monitoradas durante a execução da obra. Recomenda-se atenção especial ao monitoramento estrutural nesses casos.`;
      } else if (temRegular) {
        recomendacoes = `\n\n<b>Recomendações:</b> Alguns imóveis apresentam estado regular de conservação com necessidade de reparos. Recomenda-se monitoramento periódico durante a obra.`;
      } else {
        recomendacoes = `\n\n<b>Recomendações:</b> As edificações vistoriadas apresentam bom estado geral de conservação. Recomenda-se monitoramento preventivo durante as fases de maior impacto da obra.`;
      }

      const html = `<p>O presente Laudo Técnico Cautelar de Vistoria de Lindeiros, elaborado pela empresa <b>Competence Consultoria e Perícias</b>, a pedido de <b>${solicitante}</b>, refere-se ao empreendimento denominado <b>${empreendimento}</b>, localizado em <b>${local}</b>.</p>

<p>Este volume (${volumeAtual} de ${totalVolumes}) contempla a vistoria de <b>${total} imóvel(is) lindeiro(s)</b>, sendo: ${estadoDesc}.</p>

<p>As vistorias foram realizadas por profissional habilitado, com registro fotográfico detalhado e ficha de vistoria assinada pelos responsáveis pelos imóveis, quando presentes. O levantamento seguiu os critérios estabelecidos pela <b>NBR 12722:1992</b> e demais normas técnicas vigentes.</p>

<p>O objetivo deste laudo é preservar os direitos de todas as partes envolvidas, documentando o estado de conservação dos imóveis lindeiros antes do início das atividades construtivas, servindo como instrumento técnico-jurídico na eventualidade de reclamações por danos decorrentes da obra.${recomendacoes}</p>

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
