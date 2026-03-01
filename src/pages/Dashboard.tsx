import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, FileText, Trash2, Copy, Search, Settings,
  CheckCircle2, Clock, RefreshCw, Layers, FolderOpen,
  ChevronDown, LogOut, Loader2, MapPin,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type TabStatus = 'todos' | 'rascunho' | 'finalizado';
type Periodo = 'este-mes' | 'ultimo-mes' | '3-meses' | 'este-ano' | 'todos';
interface ObraRow { id: string; nome: string }

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
};

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  finalizado: 'bg-green-100 text-green-800 border-green-200',
};

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
  const [tab, setTab] = useState<TabStatus>('todos');
  const [search, setSearch] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('Novo Laudo Cautelar');
  const [novaObra, setNovaObra] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [obras, setObras] = useState<ObraRow[]>([]);

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
      toast({ title: 'Laudo duplicado!' });
      navigate(`/laudos/${newId}/editor`);
    }
  };

  const laudosFiltrados = useMemo(() => {
    return laudos
      .filter(l => filtroPeriodo(l.criadoEm, periodo))
      .filter(l => tab === 'todos' || l.status === tab)
      .filter(l => {
        if (!search) return true;
        const q = search.toLowerCase();
        const obraNome = obras.find(o => o.id === l.obraId)?.nome ?? '';
        return l.titulo.toLowerCase().includes(q) || obraNome.toLowerCase().includes(q);
      });
  }, [laudos, tab, search, periodo, obras]);

  const countByStatus = (s: TabStatus) => {
    if (s === 'todos') return laudos.length;
    return laudos.filter(l => l.status === s).length;
  };

  const metricas = useMemo(() => ({
    total: laudos.length,
    finalizados: laudos.filter(l => l.status === 'finalizado').length,
    rascunhos: laudos.filter(l => l.status !== 'finalizado').length,
    lindeiros: laudos.reduce((a, l) => a + l.lindeiros.length, 0),
  }), [laudos]);

  const TABS: { key: TabStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'todos', label: 'Todos', icon: <Layers size={14} /> },
    { key: 'rascunho', label: 'Rascunho', icon: <Clock size={14} /> },
    { key: 'finalizado', label: 'Finalizado', icon: <CheckCircle2 size={14} /> },
  ];

  const PERIODOS: { value: Periodo; label: string }[] = [
    { value: 'este-mes', label: 'Este mês' },
    { value: 'ultimo-mes', label: 'Último mês' },
    { value: '3-meses', label: 'Últimos 3 meses' },
    { value: 'este-ano', label: 'Este ano' },
    { value: 'todos', label: 'Todos os períodos' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando laudos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText size={16} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-none">LVL Pro</h1>
            <p className="text-xs text-muted-foreground">Laudos de Vistoria de Lindeiros</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
            <LogOut size={15} />
            Sair
          </Button>
          <Button onClick={() => setNovoDialogOpen(true)} className="gap-2">
            <Plus size={15} />
            Novo Laudo
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── Quick stats ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', val: metricas.total, icon: <Layers size={16} className="text-primary" />, bg: 'bg-primary/10' },
            { label: 'Finalizados', val: metricas.finalizados, icon: <CheckCircle2 size={16} className="text-success" />, bg: 'bg-success/10' },
            { label: 'Em Andamento', val: metricas.rascunhos, icon: <Clock size={16} className="text-warning" />, bg: 'bg-warning/10' },
            { label: 'Lindeiros', val: metricas.lindeiros, icon: <MapPin size={16} className="text-accent" />, bg: 'bg-accent/10' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  {s.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.val}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
                <span className="ml-1 tabular-nums opacity-70">({countByStatus(t.key)})</span>
              </button>
            ))}
          </div>

          {/* Period filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                {PERIODOS.find(p => p.value === periodo)?.label ?? 'Período'}
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {PERIODOS.map(p => (
                <DropdownMenuItem key={p.value} onClick={() => setPeriodo(p.value)}>
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título ou obra..."
              className="pl-8 h-8 text-xs w-64"
            />
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {laudosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <FileText size={40} className="opacity-20" />
              <p className="text-sm font-medium">
                {laudos.length === 0 ? 'Nenhum laudo criado' : 'Nenhum laudo encontrado'}
              </p>
              {laudos.length === 0 && (
                <Button onClick={() => setNovoDialogOpen(true)} size="sm" className="gap-2 mt-2">
                  <Plus size={14} />
                  Criar primeiro laudo
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">TÍTULO</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">OBRA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">LINDEIROS</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">STATUS</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">ÚLTIMA EDIÇÃO</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {laudosFiltrados.map((laudo, i) => {
                  const obraNome = obras.find(o => o.id === laudo.obraId)?.nome;
                  return (
                    <tr
                      key={laudo.id}
                      onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                      className={`cursor-pointer hover:bg-muted/40 transition-colors border-b border-border last:border-0 ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{laudo.titulo}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {obraNome ? (
                          <span className="flex items-center gap-1.5">
                            <FolderOpen size={13} className="text-primary/60" />
                            <span className="truncate max-w-[140px]">{obraNome}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {laudo.lindeiros.length} lindeiro{laudo.lindeiros.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[laudo.status] ?? STATUS_COLORS.rascunho}`}>
                          {STATUS_LABELS[laudo.status] ?? laudo.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                              Ações <ChevronDown size={11} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => navigate(`/laudos/${laudo.id}/editor`)}>
                              <FolderOpen size={14} className="mr-2" /> Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => handleDuplicar(laudo.id, e as any)}>
                              <Copy size={14} className="mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(laudo.id)}
                            >
                              <Trash2 size={14} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Dialog: Novo Laudo ───────────────────────────── */}
      <Dialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Laudo</DialogTitle>
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

      {/* ── AlertDialog: Confirmar exclusão ─────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir laudo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O laudo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) removerLaudo(deleteTarget); setDeleteTarget(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
