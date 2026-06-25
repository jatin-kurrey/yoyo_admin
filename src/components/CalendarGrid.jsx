import { useState, useMemo, Fragment } from 'react';
import { Sparkles, MoreHorizontal, Search, Filter, X, FileText, Printer, CheckCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import EditFolioModal from './EditFolioModal';
import InvoiceModal from './InvoiceModal';

const statusColors = {
  'checked-in': { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', text: 'text-emerald-700', label: 'Checked In' },
  'checked-out': { bg: 'bg-slate-400', hover: 'hover:bg-slate-500', text: 'text-slate-500', label: 'Checked Out' },
  'hold': { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-700', label: 'On Hold' },
  'future': { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-700', label: 'Future Booking' },
};

export default function CalendarGrid({ dates, dayLabels, roomCategories, bookings, todayIdx, onCellClick }) {
  const { dispatch } = useApp();
  const [tooltip, setTooltip] = useState(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [settlementBooking, setSettlementBooking] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMode, setSettlementMode] = useState('Cash');
  const [selectedFolioBooking, setSelectedFolioBooking] = useState(null);
  const [invoiceBooking, setInvoiceBooking] = useState(null);
  const [checkinReceipt, setCheckinReceipt] = useState(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState(null);

  const filteredBookings = useMemo(() => {
    return (bookings || []).filter(b => {
      if (search && !b.guestName.toLowerCase().includes(search.toLowerCase())) return false;
      if (sourceFilter !== 'all' && b.source !== sourceFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [bookings, search, sourceFilter, statusFilter]);

  const getBookingForDay = (roomNumber, date) => {
    return filteredBookings.find(b => b.roomNumber === roomNumber && date >= b.checkIn && date < b.checkOut);
  };

  const getBookingSpan = (booking) => {
    if (!booking) return 0;
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const span = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, span);
  };

  const handleCheckinClick = (booking) => {
    dispatch({ type: 'CHECK_IN', payload: booking.id });
    setCheckinReceipt(booking);
    setTooltip(null);
  };

  const handleCheckOut = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId || b.bookingRef === bookingId);
    if (!booking) return;
    if (booking.balance > 0) {
      setSettlementBooking(booking);
      setSettlementAmount(booking.balance);
      setSettlementMode('Cash');
    } else {
      setCheckoutConfirm(booking);
    }
  };

  const handleCheckoutConfirm = async () => {
    if (!checkoutConfirm) return;
    await dispatch({ type: 'CHECK_OUT', payload: checkoutConfirm.id });
    setInvoiceBooking({
      ...checkoutConfirm,
      status: 'checked-out',
      advancePaid: checkoutConfirm.advancePaid || 0,
      checkoutPaid: 0,
      totalPaid: checkoutConfirm.advancePaid || 0,
      balance: 0,
    });
    setCheckoutConfirm(null);
  };

  const handleSettlementSubmit = async () => {
    if (!settlementBooking) return;
    const amount = Number(settlementAmount) || 0;
    
    if (amount > 0) {
      await dispatch({
        type: 'ADD_PAYMENT',
        payload: {
          bookingId: settlementBooking.id,
          amount: amount,
          mode: settlementMode,
          type: 'settlement'
        }
      });

      const todayStr = new Date().toISOString().slice(0, 10);
      await dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          date: todayStr,
          type: 'income',
          category: 'Room Booking',
          description: `Check-out settlement - Room ${settlementBooking.roomNumber} (${settlementBooking.guestName})`,
          amount: amount,
          mode: settlementMode,
          status: 'completed',
          guestName: settlementBooking.guestName,
        }
      });
    }

    await dispatch({ type: 'CHECK_OUT', payload: settlementBooking.id });

    // Show invoice after settlement checkout
    const totalPaid = (settlementBooking.advancePaid || 0) + amount;
    setInvoiceBooking({
      ...settlementBooking,
      status: 'checked-out',
      advancePaid: settlementBooking.advancePaid || 0,
      checkoutPaid: amount,
      totalPaid,
      balance: Math.max(0, (settlementBooking.totalAmount || settlementBooking.balance || 0) - totalPaid),
    });
    setSettlementBooking(null);
  };

  const handleDelete = (bookingId) => {
    if (window.confirm('Cancel this booking?')) {
      dispatch({ type: 'DELETE_BOOKING', payload: bookingId });
    }
  };

  const sources = [...new Set((bookings || []).map(b => b.source))];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Search & Filter Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search guest name..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} className="text-slate-400" /></button>}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter size={13} />
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-2 py-1 border border-slate-200 rounded text-[10px] bg-white focus:outline-none">
            <option value="all">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1 border border-slate-200 rounded text-[10px] bg-white focus:outline-none">
            <option value="all">All Status</option>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="hold">On Hold</option>
            <option value="future">Future</option>
          </select>
        </div>
        <div className="text-[10px] text-slate-400 font-medium ml-auto">
          {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} shown
        </div>
      </div>

      {/* Calendar Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-50">
              <th className="w-[200px] min-w-[200px] px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-r border-b border-slate-200 bg-slate-50">Rooms</th>
              {dayLabels.map((label, i) => (
                <th key={label} className={`w-[100px] min-w-[100px] px-2 py-3 text-center border-r border-b border-slate-200 ${i === todayIdx ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <div className="text-[11px] font-semibold text-slate-600">{label}</div>
                  {i === todayIdx && <div className="text-[9px] text-blue-600 font-medium mt-0.5">Today</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomCategories.map((cat) => (
              <Fragment key={cat.name}>
                {/* Category Header Row */}
                <tr key={`cat-${cat.name}`} className="bg-slate-100/80">
                  <td className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-r border-b border-slate-200" colSpan={dates.length + 1}>
                    {cat.name}
                  </td>
                </tr>

                {/* Room Rows */}
                {cat.rooms.map((room) => {
                  let skipUntil = -1;
                  return (
                    <tr key={room.number} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="w-[200px] min-w-[200px] px-4 py-2.5 border-r border-slate-200 bg-white">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 min-w-[36px]">{room.number}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${room.clean ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${room.clean ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {room.clean ? 'Clean' : 'Dirty'}
                          </span>
                          {room.status === 'blocked' && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-semibold">Blocked</span>}
                          {room.status === 'ooo' && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-semibold">OOO</span>}
                        </div>
                      </td>

                      {dates.map((date, dateIdx) => {
                        if (skipUntil > dateIdx) return null;

                        const booking = getBookingForDay(room.number, date);
                        if (booking) {
                          const span = getBookingSpan(booking);
                          skipUntil = dateIdx + span;
                          const sc = statusColors[booking.status] || statusColors['future'];

                          return (
                            <td key={date} colSpan={span} className="border-r border-slate-100 p-0.5 align-top">
                              <div
                                className={`rounded-md px-2.5 py-1.5 cursor-pointer transition-all shadow-sm ${sc.bg} ${sc.hover} text-white text-[11px] leading-tight group relative`}
                                onMouseEnter={() => setTooltip(booking.id)}
                                onMouseLeave={() => setTooltip(null)}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold truncate">{booking.guestName}</span>
                                  <MoreHorizontal size={12} className="opacity-0 group-hover:opacity-100 shrink-0" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] opacity-90 mt-0.5">
                                  <span>{booking.pax}</span>
                                  <Sparkles size={8} className="opacity-60" />
                                  <span>{booking.plan}</span>
                                  <span className="ml-auto opacity-75">{booking.source}</span>
                                </div>

                                {tooltip === booking.id && (
                                  <div className="absolute left-0 top-full mt-1 z-50 bg-white shadow-lg rounded-lg border border-slate-200 py-2 w-52 text-slate-700 text-xs" style={{ minWidth: '200px' }}>
                                    <div className="px-3 pb-2 border-b border-slate-100 mb-1">
                                      <div className="font-semibold text-slate-800">{booking.guestName}</div>
                                      <div className="text-slate-500 text-[10px]">Room {booking.roomNumber}</div>
                                    </div>
                                    <div className="px-3 space-y-1.5 py-1">
                                      <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`font-semibold capitalize ${booking.status === 'checked-in' ? 'text-emerald-600' : booking.status === 'checked-out' ? 'text-slate-500' : 'text-blue-600'}`}>{booking.status?.replace('-', ' ')}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-medium">{booking.source}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Balance</span><span className={`font-semibold ${booking.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{booking.balance}</span></div>
                                      <div className="text-[10px] text-slate-400 mt-1">{booking.checkIn} → {booking.checkOut}</div>
                                    </div>
                                    <div className="px-3 pt-2 border-t border-slate-100 mt-1 flex gap-1 flex-wrap">
                                      {booking.status !== 'checked-out' && (
                                        <span onClick={(e) => { e.stopPropagation(); setSelectedFolioBooking(booking); setTooltip(null); }} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200">Edit Folio</span>
                                      )}
                                      {(booking.status === 'future' || booking.status === 'hold') && (
                                        <span onClick={(e) => { e.stopPropagation(); handleCheckinClick(booking); }} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200">Check-in</span>
                                      )}
                                      {booking.status === 'checked-in' && (
                                        <span onClick={(e) => { e.stopPropagation(); handleCheckOut(booking.id); setTooltip(null); }} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200">Check-out</span>
                                      )}
                                      <span onClick={(e) => { e.stopPropagation(); setInvoiceBooking(booking); setTooltip(null); }} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100 flex items-center gap-1">
                                        <FileText size={10} /> Invoice
                                      </span>
                                      {booking.status !== 'checked-out' && (
                                        <span onClick={(e) => { e.stopPropagation(); handleDelete(booking.id); setTooltip(null); }} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 cursor-pointer hover:bg-red-100">Cancel</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        const isToday = dateIdx === todayIdx;
                        const isBlocked = room.status === 'blocked' || room.status === 'ooo';
                        return (
                          <td key={date}
                            onClick={() => !isBlocked && onCellClick?.(room.number, date)}
                            className={`w-[100px] min-w-[100px] border-r border-slate-100 transition-colors ${isToday ? 'bg-blue-50/40' : 'bg-white'} ${!isBlocked ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                          />
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {settlementBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSettlementBooking(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Checkout Settlement — Room {settlementBooking.roomNumber}</h3>
              <button onClick={() => setSettlementBooking(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Guest Name</div>
                <div className="text-sm font-semibold text-slate-800">{settlementBooking.guestName}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xs text-amber-800 font-medium">Outstanding Balance</span>
                <span className="text-base font-bold text-amber-600">₹{settlementBooking.balance}</span>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Settlement Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map(mode => (
                    <button key={mode} type="button" onClick={() => setSettlementMode(mode)}
                      className={`flex items-center justify-center border rounded-lg px-3 py-2 cursor-pointer transition-colors text-xs font-semibold ${
                        settlementMode === mode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Amount Paid</label>
                <input type="number" value={settlementAmount} onChange={e => setSettlementAmount(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setSettlementBooking(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={handleSettlementSubmit} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">Receive & Check-out</button>
            </div>
          </div>
        </div>
      )}

      {selectedFolioBooking && (
        <EditFolioModal
          booking={selectedFolioBooking}
          onClose={() => setSelectedFolioBooking(null)}
        />
      )}

      {/* Check-in Receipt */}
      {checkinReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCheckinReceipt(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-emerald-500 px-6 py-5 text-white text-center">
              <CheckCircle size={36} className="mx-auto mb-2" />
              <h3 className="text-base font-bold">Check-In Successful</h3>
              <p className="text-sm opacity-90 mt-0.5">Welcome to YOYO Fun Resort!</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Guest Name</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.guestName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Room Number</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.roomNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Check-In Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.checkIn}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Check-Out Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.checkOut}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Plan</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.plan}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Source</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.source}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pax</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{checkinReceipt.pax}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Advance Paid</div>
                  <div className="font-semibold text-emerald-600 mt-0.5">₹{checkinReceipt.advancePaid || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Due Now</div>
                  <div className={`font-semibold mt-0.5 ${checkinReceipt.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {checkinReceipt.balance > 0 ? `₹${checkinReceipt.balance}` : 'Clear'}
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-200 mt-2">
                <span className="text-xs text-slate-600 font-medium">Total Stay Amount</span>
                <span className="text-sm font-bold text-slate-800">₹{checkinReceipt.totalAmount || checkinReceipt.balance || 0}</span>
              </div>
              <div className="text-[10px] text-slate-400 italic text-center pt-3 border-t border-slate-100">
                Please keep this receipt for your records.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => {
                const ap = checkinReceipt.advancePaid || 0;
                setInvoiceBooking({ ...checkinReceipt, advancePaid: ap, checkoutPaid: 0, totalPaid: ap, paid: ap });
                setCheckinReceipt(null);
              }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50">
                <FileText size={13} /> View Invoice
              </button>
              <button onClick={() => setCheckinReceipt(null)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation */}
      {checkoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCheckoutConfirm(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-[420px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 text-center border-b border-slate-200">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Check-Out Guest?</h3>
              <p className="text-xs text-slate-500 mt-1">Room {checkoutConfirm.roomNumber} — {checkoutConfirm.guestName}</p>
            </div>
            <div className="px-6 py-4 space-y-2 text-xs">
              <div className="flex justify-between py-1"><span className="text-slate-500">Check-In</span><span className="font-medium text-slate-700">{checkoutConfirm.checkIn}</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-500">Check-Out</span><span className="font-medium text-slate-700">{checkoutConfirm.checkOut}</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-500">Plan</span><span className="font-medium text-slate-700">{checkoutConfirm.plan}</span></div>
              <div className="flex justify-between py-1"><span className="text-slate-500">Source</span><span className="font-medium text-slate-700">{checkoutConfirm.source}</span></div>
              <div className="flex justify-between py-2 border-t border-slate-200 mt-2 text-sm">
                <span className="font-semibold text-slate-700">Balance</span>
                <span className="font-bold text-emerald-600">Clear (₹0)</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[10px] text-blue-700 mt-2">
                An invoice will be generated automatically after checkout.
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setCheckoutConfirm(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={handleCheckoutConfirm} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                Confirm Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceBooking && (
        <InvoiceModal
          data={{
            id: invoiceBooking.id,
            guestName: invoiceBooking.guestName,
            roomNumber: invoiceBooking.roomNumber,
            checkIn: invoiceBooking.checkIn,
            checkOut: invoiceBooking.checkOut,
            rate: invoiceBooking.rate,
            amount: invoiceBooking.total || invoiceBooking.balance || 0,
            total: invoiceBooking.total || invoiceBooking.balance || 0,
            advancePaid: invoiceBooking.advancePaid || invoiceBooking.paid || 0,
            checkoutPaid: invoiceBooking.checkoutPaid || 0,
            totalPaid: invoiceBooking.paid || invoiceBooking.totalPaid || 0,
            date: new Date().toISOString().slice(0, 10),
            description: `Room ${invoiceBooking.roomNumber} - ${invoiceBooking.plan} Plan`,
            items: invoiceBooking.items || [],
            paid: invoiceBooking.paid || invoiceBooking.totalPaid || 0,
            status: invoiceBooking.status,
          }}
          type="booking"
          onClose={() => setInvoiceBooking(null)}
        />
      )}
    </div>
  );
}
