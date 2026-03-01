import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Loader2, Shield, Save } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  titulo: string;
  onTituloChange: (titulo: string) => void;
  onVoltar: () => void;
  onExportPDF?: () => Promise<void>;
}

export function EditorToolbar({ titulo, onTituloChange, onVoltar, onExportPDF }: EditorToolbarProps) {
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(true);

  const handleExport = async () => {
    if (!onExportPDF) return;
    setExporting(true);
    try {
      await onExportPDF();
    } finally {
      setExporting(false);
    }
  };

  return (
    <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-4 shadow-sm shrink-0">
      {/* Back */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onVoltar}
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shadow-sm">
          <Shield className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="hidden text-[13px] font-bold tracking-tight text-foreground sm:block">LVL PRO</span>
      </div>

      <div className="h-5 w-px bg-border shrink-0" />

      {/* Title input */}
      <Input
        value={titulo}
        onChange={(e) => { onTituloChange(e.target.value); setSaved(false); setTimeout(() => setSaved(true), 2000); }}
        className="h-8 flex-1 max-w-sm border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
        placeholder="Título do laudo"
      />

      <div className="flex-1" />

      {/* Auto-save indicator */}
      <div className={cn(
        'hidden items-center gap-1.5 text-xs transition-opacity sm:flex',
        saved ? 'text-muted-foreground opacity-70' : 'text-warning opacity-100'
      )}>
        <Save className="h-3.5 w-3.5" />
        <span>{saved ? 'Salvo' : 'Salvando...'}</span>
      </div>

      {/* Export */}
      {onExportPDF && (
        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 h-8 shadow-sm"
        >
          {exporting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          {exporting ? 'Gerando...' : 'Exportar PDF'}
        </Button>
      )}
    </header>
  );
}
