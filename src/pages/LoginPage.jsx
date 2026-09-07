import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert, WifiOff, Waves, Key, ShieldCheck, Sparkles, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { setUser, showToast, demoUsers, refreshData } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackendFailed, setShowBackendFailed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(email, password);
      if (res.success) {
        setShowBackendFailed(false);
        const me = await api.getMe();
        if (me.success) {
          setUser(me.data);
          localStorage.setItem('yoyo_admin_user', JSON.stringify(me.data));
        } else {
          const fallback = { name: email.split('@')[0], email, role: 'staff' };
          setUser(fallback);
          localStorage.setItem('yoyo_admin_user', JSON.stringify(fallback));
        }
        showToast('Login successful! Welcome to YOYO Fun N Foods Terminal.');
        refreshData();
      } else {
        const matchedDemo = demoUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (matchedDemo) {
          handleDemoMode(matchedDemo.email, matchedDemo.password, matchedDemo.role);
          return;
        }
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      const matchedDemo = demoUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matchedDemo) {
        handleDemoMode(matchedDemo.email, matchedDemo.password, matchedDemo.role);
        return;
      }
      setError(err.message || 'Backend server offline. Continuing in Demo Mode below.');
      setShowBackendFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setShowBackendFailed(false);
  };

  const handleDemoMode = (demoEmail, demoPass, role) => {
    const user = { name: demoEmail.split('@')[0], email: demoEmail, role };
    setUser(user);
    localStorage.setItem('yoyo_admin_user', JSON.stringify(user));
    showToast(`Logged in as ${user.name} (${role}) — Exploring POS Terminal`);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans p-4 select-none">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-emerald-500/15 blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg p-6 sm:p-8 md:p-10 bg-slate-900/70 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl relative z-10 flex flex-col items-center">
        
        {/* BRAND EMBLEM HEADER */}
        <div className="relative mb-3 group cursor-pointer">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition duration-300">
            <Key size={30} className="text-white drop-shadow-md" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center border-2 border-slate-900 font-extrabold text-[10px]">
            <Waves size={13} />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Sparkles size={11} className="text-indigo-400" />
            <span>YOYO POS & PMS Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            YOYO Fun N Foods
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Resort, Waterpark, Swimwear Costumes & Lockers Management
          </p>
        </div>

        {/* ERROR / BACKEND ALERT */}
        {error && (
          <div className="w-full mb-5 animate-fade-in">
            <div className="p-3 text-xs bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 font-medium flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            {showBackendFailed && (
              <button
                type="button"
                onClick={() => handleDemoMode('waterpark@yoyo.com', 'admin123', 'waterpark_staff')}
                className="w-full mt-2.5 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <WifiOff size={14} className="text-indigo-400" /> Enter Waterpark Counter (Demo Mode)
              </button>
            )}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Staff Email Address
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
                placeholder="waterpark@yoyo.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
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
                className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Authenticating Terminal...
              </>
            ) : (
              <>
                <span>Sign In to POS Counter</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* QUICK ACCESS LOGIN CARDS */}
        <div className="w-full mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <UserCheck size={13} />
              <span>Quick Counter Logins</span>
            </span>
            <span className="text-[9px] text-slate-500 font-normal">Click to fill • Double click to enter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Waterpark & Costume Lockers Staff */}
            <button
              type="button"
              onClick={() => handleFillDemo('waterpark@yoyo.com', 'admin123')}
              onDoubleClick={() => handleDemoMode('waterpark@yoyo.com', 'admin123', 'waterpark_staff')}
              className="text-left p-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 hover:border-indigo-400 rounded-2xl transition group relative cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                  <Key size={13} className="text-indigo-400" /> Costume & Lockers
                </span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded">Counter</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">waterpark@yoyo.com</p>
            </button>

            {/* 2. Super Admin / General Manager */}
            <button
              type="button"
              onClick={() => handleFillDemo('admin@yoyo.com', 'admin123')}
              onDoubleClick={() => handleDemoMode('admin@yoyo.com', 'admin123', 'admin')}
              className="text-left p-3 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl transition group relative cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" /> Admin Manager
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">Full</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">admin@yoyo.com</p>
            </button>

            {/* 3. Front Desk Reservations */}
            <button
              type="button"
              onClick={() => handleFillDemo('priya@yoyo.com', 'admin123')}
              onDoubleClick={() => handleDemoMode('priya@yoyo.com', 'admin123', 'booking_staff')}
              className="text-left p-3 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl transition group relative cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                  🏨 Front Desk
                </span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.2 rounded">Desk</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">priya@yoyo.com</p>
            </button>

            {/* 4. Restaurant POS & Kitchen */}
            <button
              type="button"
              onClick={() => handleFillDemo('chef@yoyo.com', 'admin123')}
              onDoubleClick={() => handleDemoMode('chef@yoyo.com', 'admin123', 'kitchen_staff')}
              className="text-left p-3 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-400 rounded-2xl transition group relative cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  🍽️ Dining & Kitchen
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">POS</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">chef@yoyo.com</p>
            </button>
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="mt-6 text-center text-[10px] text-slate-500 font-medium">
          YOYO Fun N Foods Resort Management System • v2.4.0
        </div>
      </div>

      <style>{`
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulseSlow 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
