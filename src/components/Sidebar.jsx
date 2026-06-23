import {
  LayoutDashboard, CalendarDays, DoorOpen, UtensilsCrossed,
  SprayCan, DollarSign, Receipt, FileText, Settings, LogOut,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';

const iconMap = {
  LayoutDashboard, CalendarDays, DoorOpen, UtensilsCrossed,
  SprayCan, DollarSign, Receipt, FileText, Settings,
};

export default function Sidebar({ modules, activeModule, onNavigate }) {
  const { user, setUser, showToast } = useApp();

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      showToast('Logged out successfully.');
    } catch (err) {
      setUser(null);
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'US';
  };

  const formatRole = (role) => {
    if (!role) return 'Staff Member';
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Administrator';
    if (role === 'moderator') return 'Moderator';
    return 'Staff Member';
  };

  // Filter modules based on user role
  const isStaff = user?.role === 'staff';
  const filteredModules = modules.filter(mod => {
    if (isStaff) {
      return !['pricing', 'accounts', 'settings'].includes(mod.id);
    }
    return true;
  });

  return (
    <aside className="w-[240px] min-w-[240px] bg-slate-800 text-white flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm tracking-wide">
            YF
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">YOYO Fun</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Admin v1.0</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {filteredModules.map((mod) => {
          const Icon = iconMap[mod.icon];
          const isActive = mod.id === activeModule;
          return (
            <div key={mod.id}>
              <div
                onClick={() => onNavigate(mod.id)}
                className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-700/60 text-white border-l-[3px] border-emerald-500 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border-l-[3px] border-transparent'
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="flex-1">{mod.label}</span>
              </div>
              {mod.sub && (
                <div className="pl-12 pr-5 py-1 text-[11px] text-slate-500 italic leading-tight">
                  {mod.sub}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Block at bottom */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between bg-slate-900/20">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 min-w-[32px] rounded-full bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white uppercase">
            {getInitials(user?.name, user?.email)}
          </div>
          <div className="text-xs overflow-hidden">
            <div className="text-slate-200 font-semibold truncate max-w-[130px]">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-slate-500 text-[10px] truncate max-w-[130px]">
              {formatRole(user?.role)}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-all cursor-pointer"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
