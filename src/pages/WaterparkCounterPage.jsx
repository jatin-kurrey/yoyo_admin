import { useState, useEffect } from 'react';
import { Ticket, Users, Calendar, Phone, Mail, User, CreditCard, Banknote, Smartphone, CheckCircle, Printer } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { pmsService } from '../services/pmsService';
import InvoiceModal from '../components/InvoiceModal';

const paymentMethods = [
  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'bg-blue-500' },
  { id: 'Card', label: 'Card', icon: CreditCard, color: 'bg-purple-500' },
];

export default function WaterparkCounterPage() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [invoiceData, setInvoiceData] = useState(null);

  const fetchTicketsAndBookings = async () => {
    try {
      setLoading(true);
      const [ticketsRes, bookingsRes] = await Promise.all([
        pmsService.getAdminTickets(),
        pmsService.getAdminBookings()
      ]);
      if (ticketsRes.success) {
        setTickets(ticketsRes.data?.items || []);
        if (ticketsRes.data?.items?.length > 0) {
          setSelectedTicket(ticketsRes.data.items[0]);
        }
      }
      if (bookingsRes.success) {
        const list = bookingsRes.data?.items || [];
        setRecentBookings(list.filter(b => b.source === 'counter'));
      }
    } catch (e) {
      showToast('Failed to load tickets/bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndBookings();
  }, []);

  const handleBookTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return showToast('Please select a ticket', 'error');
    if (!guestName.trim()) return showToast('Please enter guest name', 'error');
    if (!guestPhone.trim()) return showToast('Please enter guest phone number', 'error');
    if (!guestEmail.trim()) return showToast('Please enter guest email', 'error');

    try {
      setSubmitting(true);
      const payload = {
        customer_name: guestName.trim(),
        customer_email: guestEmail.trim(),
        customer_phone: guestPhone.trim(),
        ticket_id: selectedTicket.id,
        quantity: parseInt(quantity),
        visit_date: visitDate,
      };
      
      const res = await pmsService.createCounterBooking(payload);
      if (res.success) {
        showToast('Ticket Booked successfully!');
        
        // Auto-sync customer to Unified Customer Register
        const custCode = `CST-${Math.floor(1000 + Math.random() * 9000)}`;
        dispatch({
          type: 'SYNC_CUSTOMER',
          payload: { customerCode: custCode, name: guestName.trim(), phone: guestPhone.trim(), email: guestEmail.trim() }
        });
        try {
          await pmsService.syncWaterparkCustomer({ customer_code: custCode, name: guestName.trim(), phone: guestPhone.trim(), email: guestEmail.trim() });
        } catch (err) {}
        
        // Show invoice modal
        const billData = {
          id: res.data.booking_id,
          tableNumber: null,
          area: 'Waterpark Counter',
          guestName: res.data.customer_name,
          items: [{ name: res.data.ticket?.title || selectedTicket.title, price: (res.data.ticket?.price || selectedTicket.price) / 100, qty: res.data.quantity }],
          total: (res.data.amount / 100),
          tax: 0,
          taxRate: 0,
          grandTotal: (res.data.amount / 100),
          date: new Date().toISOString(),
          paymentMethod,
          tendered: (res.data.amount / 100),
          change: 0,
        };
        
        setInvoiceData(billData);

        // Reset Form
        setGuestName('');
        setGuestPhone('');
        setGuestEmail('');
        setQuantity(1);

        // Refresh List
        fetchTicketsAndBookings();
      }
    } catch (error) {
      showToast(error.message || 'Counter booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const subtotal = selectedTicket ? (selectedTicket.price * quantity) / 100 : 0;

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50">
      {/* Booking Form Panel */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Waterpark Ticket Counter</h1>
            <p className="text-xs text-slate-500">Book tickets instantly at the resort front counter</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Ticket Selection & Details */}
          <div className="col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Ticket Category</h3>
            <div className="grid grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div key={t.id} onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTicket?.id === t.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-800">{t.title}</span>
                    {t.is_bestseller && (
                      <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">Bestseller</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 min-h-8 mb-3">{t.description}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-extrabold text-emerald-600">₹{t.price / 100}</span>
                    <span className="text-[9px] text-slate-400">Stock: {t.stock}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Guest Details Form */}
            <form onSubmit={handleBookTicket} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Guest Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Customer Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} required placeholder="Guest full name"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Mobile Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required placeholder="10-digit mobile number"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required placeholder="guest@email.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Visit Date</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Ticket Quantity</label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {paymentMethods.map(pm => {
                      const Icon = pm.icon;
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <button type="button" key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-semibold transition-all ${isSelected ? `${pm.color} text-white border-transparent` : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          <Icon size={12} />
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">Grand Total</span>
                  <span className="text-xl font-black text-emerald-600">₹{subtotal}</span>
                </div>
                <button type="submit" disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-1.5">
                  <CheckCircle size={14} /> {submitting ? 'Booking...' : 'Confirm Counter Booking'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats & Summary */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Counter Summary</h3>
            <div className="bg-slate-900 rounded-xl p-5 text-white space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">Total Counter Bookings</span>
                <span className="text-lg font-bold">{recentBookings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Counter Revenue</span>
                <span className="text-lg font-bold text-emerald-400">
                  ₹{recentBookings.reduce((s, b) => s + b.amount, 0) / 100}
                </span>
              </div>
            </div>

            {/* Recent Bookings List */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Recent Counter Bookings</h4>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {recentBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{b.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{b.booking_id} · Qty: {b.quantity}</div>
                      <div className="text-[9px] text-slate-400">{b.visit_date?.slice(0, 10)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-emerald-600">₹{b.amount / 100}</span>
                      <button onClick={() => setInvoiceData({
                        id: b.booking_id, tableNumber: null, area: 'Waterpark Counter', guestName: b.customer_name,
                        items: [{ name: b.ticket?.title || 'Counter Ticket', price: b.amount / 100 / b.quantity, qty: b.quantity }],
                        total: b.amount / 100, tax: 0, taxRate: 0, grandTotal: b.amount / 100, date: b.created_at,
                        paymentMethod: 'Counter', tendered: b.amount / 100, change: 0
                      })} className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5">
                        <Printer size={10} /> Print Invoice
                      </button>
                    </div>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">No counter bookings yet today.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {invoiceData && (
        <InvoiceModal data={invoiceData} type="pos" onClose={() => setInvoiceData(null)} />
      )}
    </div>
  );
}
