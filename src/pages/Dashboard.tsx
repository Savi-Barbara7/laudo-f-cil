import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Trash2, ChevronDown, Building2, CheckCircle, Clock, MapPin, Shield } from 'lucide-react';

type Periodo = 'este-mes' | 'ultimo-mes' | '3-meses' | 'este-ano' | 'todos';

function filtroPeriodo(dateStr: string, periodo: Periodo): boolean {
  if (periodo === 'todos') return true;
  const d = new Date(dateStr);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (periodo) {
    case 'este-mes':
      return d.getFullYear() === y && d.getMonth() === m;
    case 'ultimo-mes': {
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      return d.getFullYear() === py && d.getMonth() === pm;
    }
    case '3-meses': {
      const threshold = new Date(y, m - 2, 1);
      return d >= threshold;
    }
    case 'este-ano':
      return d.getFullYear() === y;
    default:
      return true;
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { laudos, criarLaudo, removerLaudo, atualizarLaudo } = useLaudoStore();
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('Novo Laudo Cautelar');
  const [novaObra, setNovaObra] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('todos');

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

  const laudosFiltrados = useMemo(() => laudos.filter(l => filtroPeriodo(l.criadoEm, periodo)), [laudos, periodo]);

  const metricas = useMemo(() => {
    const total = laudosFiltrados.length;
    const finalizados = laudosFiltrados.filter(l => l.status === 'finalizado').length;
    const rascunhos = total - finalizados;
    const lindeirosTotal = laudosFiltrados.reduce((acc, l) => acc + l.lindeiros.length, 0);
    return { total, finalizados, rascunhos, lindeirosTotal };
  }, [laudosFiltrados]);

  const ultimosLaudos = useMemo(() =>
    [...laudosFiltrados].sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()).slice(0, 5),
    [laudosFiltrados]
  );

  const grouped = laudosFiltrados.reduce<Record<string, typeof laudos>>((acc, laudo) => {
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

  const metricCards = [
    { label: 'Laudos no Período', value: metricas.total, icon: FileText, color: 'text-primary' },
    { label: 'Finalizados', value: metricas.finalizados, icon: CheckCircle, color: 'text-success' },
    { label: 'Em Andamento', value: metricas.rascunhos, icon: Clock, color: 'text-warning' },
    { label: 'Lindeiros', value: metricas.lindeirosTotal, icon: MapPin, color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">LVL PRO</h1>
              <p className="text-xs text-muted-foreground">Laudos Técnicos de Vistoria</p>
            </div>
          </div>
          <Dialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Novo Laudo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Laudo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título do Laudo</Label>
                  <Input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Novo Laudo Cautelar" />
                </div>
                <div className="space-y-2">
                  <Label>Nome da Obra</Label>
                  <Input value={novaObra} onChange={(e) => setNovaObra(e.target.value)} placeholder="Ex: Residencial Vila Nova" />
                  <p className="text-xs text-muted-foreground">Laudos da mesma obra ficam agrupados</p>
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Filter */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="este-mes">Este mês</SelectItem>
              <SelectItem value="ultimo-mes">Último mês</SelectItem>
              <SelectItem value="3-meses">Últimos 3 meses</SelectItem>
              <SelectItem value="este-ano">Este ano</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metric Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCards.map((m) => (
            <Card key={m.label} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${m.color}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {laudos.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <CardContent>
              <FileText className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
              <h2 className="mb-2 text-lg font-semibold text-foreground">Nenhum laudo criado</h2>
              <p className="mb-6 text-sm text-muted-foreground">Clique em "Novo Laudo" para começar</p>
              <Button onClick={() => setNovoDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Laudo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Recent Laudos Table */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Últimos Laudos</h3>
              <Card>
                <div className="divide-y">
                  {ultimosLaudos.map((laudo) => (
                    <div
                      key={laudo.id}
                      className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                      onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{laudo.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {(laudo as any).obra || 'Sem obra'} · Vol. {laudo.dadosCapa.volumeAtual}/{laudo.dadosCapa.totalVolumes}
                        </p>
                      </div>
                      <Badge
                        variant={laudo.status === 'finalizado' ? 'default' : 'secondary'}
                        className={laudo.status === 'finalizado' ? 'bg-success text-success-foreground' : 'bg-warning/15 text-warning border-0'}
                      >
                        {laudo.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Grouped by Obra */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Obras</h3>
              <div className="space-y-3">
                {obraKeys.map((obra) => (
                  <Collapsible key={obra} defaultOpen>
                    <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-lg border bg-card px-5 py-3.5 text-left shadow-sm transition-colors hover:bg-muted/50">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="flex-1 text-sm font-semibold text-foreground">{obra}</span>
                      <Badge variant="secondary" className="font-normal">{grouped[obra].length} volume(s)</Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid gap-3 pt-3 md:grid-cols-2 lg:grid-cols-3">
                        {grouped[obra].map((laudo) => (
                          <Card
                            key={laudo.id}
                            className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                          >
                            <CardContent className="p-5">
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-foreground leading-snug">{laudo.titulo}</h4>
                                <Badge
                                  variant={laudo.status === 'finalizado' ? 'default' : 'secondary'}
                                  className={`shrink-0 ${laudo.status === 'finalizado' ? 'bg-success text-success-foreground' : 'bg-warning/15 text-warning border-0'}`}
                                >
                                  {laudo.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                                </Badge>
                              </div>
                              <p className="mb-3 text-xs text-muted-foreground">
                                {laudo.dadosCapa.empreendimento || 'Sem empreendimento'}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Vol. {laudo.dadosCapa.volumeAtual}/{laudo.dadosCapa.totalVolumes} · {laudo.lindeiros.length} lindeiro(s)</span>
                                <span>{new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="mt-3 flex justify-end border-t pt-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => { e.stopPropagation(); removerLaudo(laudo.id); }}
                                >
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
