import {
  LayoutDashboard, CalendarDays, DoorOpen, UtensilsCrossed,
  SprayCan, DollarSign, Receipt, FileText, Settings,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard, CalendarDays, DoorOpen, UtensilsCrossed,
  SprayCan, DollarSign, Receipt, FileText, Settings,
};

export default function Sidebar({ modules, activeModule, onNavigate }) {
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
        {modules.map((mod) => {
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

      <div className="px-5 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold">
            RK
          </div>
          <div className="text-xs">
            <div className="text-slate-200 text-xs font-medium">Rajesh Kumar</div>
            <div className="text-slate-500 text-[10px]">Front Desk Manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
