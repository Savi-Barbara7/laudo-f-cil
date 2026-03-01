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
  estadoConservacao: 'Bom' | 'Regular' | 'Ruim' | 'Novo' | 'N/A';
  ambientes: Ambiente[];
  acompanhante?: string;
  caracteristicasGerais?: string;
}

// Volume 1 especial: Canteiro + Entorno + Drone
export interface FotoCategoria {
  id: string;
  dataUrl: string;
  legenda: string;
  ordem: number;
  categoria: 'canteiro' | 'entorno' | 'drone';
}

export interface CanteiroVolume {
  endereco: string;
  dataVistoria: string;
  caracteristicasGerais: string;
  fotos: FotoCategoria[];
}

// Volume genérico (Volume 2..N = Lindeiro)
export interface Volume {
  id: string;
  numero: number; // 1-based, Volume 1 = canteiro
  label: string;  // ex: "Volume 2 — Lindeiro 1"
  lindeiro?: Lindeiro; // só para volumes de lindeiro
}

export interface CroquiImage {
  id: string;
  url: string;
  legenda: string;
}

export interface Documentacao {
  id: string;
  nome: string;
  imagens: string[];
}

export interface DadosCapa {
  empreendimento: string;
  localObra: string;
  solicitante: string;
  cnpj: string;
  volumeAtual: number;
  totalVolumes: number;
  fotoCapaUrl?: string;
  // Campos adicionais automação
  datasVistorias?: string;
  terrenoBenfeitorias?: string;
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
  // Nova estrutura de volumes
  volumes: Volume[];
  canteiroVolume?: CanteiroVolume;
  // Legado (lindeiros diretos — manter compatibilidade)
  lindeiros: Lindeiro[];
  croquiImages: CroquiImage[];
  artImages: string[];
  documentacoes: Documentacao[];
  fichas: Documentacao[];
  conclusao: string;
  obra: string;
  criadoEm: string;
  atualizadoEm: string;
  // Rich text HTML content for sections
  croquiRichText?: string;
  artRichText?: string;
  documentacoesRichText?: string;
  fichasRichText?: string;
  // DB reference
  obraId?: string;
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
  | 'canteiro'     // Volume 1
  | `lindeiro-${string}` // Volume 2..N (por ID)
  | 'lindeiros'    // legado
  | 'croqui'
  | 'art'
  | 'documentacoes'
  | 'fichas'
  | 'conclusao';

export interface SecaoNavegavel {
  id: SecaoId;
  label: string;
  subsecoes?: { id: string; label: string }[];
}
