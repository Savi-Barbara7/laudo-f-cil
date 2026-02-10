import { useNavigate } from 'react-router-dom';
import { useLaudoStore } from '@/hooks/useLaudoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { laudos, criarLaudo, removerLaudo } = useLaudoStore();

  const handleCriarLaudo = () => {
    const id = criarLaudo('Novo Laudo Cautelar');
    navigate(`/laudos/${id}/editor`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
              LVL PRO
            </h1>
            <p className="text-sm text-muted-foreground">Editor de Laudos Técnicos de Vistoria Cautelar</p>
          </div>
          <Button onClick={handleCriarLaudo} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Laudo
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl p-6">
        {laudos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">Nenhum laudo criado</h2>
            <p className="mb-6 text-muted-foreground">
              Clique em "Criar Novo Laudo" para começar a trabalhar
            </p>
            <Button onClick={handleCriarLaudo} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Novo Laudo
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {laudos.map((laudo) => (
              <Card
                key={laudo.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/laudos/${laudo.id}/editor`)}
              >
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
                    <span>
                      {new Date(laudo.atualizadoEm).toLocaleDateString('pt-BR')}
                    </span>
                    <span>{laudo.lindeiros.length} lindeiro(s)</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerLaudo(laudo.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
