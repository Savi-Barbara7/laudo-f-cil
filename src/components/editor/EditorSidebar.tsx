import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SecaoId, Lindeiro } from '@/types/laudo';
import {
  Home, List, MapPin, Map, FileCheck,
  FolderOpen, ClipboardList, CheckSquare, BookOpen, ChevronRight,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  capa: Home,
  indice: List,
  lindeiros: MapPin,
  croqui: Map,
  art: FileCheck,
  documentacoes: FolderOpen,
  fichas: ClipboardList,
  conclusao: CheckSquare,
};

interface EditorSidebarProps {
  secaoAtiva: SecaoId;
  onSecaoClick: (id: SecaoId) => void;
  lindeiros: Lindeiro[];
  titulo?: string;
}

export function EditorSidebar({ secaoAtiva, onSecaoClick, lindeiros, titulo }: EditorSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col h-full overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="border-b border-sidebar-border px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-2">
          Seções do Laudo
        </p>
        {titulo && (
          <p className="text-xs text-sidebar-foreground/60 truncate">{titulo}</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 p-2 py-3">
          {SECOES_NAVEGAVEIS.map((secao) => {
            const isActive = secaoAtiva === secao.id;
            const Icon = iconMap[secao.id] ?? BookOpen;
            return (
              <button
                key={secao.id}
                onClick={() => onSecaoClick(secao.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                {/* Step bubble */}
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                  isActive
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-sidebar-border/60 text-sidebar-foreground/50'
                )}>
                  <Icon size={12} />
                </div>

                <span className="truncate text-[13px]">{secao.label}</span>

                {isActive && (
                  <ChevronRight size={14} className="ml-auto flex-shrink-0 text-sidebar-foreground/60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Lindeiros sub-list */}
        {lindeiros.length > 0 && (
          <div className="border-t border-sidebar-border px-2 pt-2 pb-4">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
              Lindeiros ({lindeiros.length})
            </p>
            {lindeiros.map((l, i) => (
              <button
                key={l.id}
                onClick={() => onSecaoClick('lindeiros')}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-xs text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-[10px] font-bold text-sidebar-accent-foreground">
                  {i + 1}
                </span>
                <span className="truncate">{l.endereco || `Lindeiro ${i + 1}`}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
