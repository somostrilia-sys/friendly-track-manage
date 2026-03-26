import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';

const LOGIN_BG = 'https://jlrslrljvpveaeheetlm.supabase.co/storage/v1/object/public/faturamento-docs/login-bg.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT PANEL — brand image */}
      <div
        className="hidden md:block md:w-[45%] lg:w-1/2 min-h-screen"
        style={{
          backgroundImage: `url('${LOGIN_BG}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* RIGHT PANEL — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10 md:px-16 md:py-12">
        {/* Mobile-only branding */}
        <div className="md:hidden mb-8 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#4DA8B5]" />
          <span className="text-xl font-extrabold tracking-wider text-foreground">TRACKIT</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Acesse sua conta</h2>
          <p className="text-sm text-muted-foreground mb-6 sm:mb-8">Entre com suas credenciais para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-muted/50 border-border focus:bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Senha
                </Label>
                <Link to="/esqueci-senha" className="text-xs text-[#4DA8B5] hover:underline font-medium">
                  Esqueceu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-muted/50 border-border focus:bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold tracking-wide rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #0d3b4f, #4DA8B5)' }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8 lg:mt-10">
            © 2026 Trackit Solucoes IoT
          </p>
        </div>
      </div>
    </div>
  );
}
