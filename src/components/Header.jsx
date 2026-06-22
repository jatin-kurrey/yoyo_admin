import { Bell, Plus, ChefHat, ChevronDown } from 'lucide-react';

export default function Header({ onNewBooking, onNavigate }) {
  return (
    <header className="h-[60px] min-h-[60px] bg-white border-b border-slate-200 flex items-center px-5 gap-4 z-20 shrink-0">
      <div className="flex items-center gap-2 cursor-pointer group">
        <span className="text-sm font-semibold text-slate-700">Main Beach Resort</span>
        <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
      </div>
      <div className="w-px h-6 bg-slate-200" />
      <div className="text-xs text-slate-500 font-medium">
        <span className="text-slate-700">Shift A</span> · 06:00 – 14:00
      </div>
      <div className="w-px h-6 bg-slate-200" />
      <div className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-md">
        15 Dec 2026 – 21 Dec 2026
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2.5">
        <button onClick={onNewBooking} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm">
          <Plus size={14} strokeWidth={2.5} />
          New Walk-In
        </button>
        <button onClick={() => onNavigate?.('pos')} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm">
          <ChefHat size={14} strokeWidth={2.5} />
          New KOT
        </button>
      </div>
      <div className="w-px h-6 bg-slate-200" />
      <div className="relative">
        <Bell size={18} className="text-slate-500 cursor-pointer hover:text-slate-700" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">JM</div>
    </header>
  );
}
