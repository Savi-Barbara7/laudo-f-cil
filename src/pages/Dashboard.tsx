import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, ChevronDown, Building2 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { laudos, criarLaudo, removerLaudo, atualizarLaudo } = useLaudoStore();
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('Novo Laudo Cautelar');
  const [novaObra, setNovaObra] = useState('');

  const handleCriarLaudo = () => {
    const id = criarLaudo(novoTitulo || 'Novo Laudo Cautelar');
    if (novaObra) {
      atualizarLaudo(id, { obra: novaObra } as any);
    }
    setNovoDialogOpen(false);
    setNovoTitulo('Novo Laudo Cautelar');
    setNovaObra('');
    navigate(`/laudos/${id}/editor`);
  };

  // Group by obra
  const grouped = laudos.reduce<Record<string, typeof laudos>>((acc, laudo) => {
    const key = (laudo as any).obra || 'Sem obra';
    if (!acc[key]) acc[key] = [];
    acc[key].push(laudo);
    return acc;
  }, {});

  const obraKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'Sem obra') return 1;
    if (b === 'Sem obra') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>LVL PRO</h1>
            <p className="text-sm text-muted-foreground">Editor de Laudos Técnicos de Vistoria Cautelar</p>
          </div>
          <Dialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Novo Laudo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Laudo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Título do Laudo</Label>
                  <Input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Novo Laudo Cautelar" />
                </div>
                <div>
                  <Label>Nome da Obra (para agrupar volumes)</Label>
                  <Input value={novaObra} onChange={(e) => setNovaObra(e.target.value)} placeholder="Ex: Residencial Vila Nova" />
                  <p className="mt-1 text-xs text-muted-foreground">Laudos da mesma obra ficam agrupados no dashboard</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNovoDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCriarLaudo}>Criar Laudo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        {laudos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">Nenhum laudo criado</h2>
            <p className="mb-6 text-muted-foreground">Clique em "Criar Novo Laudo" para começar a trabalhar</p>
            <Button onClick={() => setNovoDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Novo Laudo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {obraKeys.map((obra) => (
              <Collapsible key={obra} defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left hover:bg-accent/50 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="flex-1 font-semibold">{obra}</span>
                  <Badge variant="secondary">{grouped[obra].length} volume(s)</Badge>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-3 pt-3 md:grid-cols-2 lg:grid-cols-3">
                    {grouped[obra].map((laudo) => (
                      <Card key={laudo.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/laudos/${laudo.id}/editor`)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{laudo.titulo}</CardTitle>
                            <Badge variant={laudo.status === 'finalizado' ? 'default' : 'secondary'}>
                              {laudo.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                            </Badge>
                          </div>
                          <CardDescription>
                            {laudo.dadosCapa.empreendimento || 'Sem empreendimento definido'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Vol. {laudo.dadosCapa.volumeAtual}/{laudo.dadosCapa.totalVolumes}</span>
                            <span>{laudo.lindeiros.length} lindeiro(s)</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removerLaudo(laudo.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
