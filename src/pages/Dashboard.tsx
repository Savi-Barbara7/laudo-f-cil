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
  Plus, FileText, Trash2, Copy, Search, LogOut,
  CheckCircle2, Clock, Layers, FolderOpen,
  ChevronDown, Loader2, MapPin, Building2, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type TabStatus = 'todos' | 'rascunho' | 'finalizado';
type ViewMode = 'obras' | 'laudos';

const STATUS_LABELS: Record<string, string> = { rascunho: 'Rascunho', finalizado: 'Finalizado' };
const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  finalizado: 'bg-green-100 text-green-800 border-green-200',
};

interface ObraRow { id: string; nome: string }

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { laudos, loading, criarLaudo, removerLaudo, duplicarLaudo } = useLaudoStore();
  const [tab, setTab] = useState<TabStatus>('todos');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('obras');
  const [obraFiltro, setObraFiltro] = useState<string | null>(null); // null = todas
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

  // Laudos agrupados por obra
  const laudosPorObra = useMemo(() => {
    const map = new Map<string, typeof laudos>();
    // Sem obra
    const semObra = laudos.filter(l => !l.obraId);
    if (semObra.length) map.set('__sem-obra__', semObra);
    // Com obra
    for (const obra of obras) {
      const ls = laudos.filter(l => l.obraId === obra.id);
      if (ls.length) map.set(obra.id, ls);
    }
    return map;
  }, [laudos, obras]);

  const laudosFiltrados = useMemo(() => {
    return laudos
      .filter(l => tab === 'todos' || l.status === tab)
      .filter(l => obraFiltro === null || (obraFiltro === '__sem-obra__' ? !l.obraId : l.obraId === obraFiltro))
      .filter(l => {
        if (!search) return true;
        const q = search.toLowerCase();
        const obraNome = obras.find(o => o.id === l.obraId)?.nome ?? '';
        return l.titulo.toLowerCase().includes(q) || obraNome.toLowerCase().includes(q);
      });
  }, [laudos, tab, search, obraFiltro, obras]);

  const metricas = useMemo(() => ({
    total: laudos.length,
    finalizados: laudos.filter(l => l.status === 'finalizado').length,
    rascunhos: laudos.filter(l => l.status !== 'finalizado').length,
    obras: new Set(laudos.map(l => l.obraId).filter(Boolean)).size,
  }), [laudos]);

  const TABS: { key: TabStatus; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'rascunho', label: 'Rascunho' },
    { key: 'finalizado', label: 'Finalizado' },
  ];

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando laudos...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header */}
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
            <LogOut size={15} /> Sair
          </Button>
          <Button onClick={() => setNovoDialogOpen(true)} className="gap-2">
            <Plus size={15} /> Novo Laudo
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', val: metricas.total, icon: <Layers size={16} className="text-primary" />, bg: 'bg-primary/10' },
            { label: 'Finalizados', val: metricas.finalizados, icon: <CheckCircle2 size={16} className="text-success" />, bg: 'bg-success/10' },
            { label: 'Em Andamento', val: metricas.rascunhos, icon: <Clock size={16} className="text-warning" />, bg: 'bg-warning/10' },
            { label: 'Obras', val: metricas.obras, icon: <Building2 size={16} className="text-accent" />, bg: 'bg-accent/10' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>{s.icon}</div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.val}</p>
            </div>
          ))}
        </div>

        {/* ── View toggle + Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View mode */}
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            <button onClick={() => setViewMode('obras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'obras' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Building2 size={13} /> Por Obra
            </button>
            <button onClick={() => setViewMode('laudos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'laudos' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <FileText size={13} /> Todos os Laudos
            </button>
          </div>

          {/* Status tabs (only in laudos view) */}
          {viewMode === 'laudos' && (
            <div className="flex bg-muted rounded-lg p-1 gap-1">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="pl-8 h-8 text-xs w-56" />
          </div>
        </div>

        {/* ── Vista por OBRAS */}
        {viewMode === 'obras' && (
          <div className="space-y-4">
            {laudos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 rounded-xl border border-border bg-card">
                <Building2 size={40} className="opacity-20" />
                <p className="text-sm font-medium">Nenhum laudo criado</p>
                <Button onClick={() => setNovoDialogOpen(true)} size="sm" className="gap-2 mt-2">
                  <Plus size={14} /> Criar primeiro laudo
                </Button>
              </div>
            ) : (
              Array.from(laudosPorObra.entries()).map(([obraId, obraLaudos]) => {
                const obraNome = obraId === '__sem-obra__' ? 'Sem Obra' : obras.find(o => o.id === obraId)?.nome ?? 'Obra desconhecida';
                const filtrados = obraLaudos.filter(l =>
                  !search || l.titulo.toLowerCase().includes(search.toLowerCase())
                );
                if (!filtrados.length) return null;
                return (
                  <div key={obraId} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Obra header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{obraNome}</p>
                        <p className="text-xs text-muted-foreground">{filtrados.length} laudo(s)</p>
                      </div>
                      <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs gap-1 text-primary"
                        onClick={() => { setNovaObra(obraId !== '__sem-obra__' ? obraNome : ''); setNovoDialogOpen(true); }}>
                        <Plus size={12} /> Novo laudo nesta obra
                      </Button>
                    </div>
                    {/* Laudos da obra */}
                    <table className="w-full text-sm">
                      <tbody>
                        {filtrados.map((laudo, i) => (
                          <tr key={laudo.id}
                            onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                            className={`cursor-pointer hover:bg-muted/40 transition-colors border-b border-border last:border-0 ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                            <td className="px-4 py-2.5 font-medium text-foreground">
                              <span className="flex items-center gap-2">
                                <FileText size={13} className="text-muted-foreground flex-shrink-0" />
                                <span className="truncate max-w-[220px]">{laudo.titulo}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />
                                {laudo.lindeiros.length} lindeiro(s)
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[laudo.status] ?? STATUS_COLORS.rascunho}`}>
                                {STATUS_LABELS[laudo.status] ?? laudo.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground text-xs hidden md:table-cell">
                              {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-3 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                                    <ChevronDown size={11} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => navigate(`/laudos/${laudo.id}/editor`)}>
                                    <FolderOpen size={14} className="mr-2" /> Abrir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={e => handleDuplicar(laudo.id, e as any)}>
                                    <Copy size={14} className="mr-2" /> Duplicar como modelo
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(laudo.id)}>
                                    <Trash2 size={14} className="mr-2" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Vista TODOS OS LAUDOS (tabela flat) */}
        {viewMode === 'laudos' && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {laudosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <FileText size={40} className="opacity-20" />
                <p className="text-sm font-medium">{laudos.length === 0 ? 'Nenhum laudo criado' : 'Nenhum laudo encontrado'}</p>
                {laudos.length === 0 && (
                  <Button onClick={() => setNovoDialogOpen(true)} size="sm" className="gap-2 mt-2">
                    <Plus size={14} /> Criar primeiro laudo
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">ATUALIZADO</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {laudosFiltrados.map((laudo, i) => {
                    const obraNome = obras.find(o => o.id === laudo.obraId)?.nome;
                    return (
                      <tr key={laudo.id}
                        onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
                        className={`cursor-pointer hover:bg-muted/40 transition-colors border-b border-border last:border-0 ${i % 2 !== 0 ? 'bg-muted/10' : ''}`}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span className="flex items-center gap-2">
                            <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{laudo.titulo}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {obraNome ? (
                            <span className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-primary/60" />
                              <span className="truncate max-w-[130px]">{obraNome}</span>
                            </span>
                          ) : <span className="opacity-30">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />{laudo.lindeiros.length}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[laudo.status] ?? STATUS_COLORS.rascunho}`}>
                            {STATUS_LABELS[laudo.status] ?? laudo.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                          {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
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
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(laudo.id)}>
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
        )}
      </div>

      {/* ── Dialog: Novo Laudo */}
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
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obra / Projeto</Label>
              <Input value={novaObra} onChange={e => setNovaObra(e.target.value)} placeholder="Ex: Residencial Vila Nova" list="obras-list" />
              <datalist id="obras-list">
                {obras.map(o => <option key={o.id} value={o.nome} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Laudos da mesma obra ficam agrupados no dashboard</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNovoDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCriarLaudo}>Criar Laudo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Confirmar exclusão */}
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
              onClick={async () => {
                if (deleteTarget) {
                  await removerLaudo(deleteTarget);
                  toast({ title: 'Laudo excluído' });
                  setDeleteTarget(null);
                }
              }}
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
