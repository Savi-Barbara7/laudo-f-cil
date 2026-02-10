import type { TextosSecoes, DadosCapa, SecaoNavegavel } from '@/types/laudo';

export const TEXTOS_PADRAO: TextosSecoes = {
  introducao: `<b>LAUDO TÉCNICO DE VISTORIA CAUTELAR DE LINDEIROS (LVL)</b>

O Laudo Técnico de Vistoria Cautelar de Vizinhança é uma solução preventiva que visa apurar o estado de conservação dos imóveis localizados próximos a canteiros de obras e/ou regiões de mobilização em solo. Este laudo atua como uma garantia contra reclamações por danos e prejuízos indevidos, oferecendo segurança tanto para a empresa contratante quanto para os proprietários dos imóveis em situações de embates judiciais.

<b>Métodos Utilizados para a Realização do Laudo:</b>
1. Levantamento Detalhado: Identificação do número e tipos de imóveis no entorno.
2. Identificação dos Endereços: Coleta dos endereços completos.
3. Comunicação com Proprietários: Envio de correspondências solicitando autorização.
4. Agendamento da Vistoria: Programação prévia nas dependências internas e externas.
5. Registro das Condições: Registro das características gerais e estado de conservação.
6. Registro Fotográfico Detalhado: Identificação de danos preexistentes.
7. Ficha de Vistoria: Elaboração de uma ficha de vistoria com ciência dos fatos.

<b>Critérios para Seleção de Estruturas:</b>
A seleção das estruturas segue os seguintes critérios:
- Definição pelo solicitante.
- Presença de estruturas sensíveis (patrimônios, escolas).
- Localização na área de influência direta.

Essa metodologia está em conformidade com a NBR 12722:1992.`,

  objeto: `No imóvel localizado a [INSERIR ENDEREÇO], há atualmente um terreno sem benfeitorias pronto para o início da obra. No local, será executado o Empreendimento [NOME], conforme solicitado pela empresa [EMPRESA].

As visitas técnicas aos imóveis lindeiros foram realizadas em datas específicas. As observações técnicas foram registradas e são apresentadas de forma detalhada.
A leitura atenta do laudo é essencial para a definição de estratégias e a tomada de decisões.`,

  objetivo: `<b>OBJETIVO</b>

O objetivo do laudo cautelar de lindeiros é documentar de forma detalhada e precisa o estado de conservação das edificações e propriedades vizinhas a uma obra ou empreendimento antes do início das atividades de construção.

<b>Especificamente, o laudo busca:</b>
1. Registrar o Estado Atual dos Imóveis.
2. Resguardar Direitos e Responsabilidades.
3. Prevenir Conflitos Judiciais.
4. Cumprir Exigências Normativas.

Em resumo, é uma ferramenta essencial para assegurar que todas as partes envolvidas estejam protegidas.`,

  finalidade: `<b>FINALIDADE</b>

A finalidade do laudo cautelar é fornecer um registro técnico detalhado e imparcial do estado atual de uma propriedade antes do início de obras. Este laudo é utilizado como uma medida preventiva.

<b>Finalidades específicas:</b>
1. Documentação Preventiva.
2. Proteção Jurídica.
3. Transparência e Comunicação.
4. Cumprimento de Normas.
5. Prevenção de Conflitos.

Assegura-se o resguardo dos direitos das partes envolvidas.`,

  responsabilidades: `<b>RESPONSABILIDADES E PROCEDIMENTOS</b>

Durante as vistorias técnicas, foram realizadas fotografias detalhadas das dependências e delimitações dos imóveis. As imagens visam facilitar a visualização e registro do estado estrutural e patologias.

<b>Considerações Técnicas:</b>
Para obras que envolvem escavações e tirantes, é necessário um estudo detalhado das fundações vizinhas.

<b>Privacidade das Imagens:</b>
As imagens são utilizadas exclusivamente para fins técnicos e documentais.`,

  classificacao: `<b>Classificação dos Estados de Conservação:</b>

<b>Bom e Satisfatório:</b> Revestimentos em bom estado.

<b>Regular:</b> Necessitam de reparos, mas sem risco estrutural.

<b>Ruim e Crítico:</b> Manifestações patológicas avançadas, risco estrutural.

<b>NOVO:</b> Recém-construídas (menos de 3 meses).

<b>Considerações sobre Construções Novas:</b>
É comum ocorrerem acomodações estruturais nos primeiros 24 meses, resultando em microfissuras.`,
};

export const DADOS_CAPA_PADRAO: DadosCapa = {
  empreendimento: '',
  localObra: '',
  solicitante: '',
  cnpj: '',
  volumeAtual: 1,
  totalVolumes: 1,
};

export const SECOES_NAVEGAVEIS: SecaoNavegavel[] = [
  { id: 'capa', label: 'Capa' },
  { id: 'indice', label: 'Índice' },
  { id: 'introducao', label: 'I. Introdução' },
  { id: 'objeto', label: 'II. Objeto' },
  { id: 'objetivo', label: 'III. Objetivo' },
  { id: 'finalidade', label: 'IV. Finalidade' },
  { id: 'responsabilidades', label: 'V. Responsabilidades' },
  { id: 'classificacao', label: 'VI. Classificação' },
  { id: 'lindeiros', label: 'VII. Vistoria dos Lindeiros' },
];
