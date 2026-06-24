import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { setUser, showToast, demoUsers } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    // Demo credentials from context
    const demoEntry = demoUsers.find(d => d.email === email);
    if (demoEntry && demoEntry.password === password) {
      setTimeout(() => {
        const u = { name: demoEntry.name, email: demoEntry.email, role: demoEntry.role };
        setUser(u);
        localStorage.setItem('yoyo_admin_user', JSON.stringify(u));
        showToast(`Logged in as ${demoEntry.name} (Local)`);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await api.login(email, password);
      if (res.success) {
        showToast('Login successful! Welcome back.');
        const me = await api.getMe();
        if (me.success) {
          setUser(me.data);
          localStorage.setItem('yoyo_admin_user', JSON.stringify(me.data));
        } else {
          const fallback = { name: email.split('@')[0], email, role: 'staff' };
          setUser(fallback);
          localStorage.setItem('yoyo_admin_user', JSON.stringify(fallback));
        }
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl relative z-10 flex flex-col items-center">
        {/* Brand Logo / Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-emerald-500/20 mb-4 animate-bounce-slow">
          YF
        </div>
        
        <h2 className="text-2xl font-bold text-white tracking-tight">YOYO Fun N Foods</h2>
        <p className="text-slate-400 text-xs mt-1.5 mb-6">Property Management & Admin Console</p>

        {error && (
          <div className="w-full p-3 mb-5 text-xs bg-red-500/15 border border-red-500/30 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yoyofun.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs tracking-wide rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Authenticating...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Section */}
        <div className="w-full mt-6 pt-5 border-t border-slate-700/40">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3">
            <ShieldAlert size={12} />
            <span>Demo Console Logins (Click to autofill)</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {demoUsers.filter(u => u.isActive).map((du) => {
              const roleColors = { super_admin: 'text-emerald-400', admin: 'text-emerald-400', staff: 'text-blue-400', hk_staff: 'text-purple-400', booking_staff: 'text-cyan-400' };
              const roleLabels = { super_admin: 'Super Admin', admin: 'Admin', staff: 'Staff', hk_staff: 'Housekeeping', booking_staff: 'Booking Staff' };
              return (
                <button key={du.id} type="button"
                  onClick={() => handleFillDemo(du.email, du.password)}
                  className="text-left p-2.5 bg-slate-900/40 border border-slate-700/40 hover:border-emerald-500/40 hover:bg-slate-900/70 rounded-xl transition-all group"
                >
                  <div className={`text-[10px] font-semibold ${roleColors[du.role] || 'text-slate-400'} group-hover:opacity-80`}>{roleLabels[du.role] || du.role}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 truncate">{du.email}</div>
                  <div className="text-[8px] text-slate-600 font-mono mt-0.5">pass: {du.password}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow { animation: bounceSlow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
