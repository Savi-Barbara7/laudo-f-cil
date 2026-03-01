import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Auth = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Email enviado', description: 'Verifique sua caixa de entrada.' });
        setMode('login');
      }
      return;
    }

    if (mode === 'signup') {
      const { error } = await signUp(email, password, nome);
      setLoading(false);
      if (error) {
        toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Cadastro realizado!', description: 'Verifique seu email para confirmar a conta.' });
        setMode('login');
      }
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Left panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/15" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">LVL PRO</span>
          </div>

          <h2 className="text-3xl font-bold text-sidebar-foreground mb-4 leading-tight">
            Laudos Técnicos<br />de Vistoria
          </h2>
          <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-sm">
            Plataforma profissional para criar, gerenciar e exportar laudos cautelares de lindeiros com fotos anotadas e PDF padronizado.
          </p>
        </div>

        <div className="relative space-y-3">
          {[
            { icon: FileText, text: 'Laudos organizados por obra' },
            { icon: CheckCircle, text: 'Editor com fotos anotadas' },
            { icon: Shield, text: 'Exportação em PDF profissional' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-sidebar-foreground/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LVL PRO</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {mode === 'login' ? 'Bem-vindo de volta' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Entre com suas credenciais para continuar'
                : mode === 'signup'
                ? 'Preencha os dados abaixo para começar'
                : 'Informe seu email para receber o link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" className="h-10" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="h-10" />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Senha</Label>
                <Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-10" />
              </div>
            )}
            <Button type="submit" className="w-full h-10 shadow-sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link de recuperação'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button className="text-primary hover:underline text-sm" onClick={() => setMode('forgot')}>
                  Esqueci minha senha
                </button>
                <p className="text-muted-foreground">
                  Não tem conta?{' '}
                  <button className="text-primary font-medium hover:underline" onClick={() => setMode('signup')}>
                    Cadastre-se grátis
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-muted-foreground">
                Já tem conta?{' '}
                <button className="text-primary font-medium hover:underline" onClick={() => setMode('login')}>
                  Entrar
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button className="text-primary hover:underline" onClick={() => setMode('login')}>
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
