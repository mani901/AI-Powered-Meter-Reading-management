import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Zap, Eye, EyeOff, Loader2, AlertCircle, Clock, ShieldCheck, HardHat, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { label: 'Consumer', icon: User, email: 'user@test.com', password: 'User@123', color: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' },
  { label: 'Field Staff', icon: HardHat, email: 'staff@test.com', password: 'Staff@123', color: 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
  { label: 'Admin', icon: ShieldCheck, email: 'admin@smartmeter.com', password: 'Admin@123', color: 'bg-blue-600 text-white hover:bg-blue-700' },
] as const;

const ROLE_REDIRECT: Record<string, string> = {
  ADMIN: '/admin',
  FIELD_STAFF: '/staff',
  CONSUMER: '/dashboard',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(ROLE_REDIRECT[result.role ?? ''] ?? '/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap size={22} className="text-white" />
            </div>
          </Link>
          <h1 className="text-white text-2xl font-bold">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your SmartMeter account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {/* Demo credentials */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6">
            <p className="text-slate-500 text-xs font-medium mb-2.5">Quick demo login:</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setForm({ email: a.email, password: a.password })}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${a.color}`}
                >
                  <a.icon size={15} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={e => void handleSubmit(e)} className="space-y-5">
            {error && (
              error.toLowerCase().includes('pending') ? (
                <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 text-sm">
                  <Clock size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Account Pending Approval</p>
                    <p className="text-xs mt-0.5 text-amber-600">Your registration is being reviewed by an administrator. You will be notified once approved.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">Create one</Link>
          </p>
        </div>

        {/* Role legend */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { role: 'Meter Owner', desc: 'View bills & usage', color: 'text-slate-300' },
            { role: 'Field Staff', desc: 'Submit readings', color: 'text-emerald-400' },
            { role: 'Admin', desc: 'Full control panel', color: 'text-blue-400' },
          ].map(r => (
            <div key={r.role}>
              <p className={`text-xs font-semibold ${r.color}`}>{r.role}</p>
              <p className="text-slate-500 text-xs mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
