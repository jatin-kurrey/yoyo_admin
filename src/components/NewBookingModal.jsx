import { useState, useCallback } from 'react';
import { X, User, Phone, Calendar } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function NewBookingModal({ onClose, prefillRoom, prefillDate }) {
  const { dispatch, roomCategories, pricingRates, dates, defaultRules } = useApp();

  const normalize = (name) => {
    if (!name) return '';
    return name
      .toUpperCase()
      .replace(/ROOMS|ROOM|SUITES|SUITE/g, '')
      .replace(/[^A-Z0-9]/g, '');
  };

  const findCategoryForRoom = (num) => {
    for (const cat of roomCategories) {
      if (cat.rooms.some(r => r.number === num)) return cat.name;
    }
    return roomCategories[0]?.name || '';
  };

  const getRate = useCallback((category, plan) => {
    const pr = pricingRates.find(r => normalize(r.category) === normalize(category));
    if (!pr) return 4000;
    const key = plan.toLowerCase();
    return pr[key] || pr.baseRate || pr.ep || 4000;
  }, [pricingRates]);

  const defaultCategory = prefillRoom ? findCategoryForRoom(prefillRoom) : (roomCategories[0]?.name || '');

  const [form, setForm] = useState({
    guestName: '', mobile: '', category: defaultCategory,
    checkIn: prefillDate || dates[0], checkOut: (() => {
      const d = new Date(prefillDate || dates[0]);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    adults: 2, children: 0, plan: 'EP', source: 'Walk-In',
    rate: getRate(defaultCategory, 'EP'),
  });

  const updateForm = (updates) => {
    const next = { ...form, ...updates };
    if (updates.category || updates.plan) {
      next.rate = getRate(next.category, next.plan);
    }
    setForm(next);
  };

  const [payment, setPayment] = useState({ mode: 'Cash', amount: '' });

  const cat = roomCategories.find(c => normalize(c.name) === normalize(form.category));
  const availableRooms = cat ? cat.rooms.filter(r => r.status === 'available') : [];
  const nights = Math.max(1, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24)));
  const extraAdults = Math.max(0, form.adults - 2);
  const taxRate = defaultRules?.taxRate || 12;
  const tax = Math.round(form.rate * nights * taxRate / 100);
  const total = form.rate * nights + extraAdults * 500 + tax;

  const minPct = defaultRules?.minAdvancePct || 0;
  const minAmt = defaultRules?.minAdvanceAmt || 0;
  const minRequiredAmount = Math.max(minAmt, Math.round(total * minPct / 100));

  const handleSubmit = () => {
    if (!form.guestName.trim()) return alert('Enter guest name');
    if (availableRooms.length === 0) return alert('No rooms available in this category');

    const today = new Date().toISOString().slice(0, 10);
    const isFuture = form.checkIn > today;

    // Enforce minimum advance payment for check-in
    if (!isFuture && minRequiredAmount > 0) {
      const paid = Number(payment.amount) || 0;
      if (paid < minRequiredAmount) {
        return alert(`Minimum advance payment of ₹${minRequiredAmount} is required to check-in.`);
      }
    }

    const roomNumber = prefillRoom || availableRooms[0].number;

    dispatch({
      type: 'ADD_BOOKING',
      payload: {
        roomNumber,
        guestName: form.guestName,
        mobile: form.mobile,
        adults: form.adults,
        children: form.children,
        pax: `${form.adults}+${form.children}`,
        plan: form.plan,
        source: form.source,
        rate: form.rate,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        balance: total - (payment.amount || 0),
        advancePaid: payment.amount || 0,
        totalAmount: total,
        status: isFuture ? 'future' : 'checked-in',
      },
    });

    if (payment.amount > 0) {
      dispatch({ type: 'ADD_TRANSACTION', payload: {
        date: form.checkIn, type: 'income', category: 'Room Booking',
        description: `${form.guestName} - Advance Payment`, amount: payment.amount,
        method: payment.mode, status: 'completed',
      }});
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">
            New Reservation {prefillRoom ? `— Room ${prefillRoom}` : ''}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.guestName} onChange={e => setForm({...form, guestName: e.target.value})} placeholder="Guest name..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Mobile</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="tel" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="Phone..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
              <select value={form.category} onChange={e => updateForm({category: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                {roomCategories.map(c => {
                  const displayName = c.name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
                  return (
                    <option key={c.name} value={c.name}>{displayName}</option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Check-In</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Check-Out</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div><label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Adults</label>
              <select value={form.adults} onChange={e => setForm({...form, adults: +e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">{[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}</select></div>
            <div><label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Children</label>
              <select value={form.children} onChange={e => setForm({...form, children: +e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">{[0,1,2,3].map(n => <option key={n}>{n}</option>)}</select></div>
            <div><label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Plan</label>
              <select value={form.plan} onChange={e => updateForm({plan: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"><option>EP</option><option>CP</option><option>AP</option></select></div>
            <div><label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Source</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"><option>Walk-In</option><option>Agoda</option><option>MakeMyTrip</option><option>Booking.com</option><option>Corporate</option></select></div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Rate / Night</span><span className="font-semibold text-slate-800">₹{form.rate}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Nights</span><span className="font-semibold">{nights}</span></div>
            {extraAdults > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Extra Adult (₹500 × {extraAdults})</span><span className="font-semibold">₹{extraAdults * 500}</span></div>}
            <div className="flex justify-between text-xs"><span className="text-slate-500">Tax ({taxRate}%)</span><span className="font-semibold">₹{tax}</span></div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-800">
              <span>Total</span>
              <span className="text-emerald-600">₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Advance Payment</label>
              {minRequiredAmount > 0 && (
                <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Min Required: ₹{minRequiredAmount.toLocaleString()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['Cash', 'UPI', 'Card'].map(mode => (
                <div key={mode} onClick={() => setPayment({...payment, mode})}
                  className={`flex items-center justify-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition-colors text-xs font-medium ${
                    payment.mode === mode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}>
                  {mode}
                </div>
              ))}
            </div>
            <input type="number" value={payment.amount} onChange={e => {
              const val = e.target.value;
              setPayment({...payment, amount: val === '' ? '' : Number(val)});
            }} placeholder="Advance amount..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">Confirm & Check-In</button>
        </div>
      </div>
    </div>
  );
}
