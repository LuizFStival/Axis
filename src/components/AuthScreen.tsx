import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Algo deu errado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold tracking-[0.25em] text-blue-600 uppercase">Axis</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-sm text-slate-500">
            Use email e senha para acessar seus dados seguros no Supabase.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimo 6 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold rounded-xl py-3 hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          {mode === 'login' ? (
            <>
              Nao tem conta?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Criar agora
              </button>
            </>
          ) : (
            <>
              Ja tem conta?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
