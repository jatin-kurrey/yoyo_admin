import { useState } from 'react';
import { Bell, Plus, ChefHat, ChevronDown, X } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function Header({ onNewBooking, onNavigate }) {
  const { roomStatuses, dispatch } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [];
  (roomStatuses || []).forEach(r => {
    if (r.cleanStatus === 'dirty') {
      notifications.push({
        id: `dirty-${r.number}`,
        type: 'dirty',
        text: `Room ${r.number} is DIRTY and needs cleaning.`,
        actionLabel: 'Mark Clean',
        payload: r.number,
        actionType: 'SET_ROOM_CLEAN',
      });
    }
    if (r.status === 'ooo') {
      notifications.push({
        id: `ooo-${r.number}`,
        type: 'ooo',
        text: `Room ${r.number} is Out of Order (${r.oooReason || 'Maintenance'}).`,
        actionLabel: 'Mark Available',
        payload: r.number,
        actionType: 'SET_ROOM_AVAILABLE',
      });
    }
  });

  const handleAction = (notif) => {
    dispatch({ type: notif.actionType, payload: notif.payload });
  };

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
        <div className="relative p-1 cursor-pointer hover:bg-slate-50 rounded" onClick={() => setShowNotifications(!showNotifications)}>
          <Bell size={18} className="text-slate-500 hover:text-slate-700" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </div>
        
        {showNotifications && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-40 text-slate-700 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">
                    {notifications.length} Actionable
                  </span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 flex flex-col gap-1.5">
                      <p className="text-slate-600 leading-snug">{n.text}</p>
                      <button onClick={() => { handleAction(n); setShowNotifications(false); }} className="self-start text-[10px] px-2 py-0.5 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors">
                        {n.actionLabel}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="w-px h-6 bg-slate-200" />
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold cursor-pointer">JM</div>
    </header>
  );
}
