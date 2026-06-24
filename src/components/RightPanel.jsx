import { useApp } from '../store/AppContext';
import { MoveRight } from 'lucide-react';

export default function RightPanel() {
  const { todayStats, housekeepingStats, posTables, dispatch, occupancyRate, totalRooms, transactions } = useApp();

  const liveOrders = posTables.filter(t => t.status === 'occupied');
  const paidTxns = transactions.filter(t => t.type === 'income' && t.status === 'completed');
  const totalPaid = paidTxns.reduce((s, t) => s + t.amount, 0);
  const hasPayments = totalPaid > 0;
  const cashTotal = paidTxns.filter(t => t.method === 'Cash').reduce((s, t) => s + t.amount, 0);
  const upiTotal = paidTxns.filter(t => t.method === 'UPI').reduce((s, t) => s + t.amount, 0);
  const cardTotal = paidTxns.filter(t => t.method === 'Card' || t.method === 'Room Folio').reduce((s, t) => s + t.amount, 0);
  const cashPct = hasPayments ? Math.round((cashTotal / totalPaid) * 100) : 0;
  const upiPct = hasPayments ? Math.round((upiTotal / totalPaid) * 100) : 0;
  const cardPct = hasPayments ? 100 - cashPct - upiPct : 0;

  const handleMoveToRoom = (tableId, tableNumber) => {
    const rooms = document.createElement('div');
    const room = prompt(`Enter room number to move Table ${tableNumber} bill to:`);
    if (room && +room) {
      dispatch({ type: 'MOVE_TO_ROOM', payload: { tableId, roomNumber: +room } });
    }
  };

  return (
    <aside className="w-[280px] min-w-[280px] bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Today's Overview</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Arrivals', value: todayStats.arrivals, color: 'text-emerald-600' },
            { label: 'Departures', value: todayStats.departures, color: 'text-red-600' },
            { label: 'In-House', value: todayStats.inHouse, color: 'text-blue-600' },
            { label: 'Vacant', value: todayStats.vacant, color: 'text-slate-600' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-3">
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Revenue Today</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Total Revenue</span>
            <span className="text-sm font-bold text-slate-800">₹{todayStats.revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Collected</span>
            <span className="text-sm font-semibold text-emerald-600">₹{todayStats.collected.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Discounts</span>
            <span className="text-sm font-semibold text-red-500">-₹{todayStats.discounts}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="w-8">Cash</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cashPct}%` }} />
            </div>
            <span className="font-medium text-slate-700 w-8 text-right">{cashPct}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="w-8">UPI</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${upiPct}%` }} />
            </div>
            <span className="font-medium text-slate-700 w-8 text-right">{upiPct}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-8">Card</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${cardPct}%` }} />
            </div>
            <span className="font-medium text-slate-700 w-8 text-right">{cardPct}%</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Housekeeping</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Clean</span>
              <span className="font-semibold text-emerald-600">{housekeepingStats.clean}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalRooms > 0 && (housekeepingStats.clean + housekeepingStats.dirty) > 0 ? (housekeepingStats.clean / (housekeepingStats.clean + housekeepingStats.dirty)) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Dirty</span>
              <span className="font-semibold text-red-500">{housekeepingStats.dirty}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${housekeepingStats.dirty > 0 ? (housekeepingStats.dirty / (housekeepingStats.clean + housekeepingStats.dirty)) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Occupancy: <strong className="text-slate-700">{occupancyRate}%</strong></span>
          <span>OOO: <strong className="text-slate-700">{housekeepingStats.ooo}</strong></span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Live POS Feed</h3>
        <div className="space-y-2">
          {liveOrders.length === 0 ? (
            <div className="text-[10px] text-slate-400 text-center py-4">No active orders</div>
          ) : (
            liveOrders.map((t) => (
              <div key={t.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-slate-700">Table {t.number}</span>
                  <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-semibold">
                    {t.kotCount || 0} KOT
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mb-1">{t.guestName} · ₹{t.orderValue}</div>
                <button
                  onClick={() => handleMoveToRoom(t.id, t.number)}
                  className="flex items-center gap-1 text-[10px] text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  <MoveRight size={12} /> Move to Room
                </button>
              </div>
            ))
          )}
          <div className="text-center pt-2">
            <span className="text-[10px] text-emerald-600 font-semibold">{liveOrders.length} active order{liveOrders.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span>Cloud Sync Active</span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-[9px]">v2.0.1</span>
        </div>
      </div>
    </aside>
  );
}
