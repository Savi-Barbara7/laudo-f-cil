import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import mammoth from 'mammoth';
import { toast } from '@/hooks/use-toast';

interface WordImportButtonProps {
  onImport: (html: string) => void;
  label?: string;
}

export function WordImportButton({ onImport, label = 'Importar Word (.docx)' }: WordImportButtonProps) {
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.docx')) {
        toast({ title: 'Formato não suportado', description: 'Apenas arquivos .docx são aceitos. Salve o arquivo .doc como .docx no Word e tente novamente.', variant: 'destructive' });
        return;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        onImport(result.value);
        toast({ title: 'Documento Word importado!' });
        if (result.messages.length > 0) {
          console.warn('Mammoth warnings:', result.messages);
        }
      } catch (err) {
        toast({ title: 'Erro ao importar Word', description: String(err), variant: 'destructive' });
      }
    };
    input.click();
  }, [onImport]);

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleImport}>
      <FileUp className="h-4 w-4" />
      {label}
    </Button>
  );
}
