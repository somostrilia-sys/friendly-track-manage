import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Radio, Navigation } from 'lucide-react';
import logoImg from '@/assets/logo-trackit-full.png';

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
      {/* LEFT PANEL — hidden on mobile */}
      <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-between overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a1929 0%, #0d3b4f 50%, #0a2a3a 100%)',
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #4DA8B5, transparent)' }} />
          <div className="absolute bottom-32 -left-16 w-96 h-96 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #4DA8B5, transparent)' }} />
          <div className="absolute top-1/2 right-10 w-40 h-40 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #4DA8B5, transparent)' }} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 px-10 text-center">
          <img src={logoImg} alt="TrackIT" className="h-14 object-contain mb-8 brightness-0 invert" />

          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-[#4DA8B5]" />
            <h1 className="text-4xl font-extrabold tracking-wider text-white">TRACKIT</h1>
          </div>

          <p className="text-sm tracking-[0.3em] text-[#4DA8B5]/80 font-medium uppercase mb-10">
            Solucoes IoT
          </p>

          <p className="text-white/70 text-sm max-w-xs leading-relaxed">
            <span className="font-normal">Sistema de </span>
            <span className="font-bold text-white">Gestao Interno</span>
          </p>

          {/* Decorative icons row */}
          <div className="flex items-center gap-8 mt-14 text-[#4DA8B5]/30">
            <Radio className="w-6 h-6" />
            <div className="w-px h-6 bg-[#4DA8B5]/20" />
            <Navigation className="w-6 h-6" />
            <div className="w-px h-6 bg-[#4DA8B5]/20" />
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* Bottom credit */}
        <p className="z-10 pb-6 text-[11px] text-white/30 tracking-wide">
          Desenvolvido por <span className="font-semibold text-white/40">DIGITAL LUX</span>
        </p>
      </div>

      {/* RIGHT PANEL — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 md:px-16">
        {/* Mobile-only logo */}
        <div className="md:hidden mb-10 flex flex-col items-center gap-2">
          <img src={logoImg} alt="TrackIT" className="h-10 object-contain" />
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Acesse sua conta</h2>
          <p className="text-sm text-gray-500 mb-8">Entre com suas credenciais para continuar</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
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
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white text-gray-900 placeholder:text-gray-400"
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

          <p className="text-center text-xs text-gray-400 mt-10">
            © 2026 Trackit Solucoes IoT
          </p>
        </div>
      </div>
    </div>
  );
}
