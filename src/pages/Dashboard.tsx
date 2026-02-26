import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Trash2, ChevronRight, ChevronDown, CheckCircle, Clock, MapPin, Shield, FolderOpen, Folder, LogOut, Loader2, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Periodo = 'este-mes' | 'ultimo-mes' | '3-meses' | 'este-ano' | 'todos';

interface ObraRow { id: string; nome: string }

function filtroPeriodo(dateStr: string, periodo: Periodo): boolean {
  if (periodo === 'todos') return true;
  const d = new Date(dateStr);
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  switch (periodo) {
    case 'este-mes': return d.getFullYear() === y && d.getMonth() === m;
    case 'ultimo-mes': { const pm = m === 0 ? 11 : m - 1; const py = m === 0 ? y - 1 : y; return d.getFullYear() === py && d.getMonth() === pm; }
    case '3-meses': return d >= new Date(y, m - 2, 1);
    case 'este-ano': return d.getFullYear() === y;
    default: return true;
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { laudos, loading, criarLaudo, removerLaudo, duplicarLaudo } = useLaudoStore();
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('Novo Laudo Cautelar');
  const [novaObra, setNovaObra] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [obras, setObras] = useState<ObraRow[]>([]);
  const [expandedObras, setExpandedObras] = useState<Set<string>>(new Set());

  useEffect(() => {
    (supabase.from('obras') as any).select('id, nome').then(({ data }: any) => {
      if (data) setObras(data);
    });
  }, [laudos]);

  const handleCriarLaudo = async () => {
    const id = await criarLaudo(novoTitulo || 'Novo Laudo Cautelar', novaObra || undefined);
    setNovoDialogOpen(false);
    setNovoTitulo('Novo Laudo Cautelar');
    setNovaObra('');
    if (id) navigate(`/laudos/${id}/editor`);
  };

  const handleDuplicar = async (laudoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = await duplicarLaudo(laudoId);
    if (newId) {
      toast({ title: 'Laudo duplicado!', description: 'O laudo foi copiado como rascunho.' });
      navigate(`/laudos/${newId}/editor`);
    }
  };

  const laudosFiltrados = useMemo(() => laudos.filter(l => filtroPeriodo(l.criadoEm, periodo)), [laudos, periodo]);

  const metricas = useMemo(() => {
    const total = laudosFiltrados.length;
    const finalizados = laudosFiltrados.filter(l => l.status === 'finalizado').length;
    return { total, finalizados, rascunhos: total - finalizados, lindeirosTotal: laudosFiltrados.reduce((a, l) => a + l.lindeiros.length, 0) };
  }, [laudosFiltrados]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof laudos> = {};
    laudosFiltrados.forEach(l => {
      const key = l.obraId || 'sem-obra';
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [laudosFiltrados]);

  const toggleObra = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedObras(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const obraKeys = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      if (a === 'sem-obra') return 1;
      if (b === 'sem-obra') return -1;
      const na = obras.find(o => o.id === a)?.nome || a;
      const nb = obras.find(o => o.id === b)?.nome || b;
      return na.localeCompare(nb);
    });
  }, [grouped, obras]);

  const metricCards = [
    { label: 'Laudos no Período', value: metricas.total, icon: FileText, color: 'text-primary' },
    { label: 'Finalizados', value: metricas.finalizados, icon: CheckCircle, color: 'text-success' },
    { label: 'Em Andamento', value: metricas.rascunhos, icon: Clock, color: 'text-warning' },
    { label: 'Lindeiros', value: metricas.lindeirosTotal, icon: MapPin, color: 'text-primary' },
  ];

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center gap-3">
            <Dialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm"><Plus className="h-4 w-4" />Novo Laudo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Novo Laudo</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Título do Laudo</Label>
                    <Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Novo Laudo Cautelar" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da Obra</Label>
                    <Input value={novaObra} onChange={e => setNovaObra(e.target.value)} placeholder="Ex: Residencial Vila Nova" />
                    <p className="text-xs text-muted-foreground">Laudos da mesma obra ficam agrupados</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNovoDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCriarLaudo}>Criar Laudo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
          <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="este-mes">Este mês</SelectItem>
              <SelectItem value="ultimo-mes">Último mês</SelectItem>
              <SelectItem value="3-meses">Últimos 3 meses</SelectItem>
              <SelectItem value="este-ano">Este ano</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCards.map(m => (
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
              <Button onClick={() => setNovoDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Laudo</Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Obras</h3>
            <div className="space-y-1">
              {obraKeys.map(obraKey => {
                const obraInfo = obras.find(o => o.id === obraKey);
                const obraNome = obraKey === 'sem-obra' ? 'Sem obra' : (obraInfo?.nome || obraKey);
                const isExpanded = expandedObras.has(obraKey);
                const obraLaudos = grouped[obraKey];

                return (
                  <div key={obraKey}>
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                      onClick={(e) => toggleObra(obraKey, e)}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      {isExpanded ? <FolderOpen className="h-5 w-5 text-primary" /> : <Folder className="h-5 w-5 text-primary" />}
                      <span className="flex-1 text-sm font-medium text-foreground">{obraNome}</span>
                      <Badge variant="secondary" className="font-normal text-xs">{obraLaudos.length}</Badge>
                    </button>

                    {isExpanded && (
                      <div className="ml-6 border-l border-muted pl-4">
                        {obraLaudos.map(laudo => (
                          <div
                            key={laudo.id}
                            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/40"
                            onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{laudo.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                Vol. {laudo.dadosCapa.volumeAtual}/{laudo.dadosCapa.totalVolumes} · {laudo.lindeiros.length} lindeiro(s) · {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge
                              variant={laudo.status === 'finalizado' ? 'default' : 'secondary'}
                              className={laudo.status === 'finalizado' ? 'bg-success text-success-foreground' : 'bg-warning/15 text-warning border-0'}
                            >
                              {laudo.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                            </Badge>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={(e) => handleDuplicar(laudo.id, e)}
                              title="Duplicar laudo"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                              onClick={e => { e.stopPropagation(); removerLaudo(laudo.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
