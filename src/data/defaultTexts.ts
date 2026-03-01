import type { TextosSecoes, DadosCapa, SecaoNavegavel } from '@/types/laudo';

export const TEXTOS_PADRAO: TextosSecoes = {
  introducao: `<h1>LAUDO TÉCNICO DE VISTORIA CAUTELAR DE LINDEIROS (LVL)</h1>

<p>O Laudo Técnico de Vistoria Cautelar de Vizinhança é uma solução preventiva que visa apurar o estado de conservação dos imóveis localizados próximos a canteiros de obras e/ou regiões de mobilização em solo. Este laudo atua como uma garantia contra reclamações por danos e prejuízos indevidos, oferecendo segurança tanto para a empresa contratante quanto para os proprietários dos imóveis em situações de embates judiciais. Em casos de futuras reclamações, o laudo permite à empresa contratante verificar se o problema era preexistente e, com isso, avaliar se foi originado em decorrência das obras ou das mobilizações no entorno.</p>

<h2>Métodos Utilizados para a Realização do Laudo:</h2>

<ul>
<li>Levantamento Detalhado: identificação do número e tipos de imóveis entorno do empreendimento/obra.</li>
<li>Identificação dos Endereços: coleta dos endereços completos dos imóveis próximos à área de construção.</li>
<li>Comunicação com Proprietários: envio de correspondências aos proprietários/inquilinos/síndicos solicitando autorização para visita técnica.</li>
<li>Agendamento da Vistoria: programação prévia das vistorias com autorização do responsável.</li>
<li>Registro das Condições: registro das características gerais e condições físicas dos imóveis.</li>
<li>Registro Fotográfico Detalhado: registro minucioso das dependências para identificar revestimentos e danos preexistentes.</li>
<li>Ficha de Vistoria: elaboração de ficha de vistoria para ciência dos fatos observados.</li>
</ul>`,

  objeto: `<p>No imóvel localizado a <strong>{ENDERECO_OBRA}</strong>, há atualmente um terreno {TERRENO_BENFEITORIAS} pronto para início da obra. No local, será executado o empreendimento <strong>{EMPREENDIMENTO}</strong>, conforme solicitado pela empresa <strong>{SOLICITANTE}</strong>.</p>

<p>As visitas técnicas aos imóveis lindeiros à futura obra foram realizadas em <strong>{DATAS_VISTORIAS}</strong>. As observações técnicas de engenharia foram registradas e são agora apresentadas de forma detalhada, incluindo documentário fotográfico e descrição técnica.</p>

<p>A leitura atenta do laudo técnico que será apresentado a seguir é essencial para a definição de estratégias e a tomada de decisões antes do início das mobilizações. A correta interpretação por parte da equipe técnica garantirá a segurança no entorno e nas divisas do projeto.</p>`,

  objetivo: `<h2>OBJETIVO</h2>

<p>O objetivo do laudo cautelar de lindeiros é documentar de forma detalhada e precisa o estado de conservação das edificações e propriedades vizinhas a uma obra ou empreendimento antes do início das atividades de construção. Este laudo serve como um registro oficial que resguarda tanto a construtora quanto os proprietários dos imóveis circunvizinhos, oferecendo proteção jurídica e técnica.</p>

<p>O laudo cautelar busca:</p>
<ul>
<li>Registrar o Estado Atual dos Imóveis (documentação detalhada).</li>
<li>Resguardar Direitos e Responsabilidades (proteção para construtora e proprietários).</li>
<li>Prevenir Conflitos Judiciais (base para resolução e redução de litígios).</li>
<li>Cumprir Exigências Normativas (conformidade legal).</li>
</ul>`,

  finalidade: `<h2>FINALIDADE</h2>

<p>A finalidade do laudo cautelar é fornecer um registro técnico detalhado e imparcial do estado atual de uma propriedade ou conjunto de propriedades antes do início de obras/atividades que possam causar impacto. Este laudo é utilizado como medida preventiva para proteger os interesses das partes envolvidas.</p>

<p>Finalidades incluem:</p>
<ul>
<li>Documentação Preventiva</li>
<li>Proteção Jurídica</li>
<li>Transparência e Comunicação</li>
<li>Cumprimento de Normas e Regulamentações</li>
<li>Prevenção de Conflitos</li>
</ul>`,

  responsabilidades: `<h2>RESPONSABILIDADES E PROCEDIMENTOS</h2>

<p>Durante as vistorias técnicas, foram realizadas fotografias detalhadas das dependências e delimitações dos imóveis que fazem divisa com o terreno do canteiro de obras, conforme solicitado pela construtora. As imagens capturadas visam facilitar a visualização e registro do estado estrutural, do tipo de revestimento utilizado, e da identificação de qualquer patologia existente, como microfissuras, fissuras, trincas, rupturas, manchas e focos de infiltrações/umidade.</p>

<p>As fotos abrangem dependências internas e externas autorizadas. Em casos de acesso negado, o proprietário assume responsabilidade por eventuais danos futuros. Caso alguma foto não apresente nitidez suficiente, recomenda-se consultar o arquivo digital original.</p>

<h2>Considerações Técnicas:</h2>
<p>Para obras com escavações e execução de tirantes/protenção, é necessário estudo detalhado das fundações vizinhas e tubulações, considerando o raio de influência das atividades.</p>

<h2>Privacidade das Imagens Registradas:</h2>
<p>As imagens são utilizadas exclusivamente para fins técnicos e documentais, com confidencialidade, e só serão divulgadas mediante autorização ou exigência legal.</p>`,

  classificacao: `<h2>CONCEITO PARA DETERMINAÇÃO DE ESTADOS DE CONSERVAÇÃO</h2>

<h2>Classificação do Estado de Conservação da Edificação:</h2>
<ul>
<li><strong>Bom e Satisfatório:</strong> aplica-se a edificações não novas que mantêm revestimentos em bom estado, sem desgaste excessivo/deformações/comprometimento estrutural.</li>
<li><strong>Regular:</strong> edificações que necessitam reparos nos revestimentos, sem comprometer estruturas principais.</li>
<li><strong>Ruim e Crítico:</strong> manifestações patológicas avançadas (infiltrações graves, fissuras/trincas significativas, risco estrutural).</li>
<li><strong>Novo (Bom e Satisfatório):</strong> edificações recém-construídas, livres de anomalias, ainda com acomodação inicial possível.</li>
</ul>`,
};

