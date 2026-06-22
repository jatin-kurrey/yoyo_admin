import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { pmsService } from '../services/pmsService';
import { api } from '../services/api';
import {
  roomCategories as fallbackCats, bookings as fallbackBookings,
  housekeepingStaff as fallbackHKStaff, roomStatusList as fallbackRoomStatuses,
  posTables as fallbackPosTables, menuItems as fallbackMenuItems,
  pricingRates as fallbackPricing, transactions as fallbackTxns,
  vouchers as fallbackVouchers, userRoles as fallbackRoles,
  dailyRevenue as fallbackDailyRev,
} from '../data/mockData';

const initialState = {
  bookings: fallbackBookings,
  roomCategories: fallbackCats,
  roomStatuses: fallbackRoomStatuses,
  housekeepingStaff: fallbackHKStaff,
  posTables: fallbackPosTables,
  menuItems: fallbackMenuItems,
  pricingRates: fallbackPricing,
  stopSell: {},
  transactions: fallbackTxns,
  vouchers: fallbackVouchers,
  roles: fallbackRoles,
  defaultRules: {
    checkInTime: '12:00 PM', checkOutTime: '10:00 AM',
    holdExpiry: '4 Hours', currency: 'INR', taxRate: 12, nightAuditTime: '01:00 AM',
  },
  emailScheduler: { enabled: false, email: 'manager@yoyofun.in', time: '06:00 AM' },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.payload };
    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.payload] };
    case 'UPDATE_BOOKING':
      return { ...state, bookings: state.bookings.map(b => (b.id === action.payload.id || b.bookingRef === action.payload.id) ? { ...b, ...action.payload } : b) };
    case 'DELETE_BOOKING':
      return { ...state, bookings: state.bookings.filter(b => b.id !== action.payload && b.bookingRef !== action.payload) };
    case 'CHECK_OUT': {
      const id = action.payload;
      return { ...state, bookings: state.bookings.map(b => (b.id === id || b.bookingRef === id) ? { ...b, status: 'checked-out' } : b) };
    }
    case 'SET_ROOM_CLEAN': {
      const updated = state.roomStatuses.map(r => r.number === action.payload ? { ...r, cleanStatus: 'clean' } : r);
      const cats = state.roomCategories.map(cat => ({ ...cat, rooms: cat.rooms.map(r => r.number === action.payload ? { ...r, clean: true } : r) }));
      return { ...state, roomStatuses: updated, roomCategories: cats };
    }
    case 'SET_ROOM_DIRTY': {
      const updated = state.roomStatuses.map(r => r.number === action.payload ? { ...r, cleanStatus: 'dirty' } : r);
      const cats = state.roomCategories.map(cat => ({ ...cat, rooms: cat.rooms.map(r => r.number === action.payload ? { ...r, clean: false } : r) }));
      return { ...state, roomStatuses: updated, roomCategories: cats };
    }
    case 'BULK_SET_CLEAN': {
      const floor = action.payload;
      const updatedStatuses = state.roomStatuses.map(r => (floor === 'all' || r.floor === floor) ? { ...r, cleanStatus: 'clean' } : r);
      const nums = new Set(updatedStatuses.filter(r => r.cleanStatus === 'clean').map(r => r.number));
      const updatedCats = state.roomCategories.map(cat => ({ ...cat, rooms: cat.rooms.map(r => nums.has(r.number) ? { ...r, clean: true } : r) }));
      return { ...state, roomStatuses: updatedStatuses, roomCategories: updatedCats };
    }
    case 'BULK_SET_DIRTY': {
      const floor = action.payload;
      const updatedStatuses = state.roomStatuses.map(r => (floor === 'all' || r.floor === floor) ? { ...r, cleanStatus: 'dirty' } : r);
      const nums = new Set(updatedStatuses.filter(r => r.cleanStatus === 'dirty').map(r => r.number));
      const updatedCats = state.roomCategories.map(cat => ({ ...cat, rooms: cat.rooms.map(r => nums.has(r.number) ? { ...r, clean: false } : r) }));
      return { ...state, roomStatuses: updatedStatuses, roomCategories: updatedCats };
    }
    case 'SET_ROOM_OOO': {
      const { roomNumber, oooReason } = action.payload;
      const statuses = state.roomStatuses.map(r => r.number === roomNumber ? { ...r, status: 'ooo', oooReason } : r);
      const cats = state.roomCategories.map(cat => ({ ...cat, rooms: cat.rooms.map(r => r.number === roomNumber ? { ...r, status: 'ooo' } : r) }));
      return { ...state, roomStatuses: statuses, roomCategories: cats };
    }
    case 'SET_ROOM_AVAILABLE': {
      const statuses = state.roomStatuses.map(r => r.number === action.payload ? { ...r, status: 'available', oooReason: undefined } : r);
      const cats = state.roomCategories.map(cat => ({ ...cat, rooms: cat.rooms.map(r => r.number === action.payload ? { ...r, status: 'available' } : r) }));
      return { ...state, roomStatuses: statuses, roomCategories: cats };
    }
    case 'ASSIGN_STAFF_ROOMS':
      return { ...state, housekeepingStaff: state.housekeepingStaff.map(s => s.id === action.payload.staffId ? { ...s, assignedRooms: action.payload.rooms, status: 'busy' } : s) };
    case 'OCCUPY_TABLE':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload.tableId ? { ...t, status: 'occupied', kotCount: 0, guestName: action.payload.guestName || 'Guest', orderValue: 0 } : t) };
    case 'UPDATE_TABLE_ORDER':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload.tableId ? { ...t, kotCount: (t.kotCount || 0) + action.payload.kotDelta, orderValue: (t.orderValue || 0) + action.payload.valueDelta, status: 'occupied' } : t) };
    case 'BILL_TABLE':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload ? { ...t, status: 'billed', kotCount: 0 } : t) };
    case 'VACATE_TABLE':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload ? { ...t, status: 'vacant', kotCount: 0, guestName: '', orderValue: 0 } : t) };
    case 'MOVE_TO_ROOM': {
      const { tableId } = action.payload;
      return { ...state, posTables: state.posTables.map(t => t.id === tableId ? { ...t, status: 'vacant', kotCount: 0, guestName: '', orderValue: 0 } : t) };
    }
    case 'UPDATE_RATE':
      return { ...state, pricingRates: state.pricingRates.map(r => r.category === action.payload.category ? { ...r, ...action.payload.rates } : r) };
    case 'TOGGLE_STOP_SELL': {
      const { category, dateIdx } = action.payload;
      const current = { ...(state.stopSell[category] || {}) };
      if (current[dateIdx]) delete current[dateIdx];
      else current[dateIdx] = true;
      return { ...state, stopSell: { ...state.stopSell, [category]: current } };
    }
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [{ id: `TXN${Date.now()}`, ...action.payload }, ...state.transactions] };
    case 'ADD_VOUCHER':
      return { ...state, vouchers: [{ id: `VCH${Date.now()}`, ...action.payload }, ...state.vouchers] };
    case 'UPDATE_ROLE':
      return { ...state, roles: state.roles.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'CREATE_ROLE':
      return { ...state, roles: [...state.roles, { id: Date.now(), users: 0, ...action.payload }] };
    case 'UPDATE_DEFAULT_RULES':
      return { ...state, defaultRules: { ...state.defaultRules, ...action.payload } };
    case 'UPDATE_EMAIL_SCHEDULER':
      return { ...state, emailScheduler: { ...state.emailScheduler, ...action.payload } };
    case 'RESET_DATA':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Room UUID cache — maps room_number → room UUID for API calls
  const roomUuidMap = useRef({});

  function isUUID(val) {
    return typeof val === 'string' && val.includes('-') && val.length === 36;
  }

  // Enhanced dispatch — calls API before updating local state
  const dispatch = useCallback(async (action) => {
    const localDispatch = () => rawDispatch(action);
    try {
      switch (action.type) {
        case 'ADD_BOOKING': {
          const data = action.payload;
          const roomUUID = roomUuidMap.current[data.roomNumber];
          if (!roomUUID) { localDispatch(); return; }
          const res = await pmsService.createBooking({
            room_id: roomUUID,
            guest_name: data.guestName,
            guest_phone: data.mobile || '0000000000',
            adults: parseInt(data.pax?.split('+')[0]) || 2,
            children: parseInt(data.pax?.split('+')[1]) || 0,
            plan: data.plan || 'EP',
            source: data.source || 'Walk-In',
            check_in: data.checkIn,
            check_out: data.checkOut,
            rate_per_night: data.rate || 4000,
          });
          const b = res.data;
          const booking = {
            id: b.booking_ref,
            bookingRef: b.id,
            roomNumber: b.room?.room_number || data.roomNumber,
            guestName: b.guest_name,
            pax: `${b.adults}+${b.children}`,
            plan: b.plan,
            source: b.source,
            checkIn: b.check_in?.slice(0, 10),
            checkOut: b.check_out?.slice(0, 10),
            balance: b.balance_amount,
            status: b.status,
          };
          rawDispatch({ type: 'ADD_BOOKING', payload: booking });
          showToast('Booking created');
          return;
        }

        case 'CHECK_OUT': {
          const id = action.payload;
          const booking = state.bookings.find(b => b.id === id || b.bookingRef === id);
          if (booking?.bookingRef && isUUID(booking.bookingRef)) {
            await pmsService.checkOut(booking.bookingRef);
            showToast('Guest checked out');
          }
          localDispatch();
          return;
        }

        case 'DELETE_BOOKING': {
          const id = action.payload;
          const booking = state.bookings.find(b => b.id === id || b.bookingRef === id);
          if (booking?.bookingRef && isUUID(booking.bookingRef)) {
            await pmsService.cancelBooking(booking.bookingRef);
            showToast('Booking cancelled');
          }
          localDispatch();
          return;
        }

        case 'SET_ROOM_CLEAN':
        case 'SET_ROOM_DIRTY': {
          const num = action.payload;
          const uuid = roomUuidMap.current[num];
          if (uuid) {
            if (action.type === 'SET_ROOM_CLEAN') await pmsService.setRoomClean(uuid);
            else await pmsService.setRoomDirty(uuid);
          }
          localDispatch();
          return;
        }

        case 'SET_ROOM_OOO': {
          const { roomNumber, oooReason } = action.payload;
          const uuid = roomUuidMap.current[roomNumber];
          if (uuid) await pmsService.setRoomOOO(uuid, oooReason || 'Maintenance');
          localDispatch();
          showToast('Room marked OOO');
          return;
        }

        case 'SET_ROOM_AVAILABLE': {
          const num = action.payload;
          const uuid = roomUuidMap.current[num];
          if (uuid) await pmsService.setRoomAvailable(uuid);
          localDispatch();
          showToast('Room is available');
          return;
        }

        case 'OCCUPY_TABLE': {
          const { tableId, guestName } = action.payload;
          if (isUUID(tableId)) await pmsService.occupyTable(tableId, guestName);
          localDispatch();
          return;
        }

        case 'BILL_TABLE': {
          const id = action.payload;
          if (isUUID(id)) await pmsService.generateBill(id);
          localDispatch();
          return;
        }

        case 'VACATE_TABLE': {
          const id = action.payload;
          if (isUUID(id)) await pmsService.vacateTable(id);
          localDispatch();
          return;
        }

        case 'MOVE_TO_ROOM': {
          const { tableId, roomNumber } = action.payload;
          if (isUUID(tableId) && roomNumber) {
            const booking = state.bookings.find(b => b.roomNumber === roomNumber && b.status === 'checked-in');
            if (booking?.bookingRef && isUUID(booking.bookingRef)) {
              await pmsService.moveToRoom(tableId, booking.bookingRef);
              showToast('Bill moved to room folio');
            }
          }
          localDispatch();
          return;
        }

        case 'UPDATE_TABLE_ORDER': {
          localDispatch();
          return;
        }

        case 'UPDATE_RATE': {
          const { category, rates } = action.payload;
          const cat = state.pricingRates.find(r => r.category === category);
          if (cat?.id && isUUID(cat.id)) {
            await pmsService.updateRates(cat.id, rates.ep || rates.baseRate);
          }
          localDispatch();
          return;
        }

        default:
          localDispatch();
      }
    } catch (err) {
      localDispatch();
      showToast(err.message || 'Operation failed', 'error');
    }
  }, [state, showToast]);

  // Map roomId → room UUID from API
  const buildRoomMap = useCallback((rooms) => {
    const map = {};
    rooms.forEach(r => { map[r.room_number] = r.id; });
    roomUuidMap.current = map;
  }, []);

  // Load all data from API on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const token = api.getToken();
        if (token) {
          const me = await api.getMe();
          if (me.success) setUser(me.data);
        }
      } catch {}
      setAuthChecked(true);

      try {
        const [roomsRes, catsRes, bookingsRes, tablesRes, menuRes] = await Promise.allSettled([
          pmsService.getRooms(),
          pmsService.getCategories(),
          pmsService.getBookings({ limit: 100 }),
          pmsService.getPOSTables(),
          pmsService.getMenuItems(),
        ]);

        const apiRooms = roomsRes.status === 'fulfilled' ? roomsRes.value?.data || [] : [];
        const apiCats = catsRes.status === 'fulfilled' ? catsRes.value?.data || [] : [];
        const apiBookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value?.data || [] : [];
        const apiTables = tablesRes.status === 'fulfilled' ? tablesRes.value?.data || [] : [];
        const apiMenu = menuRes.status === 'fulfilled' ? menuRes.value?.data || [] : [];

        buildRoomMap(apiRooms);

        if (apiCats.length > 0 && apiRooms.length > 0) {
          const categories = apiCats.map(c => ({
            name: c.name.toUpperCase(),
            rooms: apiRooms.filter(r => r.category_id === c.id).map(r => ({
              number: r.room_number,
              clean: r.clean_status === 'clean',
              status: r.status === 'occupied' ? 'available' : r.status,
            })),
          }));
          const statuses = apiRooms.map(r => ({
            number: r.room_number,
            status: r.status,
            cleanStatus: r.clean_status,
            floor: r.floor,
            oooReason: r.ooo_reason || undefined,
          }));
          const pricingRates = apiCats.map(c => ({
            id: c.id,
            category: c.name,
            baseRate: c.base_price,
            ep: c.base_price,
            cp: c.base_price + (c.base_price > 5000 ? 800 : 500),
            ap: c.base_price + (c.base_price > 5000 ? 2500 : 2000),
          }));

          const posTables = apiTables.map(t => ({
            id: t.id,
            number: t.table_number,
            area: t.area,
            capacity: t.capacity,
            status: t.status,
            kotCount: t.kot_count || 0,
            guestName: t.guest_name || '',
            orderValue: t.current_order_value || 0,
          }));

          const bookings = apiBookings.map(b => ({
            id: b.booking_ref,
            bookingRef: b.id,
            roomNumber: b.room?.room_number,
            guestName: b.guest_name,
            pax: `${b.adults}+${b.children}`,
            plan: b.plan,
            source: b.source,
            checkIn: b.check_in?.slice(0, 10),
            checkOut: b.check_out?.slice(0, 10),
            balance: b.balance_amount,
            status: b.status,
          }));

          const menuItems = apiMenu.map((item, i) => ({
            id: item.id || i + 1,
            name: item.title,
            category: item.category,
            price: Math.round(item.price / 100),
            veg: !item.category?.toLowerCase().includes('chicken') && !item.category?.toLowerCase().includes('non-veg'),
          }));

          rawDispatch({
            type: 'SET_INITIAL_DATA',
            payload: {
              roomCategories: categories,
              roomStatuses: statuses,
              pricingRates: pricingRates.length > 0 ? pricingRates : fallbackPricing,
              bookings: bookings.length > 0 ? bookings : fallbackBookings,
              posTables: posTables.length > 0 ? posTables : fallbackPosTables,
              menuItems: menuItems.length > 0 ? menuItems : fallbackMenuItems,
            },
          });
        }
      } catch {}
      setLoading(false);
    }
    loadAll();
  }, [buildRoomMap]);

  // Computed values
  const activeBookings = state.bookings.filter(b => b.status !== 'checked-out' && b.status !== 'cancelled');
  const checkedInBookings = state.bookings.filter(b => b.status === 'checked-in');
  const occupiedCount = checkedInBookings.length;
  const totalRooms = state.roomCategories.reduce((s, c) => s + c.rooms.length, 0);
  const oooCount = state.roomStatuses.filter(r => r.status === 'ooo').length;
  const vacantCount = totalRooms - occupiedCount - oooCount;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const totalRevenue = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const todayIncome = state.transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const todayCollected = state.transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const todayDiscounts = state.transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((s, t) => s + Math.round(t.amount * 0.03), 0);
  const adr = occupiedCount > 0 ? Math.round(totalRevenue / occupiedCount) : 0;
  const revpar = Math.round(adr * (occupancyRate / 100));

  const dates = ['2026-12-15', '2026-12-16', '2026-12-17', '2026-12-18', '2026-12-19', '2026-12-20', '2026-12-21'];

  const todayStats = {
    arrivals: state.bookings.filter(b => b.checkIn === dates[0] && b.status !== 'checked-out' && b.status !== 'cancelled').length,
    departures: state.bookings.filter(b => b.checkOut === dates[0] || b.status === 'checked-out').length,
    inHouse: occupiedCount, vacant: vacantCount, revenue: todayIncome, collected: todayCollected, discounts: todayDiscounts,
  };

  const housekeepingStats = {
    clean: state.roomStatuses.filter(r => r.cleanStatus === 'clean').length,
    dirty: state.roomStatuses.filter(r => r.cleanStatus === 'dirty').length,
    ooo: oooCount, vacant: vacantCount,
  };

  const dashboardKPI = {
    totalRevenue, occupancyRate, adr, revpar, totalExpenses,
    revenueChange: 12.5, occupancyChange: 5.2, adrChange: -2.1,
  };

  const dailyRevenue = dates.map((d, i) => {
    const dayIncome = state.transactions.filter(t => t.date === d && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const catCount = state.roomCategories.reduce((s, c) => s + c.rooms.length, 0);
    const occ = state.bookings.filter(b => d >= b.checkIn && d < b.checkOut).length;
    const maxOcc = catCount || 10;
    return {
      date: d.slice(5),
      revenue: dayIncome || (fallbackDailyRev[i]?.revenue || 40000),
      occupancy: Math.round((occ / maxOcc) * 100) || (fallbackDailyRev[i]?.occupancy || 70),
    };
  });

  const revenueBreakdown = [
    { label: 'Room Revenue', value: state.transactions.filter(t => t.category === 'Room Booking').reduce((s, t) => s + t.amount, 0) || 185000, color: 'bg-blue-500' },
    { label: 'Restaurant / F&B', value: state.transactions.filter(t => t.category?.includes('Restaurant')).reduce((s, t) => s + t.amount, 0) || 65400, color: 'bg-emerald-500' },
    { label: 'Other Services', value: state.transactions.filter(t => t.category === 'Other Services').reduce((s, t) => s + t.amount, 0) || 34100, color: 'bg-amber-500' },
  ];

  const posOrders = state.posTables.filter(t => t.status === 'occupied').map(t => ({
    table: t.number, items: t.kotCount || 0, room: null, guest: t.guestName, status: 'live',
  }));

  const value = {
    state, dispatch, rawDispatch, user, loading, authChecked, toasts, showToast, removeToast,
    bookings: state.bookings, activeBookings, checkedInBookings,
    roomCategories: state.roomCategories, roomStatuses: state.roomStatuses,
    housekeepingStaff: state.housekeepingStaff, posTables: state.posTables,
    menuItems: state.menuItems, pricingRates: state.pricingRates, stopSell: state.stopSell,
    transactions: state.transactions, vouchers: state.vouchers, roles: state.roles,
    defaultRules: state.defaultRules, emailScheduler: state.emailScheduler,
    todayStats, housekeepingStats, dashboardKPI, dailyRevenue, revenueBreakdown,
    posOrders, todayIncome, totalRooms, occupiedCount, vacantCount,
    occupancyRate, totalRevenue, totalExpenses, adr, revpar,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Global toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`pointer-events-auto cursor-pointer px-4 py-3 rounded-xl shadow-lg text-xs font-semibold transition-all animate-slide-in ${
              t.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.25s ease-out; }
      `}</style>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
