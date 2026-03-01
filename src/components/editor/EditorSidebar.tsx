import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SecaoId, Lindeiro } from '@/types/laudo';
import {
  FileText, Home, List, BookOpen, MapPin, Map,
  FileCheck, FolderOpen, CheckCircle, ClipboardList,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  capa: <Home className="h-4 w-4" />,
  indice: <List className="h-4 w-4" />,
  lindeiros: <MapPin className="h-4 w-4" />,
  croqui: <Map className="h-4 w-4" />,
  art: <FileCheck className="h-4 w-4" />,
  documentacoes: <FolderOpen className="h-4 w-4" />,
  fichas: <ClipboardList className="h-4 w-4" />,
  conclusao: <CheckCircle className="h-4 w-4" />,
};

interface EditorSidebarProps {
  secaoAtiva: SecaoId;
  onSecaoClick: (id: SecaoId) => void;
  lindeiros: Lindeiro[];
}

export function EditorSidebar({ secaoAtiva, onSecaoClick, lindeiros }: EditorSidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Seções
        </p>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-0.5 p-2">
          {SECOES_NAVEGAVEIS.map((secao) => {
            const isActive = secaoAtiva === secao.id;
            return (
              <button
                key={secao.id}
                onClick={() => onSecaoClick(secao.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                    : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <span className={cn(isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/40')}>
                  {iconMap[secao.id] || <BookOpen className="h-4 w-4" />}
                </span>
                <span className="truncate">{secao.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Lindeiros sub-list */}
        {lindeiros.length > 0 && (
          <div className="border-t border-sidebar-border px-2 pt-2 pb-3">
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
