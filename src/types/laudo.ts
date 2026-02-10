export interface Foto {
  id: string;
  dataUrl: string;
  legenda: string;
  ordem: number;
}

export interface Ambiente {
  id: string;
  nome: string;
  fotos: Foto[];
}

export interface Lindeiro {
  id: string;
  tipoImovel: 'Casa' | 'Prédio' | 'Condomínio' | 'Loja' | 'Galpão' | 'Terreno' | 'Outro';
  tipoUso: 'Residencial' | 'Comercial' | 'Misto' | 'Industrial' | 'Público';
  endereco: string;
  responsavel: string;
  telefone: string;
  dataVistoria: string;
  descricao: string;
  estadoConservacao: 'Bom' | 'Regular' | 'Ruim' | 'Novo';
  ambientes: Ambiente[];
}

export interface DadosCapa {
  empreendimento: string;
  localObra: string;
  solicitante: string;
  cnpj: string;
  volumeAtual: number;
  totalVolumes: number;
  fotoCapaUrl?: string;
}

export interface TextosSecoes {
  introducao: string;
  objeto: string;
  objetivo: string;
  finalidade: string;
  responsabilidades: string;
  classificacao: string;
}

export type StatusLaudo = 'rascunho' | 'finalizado';

export interface Laudo {
  id: string;
  titulo: string;
  status: StatusLaudo;
  dadosCapa: DadosCapa;
  textos: TextosSecoes;
  lindeiros: Lindeiro[];
  criadoEm: string;
  atualizadoEm: string;
}

export type SecaoId = 
  | 'capa'
  | 'indice'
  | 'introducao'
  | 'objeto'
  | 'objetivo'
  | 'finalidade'
  | 'responsabilidades'
  | 'classificacao'
  | 'lindeiros';

export interface SecaoNavegavel {
  id: SecaoId;
  label: string;
  subsecoes?: { id: string; label: string }[];
}
