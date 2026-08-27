import { useState } from 'react';
import { Search, Plus, X, Minus, ChefHat, MoveRight, Printer, FileText, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { posAreas, menuCategories } from '../data/mockData';
import InvoiceModal from '../components/InvoiceModal';

const tableStatusStyles = {
  vacant: { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Vacant' },
  occupied: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Occupied' },
  billed: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Bill Printed' },
};

const paymentMethods = [
  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'bg-emerald-500' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'bg-blue-500' },
  { id: 'Card', label: 'Card', icon: CreditCard, color: 'bg-purple-500' },
];

export default function POSPage() {
  const { posTables, bills, menuItems, checkedInBookings, customers, dispatch, defaultRules, showToast } = useApp();
  const [custSearch, setCustSearch] = useState('');
  const [activeArea, setActiveArea] = useState('Waterfront Dining');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [menuFilter, setMenuFilter] = useState('All');
  const [cart, setCart] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [billSummary, setBillSummary] = useState({ subtotal: 0, tax: 0, grandTotal: 0 });

  const filteredTables = posTables.filter(t => t.area === activeArea);
  const filteredMenu = (menuFilter === 'All' ? menuItems : menuItems.filter(m => m.category === menuFilter))
    .filter(m => !menuSearch || m.name.toLowerCase().includes(menuSearch.toLowerCase()));

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setMenuSearch('');
    setSelectedRoom(null);
    setGuestName('');
    setGuestPhone('');
    if (table.status === 'vacant') {
      setCart([]);
      setShowOrderDrawer(true);
    } else if (table.status === 'occupied') {
      setCart([]);
      setShowOrderDrawer(true);
    } else if (table.status === 'billed') {
      dispatch({ type: 'VACATE_TABLE', payload: table.id });
    }
  };

  const handleOccupyTable = () => {
    if (!guestName.trim()) return alert('Enter guest name first');
    dispatch({ type: 'OCCUPY_TABLE', payload: { tableId: selectedTable.id, guestName: guestName.trim(), guestPhone: guestPhone.trim() } });
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, qty: 1, price: item.price }]);
    }
  };

  const updateQty = (itemId, delta) => {
    const updated = cart.map(c => c.id === itemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0);
    setCart(updated);
  };

  const handleSendKOT = () => {
    if (cart.length === 0) return alert('Add items to order first');
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    dispatch({ type: 'UPDATE_TABLE_ORDER', payload: { tableId: selectedTable.id, kotDelta: 1, valueDelta: total, items: [...cart] } });
    setCart([]);
    showToast('KOT sent to kitchen');
  };

  const handleGenerateBill = () => {
    const taxRate = defaultRules?.taxRate || 12;
    const prevTotal = (table?.orderItems || []).reduce((s, c) => s + c.price * c.qty, 0);
    const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const subtotal = prevTotal + cartTotal;
    const tax = Math.round(subtotal * taxRate / 100);
    const grandTotal = subtotal + tax;

    if (cart.length > 0) {
      dispatch({ type: 'UPDATE_TABLE_ORDER', payload: { tableId: selectedTable.id, kotDelta: 1, valueDelta: cartTotal, items: [...cart] } });
      setCart([]);
    }

    setBillSummary({ subtotal, tax, grandTotal, taxRate, prevTotal, cartTotal });
    setShowOrderDrawer(false);
    setPaymentMethod('Cash');
    setAmountTendered('');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    const { subtotal, tax, grandTotal, taxRate } = billSummary;
    const tendered = paymentMethod === 'Cash' ? (parseInt(amountTendered) || grandTotal) : grandTotal;
    const change = Math.max(0, tendered - grandTotal);

    dispatch({
      type: 'BILL_TABLE',
      payload: {
        id: selectedTable.id,
        payment: {
          method: paymentMethod,
          ref: paymentMethod !== 'Cash' ? `TXN${Date.now()}` : '',
          tendered,
        },
      },
    });

    setShowPaymentModal(false);

    const billData = {
      id: `BILL${selectedTable.id}${Date.now()}`,
      tableNumber: table?.number,
      area: table?.area,
      guestName: table?.guestName || 'Guest',
      items: [...(table?.orderItems || [])],
      total: subtotal,
      tax,
      taxRate,
      grandTotal,
      date: new Date().toISOString(),
      paymentMethod,
      tendered,
      change,
    };

    setTimeout(() => setInvoiceData(billData), 150);
  };

  const handleMoveToRoom = (roomNumber) => {
    if (!roomNumber) return;
    dispatch({ type: 'MOVE_TO_ROOM', payload: { tableId: selectedTable.id, roomNumber } });
    dispatch({ type: 'VACATE_TABLE', payload: selectedTable.id });
    setShowMoveModal(false);
    showToast(`Bill moved to Room ${roomNumber}`);
  };

  const table = posTables.find(t => t.id === selectedTable?.id);

  const getBillForTable = (t) => bills.filter(b => b.tableId === t.id).slice(-1)[0];

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-5 pb-0 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">Restaurant POS</h1>
          <div className="flex items-center gap-3">
            <button onClick={handleSendKOT} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Printer size={13} /> Print KOT
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-5 pt-4 pb-3 border-b border-slate-200">
          {posAreas.map((area) => (
            <button key={area} onClick={() => setActiveArea(area)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeArea === area ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {area}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-4 gap-4">
            {filteredTables.map((t) => {
              const style = tableStatusStyles[t.status];
              const bill = getBillForTable(t);
              return (
                <div key={t.id} onClick={() => handleTableClick(t)}
                  className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${style.bg} ${t.status === 'vacant' ? 'hover:border-emerald-400' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-slate-800">T{t.number}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{t.capacity} Seats · {t.area}</div>
                  {t.status === 'occupied' && (
                    <div className="mt-2 space-y-0.5">
                      <div className="text-xs font-medium text-slate-700">{t.guestName}</div>
                      <div className="text-[10px] text-red-500 font-semibold">{t.kotCount} KOTs</div>
                      <div className="text-[10px] text-slate-500">₹{t.orderValue}</div>
                    </div>
                  )}
                  {t.status === 'billed' && (
                    <div className="mt-2">
                      <div className="text-[10px] text-amber-600 font-semibold flex items-center justify-between">
                        <span>Bill: ₹{(bill?.grandTotal || t.orderValue).toLocaleString()}</span>
                        <button onClick={(e) => { e.stopPropagation(); setInvoiceData(bill || { id: `BILL${t.id}${Date.now()}`, tableNumber: t.number, area: t.area, guestName: t.guestName, items: t.orderItems || [], total: t.orderValue, date: new Date().toISOString().slice(0, 10) }); }}
                          className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-semibold">
                          <FileText size={11} /> Invoice
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-400">{bill?.paymentMethod || '—'}</span>
                        <span className="text-[9px] text-slate-400">Tap to clear</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showOrderDrawer && (
        <div className="w-[380px] min-w-[380px] bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800">Table {table?.number}</span>
              <span className="text-[10px] text-slate-500 ml-2">{table?.capacity} Seats · {table?.area}</span>
            </div>
            <button onClick={() => setShowOrderDrawer(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>

          {table?.status === 'vacant' && (
            <div className="px-4 py-4 border-b border-slate-100 space-y-3">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5">
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1 block">Quick Auto-Sync Customer ID / Phone</label>
                <input
                  type="text"
                  placeholder="Type CST-1001 or Mobile..."
                  value={custSearch}
                  onChange={(e) => {
                    const q = e.target.value;
                    setCustSearch(q);
                    const found = (customers || []).find(c =>
                      (c.customerCode || '').toLowerCase() === q.toLowerCase() ||
                      (c.phone || '').includes(q)
                    );
                    if (found) {
                      setGuestName(found.name);
                      setGuestPhone(found.phone);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-md outline-none text-indigo-950 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Guest Name</label>
                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Enter guest name..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Mobile Number</label>
                <div className="flex gap-2">
                  <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Enter phone number..." className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <button onClick={handleOccupyTable} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 rounded-lg">Start</button>
                </div>
              </div>
            </div>
          )}

          {table?.status === 'occupied' && (
            <>
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">{table.guestName}</span>
                    {table.guestPhone && <span className="text-[10px] text-slate-400">{table.guestPhone}</span>}
                  </div>
                  <span className="text-[10px] text-slate-400">{table.kotCount} KOTs · ₹{table.orderValue}</span>
                </div>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Search menu..." className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50" />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {menuCategories.map((cat) => (
                    <button key={cat} onClick={() => setMenuFilter(cat)}
                      className={`whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold rounded-full transition-colors ${menuFilter === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-auto px-4 py-2 space-y-1">
                {filteredMenu.map((item) => (
                  <div key={item.id} onClick={() => addToCart(item)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="text-xs font-medium text-slate-700">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">₹{item.price}</span>
                      <button className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><Plus size={10} className="text-slate-600" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-slate-200 bg-slate-50">
            {(table?.orderItems || []).length > 0 && (
              <div className="px-4 py-2 border-b border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Served Items</span>
                  <span className="text-xs font-medium text-slate-600">{table.orderItems.length} items</span>
                </div>
                {table.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-500">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">×{item.qty}</span>
                      <span className="text-xs font-semibold text-slate-500 w-12 text-right">₹{item.price * item.qty}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">Subtotal</span>
                  <span className="text-[10px] font-semibold text-slate-500">₹{table.orderItems.reduce((s, c) => s + c.price * c.qty, 0)}</span>
                </div>
              </div>
            )}

            <div className="px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Order</span>
                <span className="text-xs font-medium text-slate-600">{cart.length} items</span>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center hover:bg-slate-300"><Minus size={8} /></button>
                    <span className="text-xs font-medium w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center hover:bg-slate-300"><Plus size={8} /></button>
                    <span className="text-xs font-semibold text-slate-700 w-12 text-right">₹{item.price * item.qty}</span>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (table?.orderItems || []).length === 0 && (
                <div className="text-[10px] text-slate-400 text-center py-3">No items yet. Select from the menu above.</div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-200">
              {(() => { const prevTotal = (table?.orderItems || []).reduce((s, c) => s + c.price * c.qty, 0); const sub = cart.reduce((s, c) => s + c.price * c.qty, 0); const combined = prevTotal + sub; const taxRate = defaultRules?.taxRate || 12; const tax = Math.round(combined * taxRate / 100); return (
                <><div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-500">Subtotal</span><span className="text-xs font-semibold">₹{combined}</span></div>
                <div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-500">CGST ({taxRate/2}%)</span><span className="text-xs font-semibold">₹{Math.round(tax/2)}</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500">SGST ({taxRate/2}%)</span><span className="text-xs font-semibold">₹{Math.round(tax/2)}</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200"><span className="text-sm font-bold text-slate-800">Total</span><span className="text-sm font-bold text-slate-800">₹{combined + tax}</span></div></>
              )})()}
            </div>

            <div className="px-4 py-3 flex gap-2">
              <button onClick={handleSendKOT} disabled={cart.length === 0} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                <ChefHat size={13} /> Send KOT
              </button>
              <button onClick={handleGenerateBill} disabled={(table?.orderItems || []).length === 0 && cart.length === 0} className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                Generate Bill
              </button>
              <button onClick={() => setShowMoveModal(true)} className="px-3 py-2 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
                <MoveRight size={13} /> Move
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[420px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            {(() => {
              const { subtotal, tax, grandTotal, taxRate } = billSummary;
              const tendered = paymentMethod === 'Cash' ? (parseInt(amountTendered) || 0) : grandTotal;
              const change = Math.max(0, tendered - grandTotal);
              return (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Table</span><span className="font-medium">T{table?.number} · {table?.area}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Guest</span><span className="font-medium">{table?.guestName}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Items</span><span className="font-medium">{(table?.orderItems || []).reduce((s, c) => s + c.qty, 0)} items</span></div>
                    <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span>₹{subtotal}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">CGST ({taxRate/2}%)</span><span>₹{Math.round(tax/2)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">SGST ({taxRate/2}%)</span><span>₹{Math.round(tax/2)}</span></div>
                      <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-2 mt-1">
                        <span>Grand Total</span><span>₹{grandTotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-b border-slate-100">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map(pm => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-semibold transition-all ${isSelected ? `${pm.color} text-white border-transparent` : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                            <Icon size={18} />
                            {pm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {paymentMethod === 'Cash' && (
                    <div className="px-5 py-4 border-b border-slate-100">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Amount Tendered (₹)</label>
                      <input type="number" value={amountTendered} onChange={e => setAmountTendered(e.target.value)} placeholder="Enter amount received..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                      {parseInt(amountTendered) >= grandTotal && (
                        <div className="flex justify-between text-xs mt-2 text-emerald-600 font-semibold">
                          <span>Change Due</span><span>₹{change}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod !== 'Cash' && (
                    <div className="px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                        <Smartphone size={14} />
                        {paymentMethod === 'UPI' ? 'Collect UPI payment via QR code or enter UPI ID' : 'Swipe/Dip/Tap card on the terminal'}
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-4 flex gap-2 justify-end">
                    <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                    <button onClick={handleConfirmPayment}
                      disabled={paymentMethod === 'Cash' && amountTendered && parseInt(amountTendered) < grandTotal}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors">
                      Confirm & Print Invoice
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-96 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Move Bill to Room</h3>
            <p className="text-[11px] text-slate-500 mb-3">Select in-house guest to transfer this bill to their room folio:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {checkedInBookings.map((b) => (
                <div key={b.id} onClick={() => { setSelectedRoom(b.roomNumber); handleMoveToRoom(b.roomNumber); }} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-slate-50 ${selectedRoom === b.roomNumber ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                  <input type="radio" name="room" className="accent-emerald-500" readOnly checked={selectedRoom === b.roomNumber} />
                  <div>
                    <div className="text-xs font-medium text-slate-700">Room {b.roomNumber} — {b.guestName}</div>
                    <div className="text-[10px] text-slate-400">{b.pax} · {b.plan} · ₹{b.balance}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowMoveModal(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {invoiceData && (
        <InvoiceModal data={invoiceData} type="pos" onClose={() => setInvoiceData(null)} />
      )}
    </div>
  );
}
