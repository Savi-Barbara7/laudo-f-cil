import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SecaoId, Lindeiro } from '@/types/laudo';
import { FileText, Home, List, BookOpen, MapPin, Map, FileCheck, FolderOpen, CheckCircle } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  capa: <Home className="h-4 w-4" />,
  indice: <List className="h-4 w-4" />,
  lindeiros: <MapPin className="h-4 w-4" />,
  croqui: <Map className="h-4 w-4" />,
  art: <FileCheck className="h-4 w-4" />,
  documentacoes: <FolderOpen className="h-4 w-4" />,
  conclusao: <CheckCircle className="h-4 w-4" />,
};

interface EditorSidebarProps {
  secaoAtiva: SecaoId;
  onSecaoClick: (id: SecaoId) => void;
  lindeiros: Lindeiro[];
}

export function EditorSidebar({ secaoAtiva, onSecaoClick, lindeiros }: EditorSidebarProps) {
  return (
    <aside className="flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-3.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
          Navegação
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-0.5 p-2">
          {SECOES_NAVEGAVEIS.map((secao) => (
            <button
              key={secao.id}
              onClick={() => onSecaoClick(secao.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-all duration-150',
                secaoAtiva === secao.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground'
              )}
            >
              {iconMap[secao.id] || <BookOpen className="h-4 w-4" />}
              <span>{secao.label}</span>
            </button>
          ))}
        </nav>

        {lindeiros.length > 0 && (
          <div className="border-t border-sidebar-border px-2 py-2">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Lindeiros
            </p>
            {lindeiros.map((l, i) => (
              <button
                key={l.id}
                onClick={() => onSecaoClick('lindeiros')}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-sidebar-accent text-[10px] font-bold text-sidebar-accent-foreground">
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
