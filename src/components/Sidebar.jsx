import { useState } from 'react';
import {
  LayoutDashboard, CalendarDays, DoorOpen, UtensilsCrossed,
  SprayCan, DollarSign, Receipt, FileText, Settings, LogOut, Ticket, Globe,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { api } from '../services/api';

const iconMap = {
  LayoutDashboard, CalendarDays, DoorOpen, UtensilsCrossed,
  SprayCan, DollarSign, Receipt, FileText, Settings, Ticket, Globe
};

export default function Sidebar({ modules, activeModule, onNavigate }) {
  const { user, setUser, showToast, state } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    localStorage.removeItem('yoyo_admin_user');
    showToast('Logged out successfully.');
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
    if (role === 'hk_staff') return 'Housekeeping';
    if (role === 'booking_staff') return 'Booking Staff';
    if (role === 'restaurant_staff') return 'Restaurant Staff';
    if (role === 'waterpark_staff') return 'Waterpark Counter';
    return 'Staff Member';
  };

  // Filter modules based on user role and enabled modules
  const role = user?.role;
  const isStaff = role === 'staff' || role === 'booking_staff';
  const isHKStaff = role === 'hk_staff';
  const isRestaurantStaff = role === 'restaurant_staff';
  const isWaterparkStaff = role === 'waterpark_staff';
  const filteredModules = modules.filter(mod => {
    if (isHKStaff) return mod.id === 'hk';
    if (role === 'booking_staff') return ['calendar', 'roomview', 'reports'].includes(mod.id);
    if (isRestaurantStaff) return mod.id === 'pos';
    if (isWaterparkStaff) return mod.id === 'waterpark';
    if (isStaff) return !['pricing', 'accounts', 'settings', 'website_cms'].includes(mod.id);
    return true;
  }).filter(mod => mod.id === 'settings' || state.enabledModules[mod.id] !== false);

  // Ensure current active module hasn't been disabled
  // (handled by AppInner useEffect)

  return (
    <aside className={`${
      collapsed ? 'w-[64px] min-w-[64px]' : 'w-[240px] min-w-[240px]'
    } bg-slate-800 text-white flex flex-col h-full overflow-hidden transition-all duration-300 relative border-r border-slate-700/30`}>
      
      {/* Sidebar Header */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between gap-1.5">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm tracking-wide shrink-0">
                YF
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold tracking-wide truncate">YOYO Fun</div>
                <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase truncate">Admin v1.0</div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm tracking-wide mx-auto shrink-0">
              YF
            </div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all ${collapsed ? 'mx-auto mt-2' : ''}`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {filteredModules.map((mod) => {
          const Icon = iconMap[mod.icon];
          const isActive = mod.id === activeModule;
          return (
            <div key={mod.id} title={collapsed ? mod.label : undefined}>
              <div
                onClick={() => onNavigate(mod.id)}
                className={`flex items-center cursor-pointer text-sm transition-all duration-150 ${
                  collapsed ? 'justify-center py-3' : 'gap-3 px-5 py-2.5'
                } ${
                  isActive
                    ? 'bg-slate-700/60 text-white border-l-[3px] border-emerald-500 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border-l-[3px] border-transparent'
                }`}
              >
                <Icon size={17} strokeWidth={1.8} className="shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{mod.label}</span>}
              </div>
              {!collapsed && mod.sub && (
                <div className="pl-12 pr-5 py-0.5 text-[10px] text-slate-500 italic leading-tight truncate">
                  {mod.sub}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Block at bottom */}
      <div className={`border-t border-slate-700/50 flex ${
        collapsed ? 'flex-col items-center gap-3 py-4' : 'items-center justify-between px-4 py-3'
      } bg-slate-900/20`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 min-w-[32px] rounded-full bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white uppercase shrink-0" title={user?.name || user?.email}>
            {getInitials(user?.name, user?.email)}
          </div>
          {!collapsed && (
            <div className="text-xs overflow-hidden">
              <div className="text-slate-200 font-semibold truncate max-w-[130px]">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-slate-500 text-[10px] truncate max-w-[130px]">
                {formatRole(user?.role)}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-all cursor-pointer shrink-0"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
