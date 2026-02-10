import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Download } from 'lucide-react';

interface EditorToolbarProps {
  titulo: string;
  onTituloChange: (titulo: string) => void;
  onVoltar: () => void;
}

export function EditorToolbar({ titulo, onTituloChange, onVoltar }: EditorToolbarProps) {
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
    </header>
  );
}
