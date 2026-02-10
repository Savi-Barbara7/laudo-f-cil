import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface EditorToolbarProps {
  titulo: string;
  onTituloChange: (titulo: string) => void;
  onVoltar: () => void;
  onExportPDF?: () => Promise<void>;
}

export function EditorToolbar({ titulo, onTituloChange, onVoltar, onExportPDF }: EditorToolbarProps) {
  const [exporting, setExporting] = useState(false);

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
    <header className="flex items-center gap-3 border-b bg-toolbar-bg px-4 py-2" style={{ borderColor: 'hsl(var(--toolbar-border))' }}>
      <Button variant="ghost" size="icon" onClick={onVoltar} className="h-8 w-8">
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border" />

      <Input
        value={titulo}
        onChange={(e) => onTituloChange(e.target.value)}
        className="h-8 max-w-xs border-none bg-transparent text-sm font-semibold shadow-none focus-visible:ring-1"
      />

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground">Salvo automaticamente</span>

      {onExportPDF && (
        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Gerando...' : 'Exportar PDF'}
        </Button>
      )}
    </header>
  );
}
