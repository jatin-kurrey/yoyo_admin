import { useState, useMemo } from 'react';
import { DollarSign, Save, RefreshCw, CalendarCheck, X, Check, ChevronDown } from 'lucide-react';
import { useApp } from '../store/AppContext';

const RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '1 Month', value: 30 },
  { label: '3 Months', value: 90 },
  { label: '6 Months', value: 180 },
  { label: '1 Year', value: 365 },
];

const categoryColors = {
  'Super Deluxe': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', cell: 'bg-blue-100' },
  'Family Suite': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', cell: 'bg-purple-100' },
  'Executive Pack': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', cell: 'bg-amber-100' },
};

export default function PricingPage() {
  const { pricingRates, dateRateOverrides, dates, dayLabels, dispatch, showToast } = useApp();
  const [tab, setTab] = useState('cards');
  const [activeCategory, setActiveCategory] = useState(pricingRates[0]?.category || 'Super Deluxe');
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [epRate, setEpRate] = useState(4000);
  const [cpRate, setCpRate] = useState(4800);
  const [apRate, setApRate] = useState(6000);
  const [editCell, setEditCell] = useState(null);
  const [cellEditValue, setCellEditValue] = useState(0);
  const [calRange, setCalRange] = useState(30);
  const [showRangePicker, setShowRangePicker] = useState(false);

  const calDates = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < calRange; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    }
    return result;
  }, [calRange]);

  const calDayLabels = useMemo(() => {
    const today = new Date();
    const labels = [];
    for (let i = 0; i < calRange; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (i === 0) labels.push('Today');
      else labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
    }
    return labels;
  }, [calRange]);

  const activeRate = pricingRates.find(r => r.category === activeCategory);

  const openBulkUpdate = (cat) => {
    setActiveCategory(cat.category);
    setEpRate(cat.ep);
    setCpRate(cat.cp);
    setApRate(cat.ap);
    setShowBulkUpdate(true);
  };

  const handleBulkUpdate = () => {
    dispatch({ type: 'UPDATE_RATE', payload: { category: activeCategory, rates: { ep: epRate, cp: cpRate, ap: apRate, baseRate: epRate } } });
    setShowBulkUpdate(false);
    showToast('Rates updated');
  };

  const handleSetDateRate = (catName, date, plan, value) => {
    const existing = dateRateOverrides?.[catName]?.[date] || {};
    const rates = { ...existing, [plan]: value };
    if (rates.ep == null) rates.ep = pricingRates.find(r => r.category === catName)?.ep || 4000;
    if (rates.cp == null) rates.cp = pricingRates.find(r => r.category === catName)?.cp || 4800;
    if (rates.ap == null) rates.ap = pricingRates.find(r => r.category === catName)?.ap || 6000;
    dispatch({ type: 'SET_DATE_RATE', payload: { category: catName, date, rates } });
  };

  const handleClearDateRate = (catName, date) => {
    dispatch({ type: 'CLEAR_DATE_RATE', payload: { category: catName, date } });
    setEditCell(null);
    showToast('Reset to default rate');
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Pricing & Channel Manager</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => openBulkUpdate(activeRate || pricingRates[0])} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Save size={13} /> Bulk Update Rates
          </button>
          <button onClick={() => showToast('Rates synced to all channels')} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} /> Sync Channels
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        <button onClick={() => setTab('cards')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${tab === 'cards' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <DollarSign size={14} /> Rate Cards
        </button>
        <button onClick={() => setTab('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${tab === 'calendar' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <CalendarCheck size={14} /> Calendar View
        </button>
      </div>

      {tab === 'cards' ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            {pricingRates.map((cat) => {
              const cc = categoryColors[cat.category] || {};
              return (
                <div key={cat.category} onClick={() => { setActiveCategory(cat.category); openBulkUpdate(cat); }}
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
                  {pricingRates.map((cat) => (
                    <tr key={cat.category} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-200">{cat.category}</td>
                      {dates.map((date, di) => {
                        const override = dateRateOverrides?.[cat.category]?.[date];
                        return (
                          <td key={di} className="px-3 py-3 border-r border-slate-100 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs font-semibold ${override ? 'text-orange-600' : 'text-slate-800'}`}>
                                ₹{override?.ep || cat.ep}
                              </span>
                              {override && <span className="text-[8px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded font-medium">Custom</span>}
                              {!override && <span className="text-[8px] text-emerald-500 font-medium">Default</span>}
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
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date-wise Pricing</h3>
                <div className="relative">
                  <button onClick={() => setShowRangePicker(!showRangePicker)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors">
                    {RANGE_OPTIONS.find(r => r.value === calRange)?.label || `${calRange} Days`}
                    <ChevronDown size={11} />
                  </button>
                  {showRangePicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                      {RANGE_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setCalRange(opt.value); setShowRangePicker(false); setEditCell(null); }}
                          className={`block w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 ${calRange === opt.value ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                <span className="inline-block w-3 h-3 rounded bg-orange-100 border border-orange-300 align-middle mr-1" />
                Custom rate
                <span className="inline-block w-3 h-3 rounded bg-white border border-slate-300 align-middle mx-2 ml-3" />
                Default rate
              </span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-b border-slate-200 w-[140px]">Category</th>
                    <th className="px-2 py-2.5 text-[10px] font-semibold text-slate-500 border-r border-b border-slate-200 text-center w-12">Plan</th>
                    {calDates.map((date, i) => (
                      <th key={date} className={`px-1.5 py-2 text-[10px] font-semibold border-r border-b border-slate-200 text-center ${i === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                        <div>{calDayLabels[i]}</div>
                        <div className={`text-[9px] ${i === 0 ? 'text-blue-500' : 'text-slate-400'}`}>{date}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pricingRates.map((cat) => (
                    ['EP', 'CP', 'AP'].map((plan, pi) => {
                      const cc = categoryColors[cat.category] || {};
                      return (
                        <tr key={`${cat.category}-${plan}`} className={`${pi === 2 ? '' : 'border-b border-slate-50'}`}>
                          {pi === 0 && (
                            <td rowSpan={3} className={`px-4 py-3 font-semibold text-slate-700 border-r border-b border-slate-200 align-top ${cc.bg}`}>
                              <div className="text-xs">{cat.category}</div>
                              <div className="text-[9px] text-slate-400 mt-0.5">Base: ₹{cat.ep} / night</div>
                            </td>
                          )}
                          <td className="px-2 py-1.5 border-r border-slate-100 text-center">
                            <span className={`text-[10px] font-semibold ${plan === 'EP' ? 'text-emerald-600' : plan === 'CP' ? 'text-blue-600' : 'text-amber-600'}`}>{plan}</span>
                          </td>
                          {calDates.map((date, di) => {
                            const base = cat[plan.toLowerCase()];
                            const override = dateRateOverrides?.[cat.category]?.[date];
                            const rate = override?.[plan.toLowerCase()] ?? base;
                            const isOverridden = override?.[plan.toLowerCase()] != null;
                            const isEditing = editCell?.category === cat.category && editCell?.date === date && editCell?.plan === plan;

                            if (isEditing) {
                              return (
                                <td key={date} className={`px-1 py-1 border-r border-slate-100 ${di === 0 ? 'bg-blue-50/30' : ''}`}>
                                  <div className="flex items-center gap-0.5">
                                    <input
                                      type="number"
                                      value={cellEditValue}
                                      onChange={e => setCellEditValue(+e.target.value)}
                                      className="w-full px-1 py-1 text-[10px] border border-blue-300 rounded bg-blue-50 text-center font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400"
                                      autoFocus
                                    />
                                    <button onClick={() => { handleSetDateRate(cat.category, date, plan.toLowerCase(), cellEditValue); setEditCell(null); }}
                                      className="p-0.5 text-emerald-600 hover:text-emerald-700"><Check size={12} /></button>
                                    <button onClick={() => setEditCell(null)}
                                      className="p-0.5 text-red-400 hover:text-red-600"><X size={12} /></button>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td key={date}
                                onClick={() => { setEditCell({ category: cat.category, date, plan }); setCellEditValue(rate); }}
                                className={`px-1.5 py-1.5 border-r border-slate-100 text-center cursor-pointer transition-colors hover:bg-slate-50 ${di === 0 ? 'bg-blue-50/30' : ''} ${isOverridden ? 'bg-orange-50' : ''}`}>
                                <div className={`text-xs font-semibold ${isOverridden ? 'text-orange-600' : 'text-slate-700'}`}>₹{rate}</div>
                                {isOverridden && <div className="text-[8px] text-orange-400">Custom</div>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Tip:</span> Click any rate cell to set a date-specific override. The orange-highlighted cells show custom rates.
            </div>
            <button onClick={() => {
              if (window.confirm('Reset all date-specific overrides?')) {
                pricingRates.forEach(cat => {
                  calDates.forEach(date => {
                    if (dateRateOverrides?.[cat.category]?.[date]) {
                      dispatch({ type: 'CLEAR_DATE_RATE', payload: { category: cat.category, date } });
                    }
                  });
                });
                showToast('All date overrides cleared');
              }
            }} className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Clear All Overrides
            </button>
          </div>
        </>
      )}

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
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Update Rates — {activeCategory}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">EP Rate</label>
                  <input type="number" value={epRate} onChange={e => setEpRate(+e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">CP Rate</label>
                  <input type="number" value={cpRate} onChange={e => setCpRate(+e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                <div><label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">AP Rate</label>
                  <input type="number" value={apRate} onChange={e => setApRate(+e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
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