export const DADOS_CAPA_PADRAO: DadosCapa = {
  empreendimento: '',
  localObra: '',
  solicitante: '',
  cnpj: '',
  volumeAtual: 1,
  totalVolumes: 1,
  datasVistorias: '',
  terrenoBenfeitorias: 'sem benfeitorias',
};

/**
 * Substitui placeholders nos textos com dados reais da capa
 */
export function aplicarPlaceholders(texto: string, capa: DadosCapa): string {
  return texto
    .replace(/\{ENDERECO_OBRA\}/g, capa.localObra || '[ENDEREÇO DA OBRA]')
    .replace(/\{EMPREENDIMENTO\}/g, capa.empreendimento || '[EMPREENDIMENTO]')
    .replace(/\{SOLICITANTE\}/g, capa.solicitante || '[SOLICITANTE]')
    .replace(/\{CNPJ\}/g, capa.cnpj || '[CNPJ]')
    .replace(/\{DATAS_VISTORIAS\}/g, capa.datasVistorias || '[DATAS DAS VISTORIAS]')
    .replace(/\{TERRENO_BENFEITORIAS\}/g, capa.terrenoBenfeitorias || 'sem benfeitorias');
}

export const SECOES_NAVEGAVEIS: SecaoNavegavel[] = [
  { id: 'capa', label: 'Capa' },
  { id: 'indice', label: 'Índice' },
  { id: 'introducao', label: 'I. Introdução' },
  { id: 'objeto', label: 'II. Objeto' },
  { id: 'objetivo', label: 'III. Objetivo' },
  { id: 'finalidade', label: 'IV. Finalidade' },
  { id: 'responsabilidades', label: 'V. Responsabilidades' },
  { id: 'classificacao', label: 'VI. Classificação' },
  { id: 'canteiro', label: 'Vol. 1 — Canteiro / Entorno / Drone' },
  { id: 'lindeiros', label: 'Vistoria dos Lindeiros' },
  { id: 'croqui', label: 'III. Croqui' },
  { id: 'art', label: 'IV. ART' },
  { id: 'documentacoes', label: 'V. Documentações' },
  { id: 'fichas', label: 'Fichas / Anexos' },
  { id: 'conclusao', label: 'VI. Conclusão' },
];
