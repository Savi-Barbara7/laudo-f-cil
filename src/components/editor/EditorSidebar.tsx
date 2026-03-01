import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SecaoId, Lindeiro } from '@/types/laudo';
import {
  Home, List, MapPin, Map, FileCheck, Building2,
  FolderOpen, ClipboardList, CheckSquare, BookOpen, ChevronRight,
  FileText, Layers, Target, Shield, Star, Users,
  type LucideIcon,
} from 'lucide-react';

interface SecaoItem {
  id: SecaoId;
  label: string;
  icon: LucideIcon;
  group?: string;
  numero?: string;
}

const SECOES_FIXAS_TOP: SecaoItem[] = [
  { id: 'capa', label: 'Capa', icon: Home },
  { id: 'indice', label: 'Índice', icon: List },
];

const SECOES_INFOS: SecaoItem[] = [
  { id: 'introducao', label: 'Introdução', icon: BookOpen, numero: '1' },
  { id: 'objeto', label: 'Objeto', icon: FileText, numero: '2' },
  { id: 'objetivo', label: 'Objetivo', icon: Target, numero: '3' },
  { id: 'finalidade', label: 'Finalidade', icon: Star, numero: '4' },
  { id: 'responsabilidades', label: 'Responsabilidades', icon: Shield, numero: '5' },
  { id: 'classificacao', label: 'Classificação', icon: Layers, numero: '6' },
];

const SECOES_FIXAS_BOTTOM: SecaoItem[] = [
  { id: 'croqui', label: 'Croqui', icon: Map },
  { id: 'art', label: 'ART', icon: FileCheck },
  { id: 'documentacoes', label: 'Documentações', icon: FolderOpen },
  { id: 'fichas', label: 'Fichas / Anexos', icon: ClipboardList },
  { id: 'conclusao', label: 'Conclusão', icon: CheckSquare },
];

interface EditorSidebarProps {
  secaoAtiva: SecaoId;
  onSecaoClick: (id: SecaoId) => void;
  lindeiros: Lindeiro[];
  titulo?: string;
}

function NavBtn({ item, isActive, onClick }: { item: SecaoItem; isActive: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 w-full group',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
      )}
    >
      <div className={cn(
        'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all',
        isActive
          ? 'bg-white/20 text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/40'
      )}>
        {item.numero ? (
          <span className="text-[10px] font-bold">{item.numero}</span>
        ) : (
          <Icon size={11} />
        )}
      </div>
      <span className="truncate text-[12px]">{item.label}</span>
      {isActive && <ChevronRight size={12} className="ml-auto flex-shrink-0 opacity-50" />}
    </button>
  );
}

export function EditorSidebar({ secaoAtiva, onSecaoClick, lindeiros, titulo }: EditorSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col h-full overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Header */}
      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
            <FileText size={12} className="text-sidebar-foreground/80" />
          </div>
          <span className="text-[11px] font-bold text-sidebar-foreground/80 uppercase tracking-wider">LVL Pro</span>
        </div>
        {titulo && (
          <p className="text-[11px] text-sidebar-foreground/40 truncate leading-tight mt-0.5">{titulo}</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 p-2">
          {/* Capa + Índice */}
          {SECOES_FIXAS_TOP.map(s => (
            <NavBtn key={s.id} item={s} isActive={secaoAtiva === s.id} onClick={() => onSecaoClick(s.id)} />
          ))}

          {/* Informações Gerais */}
          <div className="pt-2 pb-1 px-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/25">
              I. Informações Gerais
            </p>
          </div>
          {SECOES_INFOS.map(s => (
            <NavBtn key={s.id} item={s} isActive={secaoAtiva === s.id} onClick={() => onSecaoClick(s.id)} />
          ))}

          {/* Volume 1 — Canteiro */}
          <div className="pt-2 pb-1 px-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/25">
              II. Volumes
            </p>
          </div>
          <button
            onClick={() => onSecaoClick('canteiro')}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all w-full',
              secaoAtiva === 'canteiro'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
              secaoAtiva === 'canteiro' ? 'bg-white/20' : 'text-sidebar-foreground/40'
            )}>1</div>
            <span className="truncate text-[12px]">Canteiro / Entorno</span>
            {secaoAtiva === 'canteiro' && <ChevronRight size={12} className="ml-auto flex-shrink-0 opacity-50" />}
          </button>

          {/* Volumes de Lindeiro */}
          {lindeiros.map((lind, i) => {
            const secaoId = `lindeiro-${lind.id}` as SecaoId;
            const isActive = secaoAtiva === secaoId;
            return (
              <button
                key={lind.id}
                onClick={() => onSecaoClick(secaoId)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all w-full',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                  isActive ? 'bg-white/20 text-sidebar-accent-foreground' : 'bg-sidebar-accent/40 text-sidebar-foreground/50'
                )}>
                  {i + 2}
                </div>
                <span className="truncate text-[12px]">
                  {lind.endereco ? lind.endereco.slice(0, 18) + (lind.endereco.length > 18 ? '…' : '') : `Lindeiro ${i + 1}`}
                </span>
                {isActive && <ChevronRight size={12} className="ml-auto flex-shrink-0 opacity-50" />}
              </button>
            );
          })}

          {/* Botão para ir à seção lindeiros (adicionar) */}
          <button
            onClick={() => onSecaoClick('lindeiros')}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all w-full mt-0.5',
              secaoAtiva === 'lindeiros'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground/30 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/60'
            )}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <Users size={10} className="opacity-60" />
            </div>
            <span className="text-[11px]">+ Gerenciar lindeiros</span>
          </button>

          {/* Seções finais */}
          <div className="pt-2 pb-1 px-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-sidebar-foreground/25">
              Anexos &amp; Conclusão
            </p>
          </div>
          {SECOES_FIXAS_BOTTOM.map(s => (
            <NavBtn key={s.id} item={s} isActive={secaoAtiva === s.id} onClick={() => onSecaoClick(s.id)} />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
