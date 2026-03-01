import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Loader2, FileText, Save, Cloud, CloudOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EditorToolbarProps {
  titulo: string;
  status?: string;
  onTituloChange: (titulo: string) => void;
  onVoltar: () => void;
  onExportPDF?: () => Promise<void>;
}

const STATUS_BADGE: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  finalizado: 'bg-green-100 text-green-800 border-green-200',
};
const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
};

export function EditorToolbar({ titulo, status = 'rascunho', onTituloChange, onVoltar, onExportPDF }: EditorToolbarProps) {
  const [exporting, setExporting] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'idle'>('saved');

  const handleExport = async () => {
    if (!onExportPDF) return;
    setExporting(true);
    try {
      await onExportPDF();
    } finally {
      setExporting(false);
    }
  };

  const handleTituloChange = (v: string) => {
    onTituloChange(v);
    setSaveState('saving');
    setTimeout(() => setSaveState('saved'), 1800);
  };

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border bg-card px-4 shrink-0">
      {/* Back */}
      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Meus Laudos</span>
      </button>

      <div className="h-4 w-px bg-border shrink-0" />

      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
          <FileText size={12} className="text-primary-foreground" />
        </div>
        <span className="hidden text-[13px] font-bold tracking-tight text-foreground sm:block">LVL Pro</span>
      </div>

      <div className="h-4 w-px bg-border shrink-0" />

      {/* Title input */}
      <Input
        value={titulo}
        onChange={e => handleTituloChange(e.target.value)}
        className="h-8 flex-1 max-w-sm border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-1"
        placeholder="Título do laudo"
      />

      <div className="flex-1" />

      {/* Status badge */}
      {status && (
        <Badge
          variant="outline"
          className={cn('text-xs border hidden sm:inline-flex', STATUS_BADGE[status] ?? STATUS_BADGE.rascunho)}
        >
          {STATUS_LABEL[status] ?? status}
        </Badge>
      )}

      {/* Save indicator */}
      <div className={cn(
        'hidden items-center gap-1.5 text-xs transition-all sm:flex',
        saveState === 'saving' ? 'text-warning' : 'text-muted-foreground opacity-60'
      )}>
        {saveState === 'saving'
          ? <><Loader2 size={12} className="animate-spin" /> Salvando...</>
          : <><Cloud size={12} /> Salvo</>
        }
      </div>

      {/* Export PDF */}
      {onExportPDF && (
        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 h-8"
        >
          {exporting
            ? <Loader2 size={13} className="animate-spin" />
            : <Download size={13} />}
          {exporting ? 'Gerando...' : 'Exportar PDF'}
        </Button>
      )}
    </header>
  );
}
