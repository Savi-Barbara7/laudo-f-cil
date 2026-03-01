import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, FileText, Trash2, ChevronRight, ChevronDown,
  CheckCircle, Clock, MapPin, Shield, FolderOpen, Folder,
  LogOut, Loader2, Copy, BarChart3
} from 'lucide-react';
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
  }, []);

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
    return {
      total,
      finalizados,
      rascunhos: total - finalizados,
      lindeirosTotal: laudosFiltrados.reduce((a, l) => a + l.lindeiros.length, 0),
    };
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total no Período', value: metricas.total, icon: BarChart3, accent: 'bg-primary/10 text-primary', border: 'border-border' },
    { label: 'Finalizados', value: metricas.finalizados, icon: CheckCircle, accent: 'bg-success/10 text-success', border: 'border-border' },
    { label: 'Em Andamento', value: metricas.rascunhos, icon: Clock, accent: 'bg-warning/10 text-warning', border: 'border-border' },
    { label: 'Lindeiros', value: metricas.lindeirosTotal, icon: MapPin, accent: 'bg-secondary text-secondary-foreground', border: 'border-border' },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Shield className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-foreground">LVL PRO</h1>
              <p className="text-[11px] text-muted-foreground">Laudos Técnicos de Vistoria</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" /> Novo Laudo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base">Criar Novo Laudo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título do Laudo</Label>
                    <Input value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Novo Laudo Cautelar" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome da Obra</Label>
                    <Input value={novaObra} onChange={e => setNovaObra(e.target.value)} placeholder="Ex: Residencial Vila Nova" />
                    <p className="text-xs text-muted-foreground">Laudos da mesma obra ficam agrupados</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setNovoDialogOpen(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleCriarLaudo}>Criar Laudo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon" onClick={signOut} className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 animate-fade-in">
        {/* ── Period filter ───────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
            <p className="text-sm text-muted-foreground">Acompanhe e gerencie seus laudos</p>
          </div>
          <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
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

        {/* ── Metrics ─────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCards.map(m => (
            <div key={m.label} className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${m.border}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.accent}`}>
                  <m.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        {laudos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <h2 className="mb-1 text-base font-semibold text-foreground">Nenhum laudo criado</h2>
                <p className="text-sm text-muted-foreground">Clique em "Novo Laudo" para começar</p>
              </div>
              <Button onClick={() => setNovoDialogOpen(true)} size="sm" className="mt-2 gap-2">
                <Plus className="h-4 w-4" /> Novo Laudo
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="border-b border-border bg-muted/40 px-5 py-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Obras &amp; Laudos</h3>
              <span className="text-xs text-muted-foreground">{laudos.length} laudo{laudos.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="divide-y divide-border/60">
              {obraKeys.map(obraKey => {
                const obraInfo = obras.find(o => o.id === obraKey);
                const obraNome = obraKey === 'sem-obra' ? 'Sem obra vinculada' : (obraInfo?.nome || obraKey);
                const isExpanded = expandedObras.has(obraKey);
                const obraLaudos = grouped[obraKey];

                return (
                  <div key={obraKey}>
                    {/* Folder row */}
                    <button
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40 group"
                      onClick={(e) => toggleObra(obraKey, e)}
                    >
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />}
                      </span>
                      {isExpanded
                        ? <FolderOpen className="h-5 w-5 text-primary" />
                        : <Folder className="h-5 w-5 text-primary" />}
                      <span className="flex-1 text-sm font-semibold text-foreground">{obraNome}</span>
                      <Badge variant="secondary" className="text-xs font-normal tabular-nums">
                        {obraLaudos.length} laudo{obraLaudos.length !== 1 ? 's' : ''}
                      </Badge>
                    </button>

                    {/* Laudos list */}
                    {isExpanded && (
                      <div className="bg-muted/20">
                        {obraLaudos.map((laudo, idx) => (
                          <div
                            key={laudo.id}
                            className={`flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-primary/5 group ${idx !== obraLaudos.length - 1 ? 'border-b border-border/40' : ''}`}
                            onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                          >
                            {/* indent line */}
                            <span className="w-4 shrink-0 flex items-center justify-center">
                              <span className="h-full w-px bg-border" />
                            </span>
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {laudo.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Vol. {laudo.dadosCapa.volumeAtual}/{laudo.dadosCapa.totalVolumes}
                                {' · '}{laudo.lindeiros.length} lindeiro{laudo.lindeiros.length !== 1 ? 's' : ''}
                                {' · '}Atualizado {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
                              </p>
                            </div>

                            <Badge
                              variant={laudo.status === 'finalizado' ? 'default' : 'outline'}
                              className={
                                laudo.status === 'finalizado'
                                  ? 'bg-success/10 text-success border-success/20 text-xs'
                                  : 'bg-warning/10 text-warning border-warning/20 text-xs'
                              }
                            >
                              {laudo.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}
                            </Badge>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={(e) => handleDuplicar(laudo.id, e)}
                                title="Duplicar laudo"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={e => { e.stopPropagation(); removerLaudo(laudo.id); }}
                                title="Excluir laudo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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
