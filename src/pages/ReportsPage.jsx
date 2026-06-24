import { useState } from 'react';
import { Printer, Download, Mail, TrendingUp, Play, CheckCircle2 } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function ReportsPage() {
  const { dailyRevenue, bookings, roomCategories, transactions, dispatch, defaultRules, showToast } = useApp();
  const [activeReport, setActiveReport] = useState('nightaudit');
  const [scheduled, setScheduled] = useState(false);
  const [email, setEmail] = useState('manager@yoyofun.in');
  const [auditDone, setAuditDone] = useState(false);
  const today = new Date();
  const dateRange = `${today.getDate()} ${today.toLocaleString('en-IN', { month: 'short' })} ${today.getFullYear()}`;
  const weekRange = `${dateRange} – ${new Date(today.getTime() + 6 * 86400000).getDate()} ${new Date(today.getTime() + 6 * 86400000).toLocaleString('en-IN', { month: 'short' })} ${today.getFullYear()}`;

  const totalRooms = roomCategories.reduce((s, c) => s + c.rooms.length, 0);
  const occupiedRooms = bookings.filter(b => b.status === 'checked-in').length;
  const occupancyPct = totalRooms > 0 ? Math.round(occupiedRooms / totalRooms * 100) : 0;
  const totalRev = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalTax = Math.round(totalRev * defaultRules.taxRate / 100);
  const totalDiscounts = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.round(t.amount * 0.03), 0);
  const netRev = totalRev - totalTax - totalDiscounts;
  const cashCollected = transactions.filter(t => t.method === 'Cash' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const upiCollected = transactions.filter(t => t.method === 'UPI' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const cardCollected = transactions.filter(t => (t.method === 'Card' || t.method === 'Room Folio') && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const pendingBalance = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const adr = occupiedRooms > 0 ? Math.round(totalRev / occupiedRooms) : 0;
  const revpar = Math.round(adr * (occupancyPct / 100));
  const maxRev = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  const handleExportCSV = () => {
    const headers = 'Date,Revenue,Occupancy%,ADR,RevPAR\n';
    const rows = dailyRevenue.map(d => {
      const dayOccupied = Math.round(d.occupancy / 100 * totalRooms);
      const dayAdr = dayOccupied > 0 ? Math.round(d.revenue / dayOccupied) : 0;
      const dayRevpar = Math.round(dayAdr * (d.occupancy / 100));
      return `${d.date},${d.revenue},${d.occupancy},${dayAdr},${dayRevpar}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'revenue-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleNightAudit = () => {
    if (window.confirm(`Run Night Audit for ${dateRange}? This will finalize today's business and roll over to the next day.`)) {
      setAuditDone(true);
      const todayISO = new Date().toISOString().slice(0, 10);
      dispatch({ type: 'ADD_TRANSACTION', payload: {
        date: todayISO, type: 'income', category: 'Night Audit',
        description: 'Night Audit - Daily closing', amount: netRev,
        method: 'System', status: 'completed',
      }});
      setTimeout(() => setAuditDone(false), 3000);
    }
  };

  const handleScheduleEmail = () => {
    dispatch({ type: 'UPDATE_EMAIL_SCHEDULER', payload: { enabled: !scheduled, email } });
    setScheduled(!scheduled);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Reports & Audits</h1>
        <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-0 flex-wrap">
        {[
          { key: 'nightaudit', label: 'Night Audit Report' },
          { key: 'revenue', label: 'Room Revenue Report' },
          { key: 'revpar', label: 'RevPAR Analysis' },
          { key: 'summary', label: 'Bill Summary' },
        ].map((r) => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${activeReport === r.key ? 'text-slate-800 border-slate-800' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {activeReport === 'nightaudit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Night Audit Summary</h3>
                <p className="text-[11px] text-slate-500">{dateRange}</p>
              </div>
              <div className="flex gap-2">
                {auditDone && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle2 size={12} /> Audit Complete
                  </span>
                )}
                <button onClick={handleNightAudit} className="flex items-center gap-1 text-[10px] font-semibold text-white bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700">
                  <Play size={12} /> Run Night Audit
                </button>
                <button onClick={() => showToast('Printing night audit report')} className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 px-2.5 py-1.5 rounded hover:bg-blue-50 border border-blue-200"><Printer size={12} /> Print</button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Total Rooms', value: totalRooms },
                { label: 'Occupied', value: occupiedRooms, color: 'text-blue-600' },
                { label: 'Vacant', value: totalRooms - occupiedRooms - roomCategories.flatMap(c => c.rooms).filter(r => r.status === 'ooo').length, color: 'text-emerald-600' },
                { label: 'Occupancy %', value: `${occupancyPct}%`, color: 'text-amber-600' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className={`text-lg font-bold ${item.color || 'text-slate-800'}`}>{item.value}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase">Revenue Summary</h4>
                <div className="flex justify-between text-xs"><span className="text-slate-600">Total Revenue</span><span className="font-semibold">₹{totalRev.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-600">Tax Collected</span><span className="font-semibold">₹{totalTax.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-600">Discounts</span><span className="font-semibold text-red-500">-₹{totalDiscounts}</span></div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200"><span className="font-semibold text-slate-700">Net Revenue</span><span className="font-bold text-slate-800">₹{netRev.toLocaleString()}</span></div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase">Payment Collection</h4>
                <div className="flex justify-between text-xs"><span className="text-slate-600">Cash</span><span className="font-semibold">₹{cashCollected.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-600">UPI</span><span className="font-semibold">₹{upiCollected.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-600">Card / Folio</span><span className="font-semibold">₹{cardCollected.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200"><span className="font-semibold text-slate-700">Total Collected</span><span className="font-bold text-emerald-600">₹{(cashCollected + upiCollected + cardCollected).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-600">Pending</span><span className="font-semibold text-red-500">₹{pendingBalance.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Mail size={13} /> Automated Email Scheduler</h3>
            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <span>Send to:</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <button onClick={handleScheduleEmail}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${scheduled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {scheduled ? 'Scheduled ✓' : 'Schedule Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'revenue' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Room Revenue Report — {weekRange}</h3>
          <div className="flex items-end gap-3 h-48">
            {dailyRevenue.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="text-[9px] font-medium text-slate-500">₹{(d.revenue / 1000).toFixed(0)}K</div>
                <div className="w-full flex justify-center"><div className="w-5/6 bg-blue-500 rounded-t transition-all" style={{ height: `${(d.revenue / maxRev) * 120}px` }} /></div>
                <div className="text-[9px] text-slate-400 mt-1">{d.date}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-7 gap-2 text-center text-[10px] text-slate-500">
            {dailyRevenue.map((d) => (
              <div key={d.date}><div>Occupancy</div><div className="font-semibold text-slate-700">{d.occupancy}%</div></div>
            ))}
          </div>
        </div>
      )}

      {activeReport === 'revpar' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'ADR', value: `₹${adr}`, change: '+3.2%' },
            { label: 'RevPAR', value: `₹${revpar}`, change: '+8.3%' },
            { label: 'Avg Occupancy', value: `${occupancyPct}%`, change: '+5.2%' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">{item.label}</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-800 mb-1">{item.value}</div>
              <div className="text-[11px] text-emerald-600 font-medium">{item.change} vs last week</div>
            </div>
          ))}
          <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">RevPAR Trend (7 Days)</h3>
            <div className="flex items-end gap-3 h-40">
              {dailyRevenue.map((d) => {
                const r = Math.round(d.revenue * (d.occupancy / 100) / 10);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="text-[9px] font-medium text-slate-500">₹{r}</div>
                    <div className="w-full flex justify-center"><div className="w-5/6 bg-purple-500 rounded-t transition-all" style={{ height: `${Math.min(r / 4, 100)}px` }} /></div>
                    <div className="text-[9px] text-slate-400 mt-1">{d.date}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'summary' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Room Bill Summary</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">Room</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">Guest</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">Plan</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody>
              {bookings.filter(b => b.status === 'checked-in').map((b) => (
                <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-700">{b.roomNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{b.guestName}</td>
                  <td className="px-4 py-3 text-slate-500">{b.plan}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{b.balance || 0}</td>
                  <td className="px-4 py-3 text-right"><span className={`font-semibold ${b.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{b.balance > 0 ? `₹${b.balance}` : 'Clear'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
