import { useState } from 'react';
import { DoorOpen, Users, CalendarDays } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function RoomViewPage() {
  const { bookings, roomCategories, dates } = useApp();
  const [filter, setFilter] = useState('all');

  const allRooms = roomCategories.flatMap(c => c.rooms.map(r => ({
    ...r, category: c.name,
  })));

  const isOccupied = (room) => {
    const hasBooking = bookings.some(b => b.roomNumber === room.number && b.status === 'checked-in');
    return hasBooking || room.status === 'occupied';
  };

  const isVacant = (room) => !isOccupied(room) && room.status === 'available';
  const isDirty = (room) => room.clean === false;
  const isOOO = (room) => room.status === 'ooo' || room.status === 'blocked';

  const filteredRooms = filter === 'all' ? allRooms : allRooms.filter(r => {
    if (filter === 'occupied') return isOccupied(r);
    if (filter === 'vacant') return isVacant(r);
    if (filter === 'dirty') return isDirty(r);
    if (filter === 'ooo') return isOOO(r);
    return true;
  });

  const statusCounts = {
    all: allRooms.length,
    occupied: allRooms.filter(isOccupied).length,
    vacant: allRooms.filter(isVacant).length,
    dirty: allRooms.filter(isDirty).length,
    ooo: allRooms.filter(isOOO).length,
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Room View</h1>
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">{dates[0]}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Rooms', count: statusCounts.all },
          { key: 'occupied', label: 'Occupied', count: statusCounts.occupied },
          { key: 'vacant', label: 'Vacant', count: statusCounts.vacant },
          { key: 'dirty', label: 'Dirty', count: statusCounts.dirty },
          { key: 'ooo', label: 'Out of Order', count: statusCounts.ooo },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${filter === f.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const booking = bookings.find(b => b.roomNumber === room.number && b.status === 'checked-in');
          const occupied = isOccupied(room);
          const ooo = isOOO(room);
          const cc = room.category === 'WATER PARK COTTAGES' ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
            : room.category === 'PREMIUM VILLAS' ? { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
            : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };

          return (
            <div key={room.number} className={`rounded-xl border-2 p-4 transition-all hover:shadow-sm ${ooo ? 'bg-slate-50 border-slate-300' : occupied ? `${cc.bg} ${cc.border}` : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DoorOpen size={16} className="text-slate-400" />
                  <span className="text-lg font-bold text-slate-800">{room.number}</span>
                </div>
                {ooo ? <span className="bg-slate-200 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">OOO</span>
                  : occupied ? <span className="bg-emerald-100 text-emerald-700 text-[9px] font-semibold px-1.5 py-0.5 rounded">Occupied</span>
                  : <span className="bg-emerald-50 text-emerald-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">Vacant</span>}
              </div>
              <div className={`text-[10px] font-medium ${cc.text} mb-2`}>{room.category.replace(' ROOMS', '').replace('S', '')}</div>
              {occupied ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Users size={12} className="text-slate-400" /> {booking?.guestName || 'Occupied'}</div>
                  {booking && <div className="text-[10px] text-slate-500">{booking.pax} · {booking.plan} · {booking.source}</div>}
                  {booking && <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarDays size={10} /> {booking.checkIn} → {booking.checkOut}</div>}
                  {booking && <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500">Balance</span>
                    <span className={`text-xs font-bold ${booking.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{booking.balance > 0 ? `₹${booking.balance}` : 'Clear'}</span>
                  </div>}
                </div>
              ) : <div className="flex items-center gap-2 mt-3"><span className={`w-2 h-2 rounded-full ${room.clean ? 'bg-emerald-500' : 'bg-red-500'}`} /><span className="text-[10px] text-slate-500">{room.clean ? 'Clean' : 'Dirty'}</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
