import { useState } from 'react';
import { DollarSign, ToggleLeft, ToggleRight, Save, RefreshCw } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { dayLabels, pricingCalendar } from '../data/mockData';

export default function PricingPage() {
  const { pricingRates, stopSell, dispatch } = useApp();
  const [activeCategory, setActiveCategory] = useState('Super Deluxe');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [epRate, setEpRate] = useState(4000);
  const [cpRate, setCpRate] = useState(4800);
  const [apRate, setApRate] = useState(6000);

  const toggleStopSell = (cat, dateIdx) => {
    dispatch({ type: 'TOGGLE_STOP_SELL', payload: { category: cat, dateIdx } });
  };

  const handleBulkUpdate = () => {
    dispatch({ type: 'UPDATE_RATE', payload: { category: activeCategory, rates: { ep: epRate, cp: cpRate, ap: apRate, baseRate: epRate } } });
    setShowBulkUpdate(false);
  };

  const categoryColors = {
    'Super Deluxe': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    'Family Suite': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    'Executive Pack': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  };

  const cats = pricingCalendar[0]?.categories || [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Pricing & Channel Manager</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulkUpdate(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Save size={13} /> Bulk Update Rates
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} /> Sync Channels
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {pricingRates.map((cat) => {
          const cc = categoryColors[cat.category] || {};
          return (
            <div key={cat.category} onClick={() => setActiveCategory(cat.category)}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-sm ${activeCategory === cat.category ? `${cc.bg} ${cc.border}` : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${cc.text}`}>{cat.category}</span>
                <DollarSign size={16} className={cc.text} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[9px] text-slate-500 mb-0.5">EP</div><div className="text-sm font-bold text-slate-800">₹{cat.ep}</div></div>
                <div><div className="text-[9px] text-slate-500 mb-0.5">CP</div><div className="text-sm font-bold text-slate-800">₹{cat.cp}</div></div>
                <div><div className="text-[9px] text-slate-500 mb-0.5">AP</div><div className="text-sm font-bold text-slate-800">₹{cat.ap}</div></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rate Calendar — Next 7 Days</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200">Category</th>
                {dayLabels.map((dl) => (
                  <th key={dl} className="px-3 py-2.5 text-[10px] font-semibold text-slate-500 border-r border-slate-200 text-center">{dl}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => (
                <tr key={cat.name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-200">{cat.name}</td>
                  {pricingCalendar.map((day, di) => {
                    const dayCat = day.categories.find(c => c.name === cat.name);
                    const isStopped = stopSell[cat.name]?.[di];
                    return (
                      <td key={di} className="px-3 py-3 border-r border-slate-100 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-semibold ${isStopped ? 'text-red-400 line-through' : 'text-slate-800'}`}>₹{dayCat?.rate}</span>
                          <button onClick={() => toggleStopSell(cat.name, di)}
                            className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold transition-colors ${isStopped ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {isStopped ? <ToggleRight size={10} /> : <ToggleLeft size={10} />}
                            {isStopped ? 'Stop' : 'Live'}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Channel Sync Status</h3>
        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Agoda — Connected</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> MakeMyTrip — Connected</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Booking.com — Connected</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expedia — Syncing...</div>
          <span className="text-emerald-600 font-semibold text-[10px] ml-auto">Last sync: Live</span>
        </div>
      </div>

      {showBulkUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowBulkUpdate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-[420px] p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Bulk Update Rates — {activeCategory}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">EP Rate</label>
                  <input type="number" value={epRate} onChange={e => setEpRate(+e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">CP Rate</label>
                  <input type="number" value={cpRate} onChange={e => setCpRate(+e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">AP Rate</label>
                  <input type="number" value={apRate} onChange={e => setApRate(+e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[10px] text-amber-700">
                Changes will automatically sync to all connected OTAs via Channel Manager.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => setShowBulkUpdate(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleBulkUpdate} className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg">Apply Rates</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
