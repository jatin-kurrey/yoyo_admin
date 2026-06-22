import { useState } from 'react';
import { DoorOpen, Users, CalendarDays } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function RoomViewPage() {
  const { bookings, roomCategories } = useApp();
  const [filter, setFilter] = useState('all');

  const allRooms = roomCategories.flatMap(c => c.rooms.map(r => ({ ...r, category: c.name })));

  const getRoomBooking = (roomNumber) =>
    bookings.find(b => b.roomNumber === roomNumber && b.status === 'checked-in');

  const filteredRooms = filter === 'all' ? allRooms : allRooms.filter(r => {
    const b = getRoomBooking(r.number);
    if (filter === 'occupied') return !!b;
    if (filter === 'vacant') return !b && r.status === 'available';
    if (filter === 'dirty') return r.clean === false;
    if (filter === 'ooo') return r.status === 'ooo' || r.status === 'blocked';
    return true;
  });

  const statusCounts = {
    all: allRooms.length,
    occupied: allRooms.filter(r => getRoomBooking(r.number)).length,
    vacant: allRooms.filter(r => !getRoomBooking(r.number) && r.status === 'available').length,
    dirty: allRooms.filter(r => !r.clean).length,
    ooo: allRooms.filter(r => r.status === 'ooo' || r.status === 'blocked').length,
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Room View</h1>
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">15 Dec 2026</span>
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
          const booking = getRoomBooking(room.number);
          const cc = room.category === 'SUPER DELUXE ROOMS' ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
            : room.category === 'FAMILY SUITES' ? { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
            : { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
          const isOoo = room.status === 'ooo' || room.status === 'blocked';

          return (
            <div key={room.number} className={`rounded-xl border-2 p-4 transition-all hover:shadow-sm ${isOoo ? 'bg-slate-50 border-slate-300' : booking ? `${cc.bg} ${cc.border}` : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DoorOpen size={16} className="text-slate-400" />
                  <span className="text-lg font-bold text-slate-800">{room.number}</span>
                </div>
                {isOoo ? <span className="bg-slate-200 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">OOO</span>
                  : booking ? <span className="bg-emerald-100 text-emerald-700 text-[9px] font-semibold px-1.5 py-0.5 rounded">Occupied</span>
                  : <span className="bg-emerald-50 text-emerald-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">Vacant</span>}
              </div>
              <div className={`text-[10px] font-medium ${cc.text} mb-2`}>{room.category.replace(' ROOMS', '').replace('S', '')}</div>
              {booking ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Users size={12} className="text-slate-400" /> {booking.guestName}</div>
                  <div className="text-[10px] text-slate-500">{booking.pax} · {booking.plan} · {booking.source}</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarDays size={10} /> {booking.checkIn} → {booking.checkOut}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500">Balance</span>
                    <span className={`text-xs font-bold ${booking.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{booking.balance > 0 ? `₹${booking.balance}` : 'Clear'}</span>
                  </div>
                </div>
              ) : <div className="flex items-center gap-2 mt-3"><span className={`w-2 h-2 rounded-full ${room.clean ? 'bg-emerald-500' : 'bg-red-500'}`} /><span className="text-[10px] text-slate-500">{room.clean ? 'Clean' : 'Dirty'}</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
