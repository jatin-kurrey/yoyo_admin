import { useState } from 'react';
import { Search, Plus, X, Minus, ChefHat, MoveRight, Printer } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { posAreas, menuCategories } from '../data/mockData';

const tableStatusStyles = {
  vacant: { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Vacant' },
  occupied: { bg: 'bg-red-50 border-red-200', dot: 'bg-red-500', label: 'Occupied' },
  billed: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Bill Printed' },
};

export default function POSPage() {
  const { posTables, menuItems, checkedInBookings, dispatch } = useApp();
  const [activeArea, setActiveArea] = useState('Indoor Dining');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [menuFilter, setMenuFilter] = useState('All');
  const [cart, setCart] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const filteredTables = posTables.filter(t => t.area === activeArea);
  const filteredMenu = (menuFilter === 'All' ? menuItems : menuItems.filter(m => m.category === menuFilter))
    .filter(m => !menuSearch || m.name.toLowerCase().includes(menuSearch.toLowerCase()));

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setMenuSearch('');
    setSelectedRoom(null);
    if (table.status === 'vacant') {
      setCart([]);
      setGuestName('');
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
    dispatch({ type: 'OCCUPY_TABLE', payload: { tableId: selectedTable.id, guestName } });
    setShowOrderDrawer(false);
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
    dispatch({ type: 'UPDATE_TABLE_ORDER', payload: { tableId: selectedTable.id, kotDelta: 1, valueDelta: total, items: cart } });
    setCart([]);
  };

  const handleGenerateBill = () => {
    dispatch({ type: 'BILL_TABLE', payload: selectedTable.id });
    setCart([]);
    setShowOrderDrawer(false);
  };

  const handleMoveToRoom = (roomNumber) => {
    dispatch({ type: 'MOVE_TO_ROOM', payload: { tableId: selectedTable.id, roomNumber } });
    setShowMoveModal(false);
    setSelectedRoom(null);
    setCart([]);
    setShowOrderDrawer(false);
  };

  const table = posTables.find(t => t.id === selectedTable?.id);

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
            {filteredTables.map((table) => {
              const style = tableStatusStyles[table.status];
              return (
                <div key={table.id} onClick={() => handleTableClick(table)}
                  className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${style.bg} ${table.status === 'vacant' ? 'hover:border-emerald-400' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-slate-800">T{table.number}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">{table.capacity} Seats</div>
                  {table.status === 'occupied' && (
                    <div className="mt-2 space-y-0.5">
                      <div className="text-xs font-medium text-slate-700">{table.guestName}</div>
                      <div className="text-[10px] text-red-500 font-semibold">{table.kotCount} KOTs Live</div>
                      <div className="text-[10px] text-slate-500">₹{table.orderValue}</div>
                    </div>
                  )}
                  {table.status === 'billed' && (
                    <div className="mt-2"><div className="text-[10px] text-amber-600 font-semibold">Bill: ₹{table.orderValue} · Tap to clear</div></div>
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
              <span className="text-[10px] text-slate-500 ml-2">{table?.capacity} Seats</span>
            </div>
            <button onClick={() => setShowOrderDrawer(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>

          {table?.status === 'vacant' && (
            <div className="px-4 py-4 border-b border-slate-100">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Guest Name</label>
              <div className="flex gap-2">
                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Enter guest name..." className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <button onClick={handleOccupyTable} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 rounded-lg">Start</button>
              </div>
            </div>
          )}

          {table?.status === 'occupied' && (
            <>
              <div className="px-4 py-3 border-b border-slate-100">
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
            </div>

            <div className="px-4 py-2 border-t border-slate-200">
              {(() => { const sub = cart.reduce((s, c) => s + c.price * c.qty, 0); return (
                <><div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-500">Subtotal</span><span className="text-xs font-semibold">₹{sub}</span></div>
                <div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-500">GST (5%)</span><span className="text-xs font-semibold">₹{Math.round(sub * 0.05)}</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200"><span className="text-sm font-bold text-slate-800">Total</span><span className="text-sm font-bold text-slate-800">₹{sub + Math.round(sub * 0.05)}</span></div></>
              )})()}
            </div>

            <div className="px-4 py-3 flex gap-2">
              <button onClick={handleSendKOT} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                <ChefHat size={13} /> Send KOT
              </button>
              <button onClick={handleGenerateBill} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                Generate Bill
              </button>
              <button onClick={() => setShowMoveModal(true)} className="px-3 py-2 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
                <MoveRight size={13} /> Move
              </button>
            </div>
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
    </div>
  );
}
