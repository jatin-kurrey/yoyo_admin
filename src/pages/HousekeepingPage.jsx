import { useState } from 'react';
import { Wrench, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function HousekeepingPage() {
  const { roomStatuses, housekeepingStaff, dispatch } = useApp();
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [showOooModal, setShowOooModal] = useState(false);
  const [oooRoom, setOooRoom] = useState(null);
  const [oooReason, setOooReason] = useState('');

  const floors = ['all', 1, 2, 3];
  const filteredRooms = selectedFloor === 'all' ? roomStatuses : roomStatuses.filter(r => r.floor === selectedFloor);

  const getRoomCategory = (num) => {
    if (num < 200) return 'Super Deluxe';
    if (num < 300) return 'Family Suite';
    return 'Executive Pack';
  };

  const handleSetClean = (num) => dispatch({ type: 'SET_ROOM_CLEAN', payload: num });
  const handleSetDirty = (num) => dispatch({ type: 'SET_ROOM_DIRTY', payload: num });
  const handleBulkClean = (floor) => dispatch({ type: 'BULK_SET_CLEAN', payload: floor });
  const handleBulkDirty = (floor) => dispatch({ type: 'BULK_SET_DIRTY', payload: floor });

  const handleSetOoo = () => {
    if (!oooReason.trim()) return alert('Enter maintenance reason');
    dispatch({ type: 'SET_ROOM_OOO', payload: { roomNumber: oooRoom, oooReason } });
    setShowOooModal(false);
    setOooReason('');
  };

  const handleSetAvailable = (num) => {
    dispatch({ type: 'SET_ROOM_AVAILABLE', payload: num });
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Housekeeping Control</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => handleBulkClean('all')} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <CheckCircle2 size={13} /> Mark All Clean
          </button>
          <button onClick={() => handleBulkDirty('all')} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <XCircle size={13} /> Mark All Dirty
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Housekeeping Staff</h3>
            <div className="space-y-2">
              {housekeepingStaff.map((staff) => (
                <div key={staff.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${staff.status === 'busy' ? 'bg-blue-500' : staff.status === 'available' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                    {staff.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 truncate">{staff.name}</div>
                    <div className="text-[10px] text-slate-500">{staff.assignedRooms.map(r => `Rm ${r}`).join(', ')}</div>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${staff.status === 'busy' ? 'bg-blue-100 text-blue-700' : staff.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {staff.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <div className="flex items-center gap-1.5"><Wrench size={13} /> Out of Order</div>
            </h3>
            <div className="space-y-2">
              {roomStatuses.filter(r => r.status === 'ooo').map((room) => (
                <div key={room.number} className="bg-red-50 border border-red-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">Room {room.number}</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[9px] font-semibold">OOO</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{room.oooReason}</div>
                  <button onClick={() => handleSetAvailable(room.number)} className="text-[10px] text-blue-600 font-semibold mt-1 hover:underline">Mark Available</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="flex gap-2 mb-4">
            {floors.map((f) => (
              <button key={f} onClick={() => setSelectedFloor(f)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedFloor === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                {f === 'all' ? 'All Floors' : `Floor ${f}`}
              </button>
            ))}
            <div className="flex-1" />
            <div className="flex gap-2">
              {[1, 2, 3].map((f) => (
                <button key={f} onClick={() => handleBulkClean(f)} className="text-[10px] text-emerald-600 font-semibold px-2 py-1 rounded hover:bg-emerald-50 border border-emerald-200">F{f} Clean</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {filteredRooms.map((room) => (
              <div key={room.number} className={`rounded-xl border-2 p-3.5 transition-all ${room.status === 'ooo' ? 'bg-slate-50 border-slate-300' : room.cleanStatus === 'clean' ? 'bg-white border-emerald-200' : 'bg-white border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-base font-bold text-slate-800">{room.number}</span>
                    <div className="text-[9px] text-slate-400">{getRoomCategory(room.number)}</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${room.status === 'occupied' ? 'bg-blue-100 text-blue-700' : room.status === 'vacant' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {room.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {room.cleanStatus === 'clean' ? (
                    <button onClick={() => handleSetDirty(room.number)} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                      <CheckCircle2 size={10} /> Clean
                    </button>
                  ) : (
                    <button onClick={() => handleSetClean(room.number)} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                      <XCircle size={10} /> Dirty
                    </button>
                  )}
                  {room.status !== 'ooo' && (
                    <button onClick={() => { setOooRoom(room.number); setShowOooModal(true); }} className="text-[10px] text-slate-500 px-2 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1">
                      <Wrench size={10} /> OOO
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showOooModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowOooModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-96 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Mark Room {oooRoom} — Out of Order</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Reason</label>
                <input type="text" value={oooReason} onChange={e => setOooReason(e.target.value)} placeholder="e.g., Plumbing Maintenance" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[10px] text-amber-700">
                Room will be blocked from calendar and all OTA channels automatically.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
              <button onClick={() => setShowOooModal(false)} className="px-4 py-1.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleSetOoo} className="px-5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg">Block Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
