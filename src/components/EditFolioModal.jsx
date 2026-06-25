import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { useApp } from '../store/AppContext';

export default function EditFolioModal({ booking, onClose }) {
  const { refreshData, showToast, dispatch, folioCharges } = useApp();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('charges');

  // Add Charge Form State
  const [chargeForm, setChargeForm] = useState({
    type: 'room_service',
    description: '',
    amount: '',
    quantity: 1,
  });

  // Add Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    mode: 'Cash',
    amount: '',
    reference: '',
  });

  const loadFolioData = async () => {
    try {
      setLoading(true);
      const res = await pmsService.getFolio(booking.bookingRef);
      if (res?.data) {
        setEntries(res.data.entries || []);
        setPayments(res.data.payments || []);
      } else {
        setEntries([]);
        setPayments([]);
      }
    } catch (err) {
      // In mock mode, use local folio charges
      const localCharges = folioCharges.filter(f => f.bookingRef === booking.id || f.bookingRef === booking.bookingRef);
      setEntries(localCharges.map(c => ({ ...c, amount: c.amount })));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (booking?.bookingRef) {
      loadFolioData();
    }
  }, [booking]);

  const handleAddCharge = async (e) => {
    e.preventDefault();
    const amt = parseInt(chargeForm.amount);
    if (!chargeForm.description.trim() || !amt || amt <= 0) {
      alert('Please enter a valid description and amount');
      return;
    }

    try {
      await pmsService.addFolioEntry(booking.bookingRef, {
        booking_id: booking.bookingRef,
        type: chargeForm.type,
        description: chargeForm.description,
        amount: amt,
        quantity: parseInt(chargeForm.quantity) || 1,
      });
    } catch (err) {
      // Mock mode fallback
      dispatch({ type: 'ADD_FOLIO_CHARGE', payload: { bookingRef: booking.bookingRef || booking.id, charge: { type: chargeForm.type, description: chargeForm.description, amount: amt, quantity: parseInt(chargeForm.quantity) || 1 } } });
    }
    showToast('Folio charge added successfully');
    setChargeForm({ type: 'room_service', description: '', amount: '', quantity: 1 });
    await loadFolioData();
    await refreshData();
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amt = parseInt(paymentForm.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await pmsService.addPayment(booking.bookingRef, {
        booking_id: booking.bookingRef,
        mode: paymentForm.mode,
        amount: amt,
        type: 'settlement',
        reference: paymentForm.reference,
      });
    } catch (err) {
      // Mock mode fallback - add payment to local state
      dispatch({ type: 'ADD_PAYMENT', payload: { bookingId: booking.id, amount: amt, mode: paymentForm.mode } });
    }
    showToast('Payment recorded successfully');
    setPaymentForm({ mode: 'Cash', amount: '', reference: '' });
    await loadFolioData();
    await refreshData();
  };

  const totalCharges = entries.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
  const totalPayments = payments.reduce((sum, item) => sum + item.amount, 0);
  const remainingBalance = totalCharges - totalPayments;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Room Folio — Room {booking.roomNumber}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Guest: {booking.guestName} | Plan: {booking.plan}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        {/* Summary Banner */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-b border-slate-200 py-3 text-center shrink-0">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Charges</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">₹{totalCharges.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Paid</div>
            <div className="text-sm font-bold text-emerald-600 mt-0.5">₹{totalPayments.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</div>
            <div className={`text-sm font-bold mt-0.5 ${remainingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              ₹{remainingBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 px-4 shrink-0 bg-white">
          <button onClick={() => setActiveTab('charges')} className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === 'charges' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Charges & Folio Entries
          </button>
          <button onClick={() => setActiveTab('payments')} className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Payments History
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading folio details...</div>
          ) : activeTab === 'charges' ? (
            <>
              {/* Add Charge Form */}
              <form onSubmit={handleAddCharge} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Plus size={14} /> Add Extra Charge</div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Type</label>
                    <select value={chargeForm.type} onChange={e => setChargeForm({...chargeForm, type: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white">
                      <option value="room_service">Room Service</option>
                      <option value="restaurant">Restaurant / F&B</option>
                      <option value="laundry">Laundry</option>
                      <option value="extra_bed">Extra Bed</option>
                      <option value="other">Other Charge</option>
                    </select>
                  </div>
                  <div className="col-span-5">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                    <input type="text" placeholder="e.g. Dinner Room Service" value={chargeForm.description} onChange={e => setChargeForm({...chargeForm, description: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Amount (₹)</label>
                    <input type="number" placeholder="400" value={chargeForm.amount} onChange={e => setChargeForm({...chargeForm, amount: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Qty</label>
                    <input type="number" min="1" value={chargeForm.quantity} onChange={e => setChargeForm({...chargeForm, quantity: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded" />
                  </div>
                </div>
                <button type="submit" className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors">
                  Post Charge to Folio
                </button>
              </form>

              {/* Charges List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Charges Breakdown</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {entries.length === 0 ? (
                        <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">No charges posted to this room yet.</td></tr>
                      ) : (
                        entries.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-800">{item.description || 'Room Rent Charge'}</td>
                            <td className="px-4 py-2 capitalize">{item.type?.replace('_', ' ')}</td>
                            <td className="px-4 py-2 text-right">₹{item.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">{item.quantity || 1}</td>
                            <td className="px-4 py-2 text-right font-medium">₹{(item.amount * (item.quantity || 1)).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Add Payment Form */}
              <form onSubmit={handleAddPayment} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Plus size={14} /> Record Payment / Settlement</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Mode</label>
                    <select value={paymentForm.mode} onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Amount (₹)</label>
                    <input type="number" placeholder="5000" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Reference (Optional)</label>
                    <input type="text" placeholder="e.g. TXN183742" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded" />
                  </div>
                </div>
                <button type="submit" className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors">
                  Record Payment
                </button>
              </form>

              {/* Payments List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Received Payments</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 font-semibold">
                      <tr>
                        <th className="px-4 py-2">Date / Time</th>
                        <th className="px-4 py-2">Payment Mode</th>
                        <th className="px-4 py-2">Reference</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {payments.length === 0 ? (
                        <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400">No payments recorded yet.</td></tr>
                      ) : (
                        payments.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 text-slate-500">
                              {item.received_at ? new Date(item.received_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                            </td>
                            <td className="px-4 py-2 font-medium text-slate-800">{item.mode}</td>
                            <td className="px-4 py-2 text-slate-400">{item.reference || '-'}</td>
                            <td className="px-4 py-2 text-right font-semibold text-emerald-600">₹{item.amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
            Close Folio
          </button>
        </div>
      </div>
    </div>
  );
}
