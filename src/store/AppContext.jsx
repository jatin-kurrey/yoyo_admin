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
  dateRateOverrides: {},
  transactions: fallbackTxns,
  vouchers: fallbackVouchers,
  roles: fallbackRoles,
  demoUsers: [
    { id: 'demo_super', name: 'Super Admin', email: 'admin@yoyofun.in', password: 'change_this_to_strong_admin_password', role: 'super_admin', isActive: true },
    { id: 'demo_admin', name: 'Demo Admin', email: 'admin@yoyo.com', password: 'admin123', role: 'admin', isActive: true },
    { id: 'demo_booking', name: 'Booking Staff', email: 'priya@yoyo.com', password: 'admin123', role: 'booking_staff', isActive: true },
    { id: 'demo_hk', name: 'Housekeeping Staff', email: 'rajesh@yoyo.com', password: 'admin123', role: 'hk_staff', isActive: true },
  ],
  defaultRules: {
    checkInTime: '12:00 PM', checkOutTime: '10:00 AM',
    holdExpiry: '4 Hours', currency: 'INR', taxRate: 12, nightAuditTime: '01:00 AM',
    minAdvancePct: 0, minAdvanceAmt: 0,
    receiptHotelName: 'YOYO Fun Resort & Water Park',
    receiptAddress: 'Plot No. 12, Waterfront Road, Near Beach Colony',
    receiptCity: 'Goa - 403001',
    receiptPhone: '+91 98765 43210',
    receiptEmail: 'accounts@yoyofun.in',
    receiptGstin: '30ABCDE1234F1Z5',
    receiptPan: 'ABCDE1234F',
    singlePaymentMode: false,
  },
  emailScheduler: { enabled: false, email: 'manager@yoyofun.in', time: '06:00 AM' },
  folioCharges: [],
  bills: [],
  auditLog: [],
  enabledModules: {
    dashboard: true, calendar: true, roomview: true,
    pos: true, hk: true, pricing: true,
    accounts: true, reports: true, settings: true,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.payload };
    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.payload] };
    case 'UPDATE_BOOKING':
      return { ...state, bookings: state.bookings.map(b => (b.id === action.payload.id || b.bookingRef === action.payload.id) ? { ...b, ...action.payload } : b) };
    case 'ADD_PAYMENT': {
      const { bookingId, amount } = action.payload;
      return {
        ...state,
        bookings: state.bookings.map(b => (b.id === bookingId || b.bookingRef === bookingId) ? { ...b, balance: Math.max(0, b.balance - amount) } : b)
      };
    }
    case 'ADD_FOLIO_CHARGE': {
      const { bookingRef, charge } = action.payload;
      return {
        ...state,
        folioCharges: [...state.folioCharges, { id: `FCH${Date.now()}`, bookingRef, ...charge }],
      };
    }
    case 'DELETE_BOOKING':
      return { ...state, bookings: state.bookings.filter(b => b.id !== action.payload && b.bookingRef !== action.payload) };
    case 'CHECK_OUT': {
      const id = action.payload;
      return { ...state, bookings: state.bookings.map(b => (b.id === id || b.bookingRef === id) ? { ...b, status: 'checked-out' } : b) };
    }
    case 'CHECK_IN': {
      const id = action.payload;
      return { ...state, bookings: state.bookings.map(b => (b.id === id || b.bookingRef === id) ? { ...b, status: 'checked-in' } : b) };
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
    case 'UPDATE_TABLE_CART':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload.tableId ? { ...t, currentCart: action.payload.cart } : t) };
    case 'UPDATE_TABLE_ORDER':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload.tableId ? { ...t, kotCount: (t.kotCount || 0) + action.payload.kotDelta, orderValue: (t.orderValue || 0) + action.payload.valueDelta, status: 'occupied', currentCart: action.payload.currentCart || t.currentCart } : t) };
    case 'BILL_TABLE': {
      const table = state.posTables.find(t => t.id === action.payload);
      return {
        ...state,
        posTables: state.posTables.map(t => t.id === action.payload ? { ...t, status: 'billed', kotCount: 0 } : t),
        bills: table ? [...state.bills, {
          id: `BILL${Date.now()}`,
          tableId: table.id,
          tableNumber: table.number,
          area: table.area,
          guestName: table.guestName,
          items: table.currentCart || [],
          total: table.orderValue,
          tax: Math.round(table.orderValue * 0.05),
          grandTotal: table.orderValue + Math.round(table.orderValue * 0.05),
          date: new Date().toISOString(),
        }] : state.bills,
      };
    }
    case 'VACATE_TABLE':
      return { ...state, posTables: state.posTables.map(t => t.id === action.payload ? { ...t, status: 'vacant', kotCount: 0, guestName: '', orderValue: 0, currentCart: [] } : t) };
    case 'MOVE_TO_ROOM': {
      const { tableId, roomNumber } = action.payload;
      const table = state.posTables.find(t => t.id === tableId);
      const booking = state.bookings.find(b => b.roomNumber === roomNumber && b.status === 'checked-in');
      const charge = table ? {
        description: `POS Transfer - Table ${table.number} (${table.guestName})`,
        amount: table.orderValue,
        type: 'restaurant',
        quantity: 1,
      } : null;
      return {
        ...state,
        posTables: state.posTables.map(t => t.id === tableId ? { ...t, status: 'vacant', kotCount: 0, guestName: '', orderValue: 0, currentCart: [] } : t),
        folioCharges: charge && booking ? [...state.folioCharges, { id: `FCH${Date.now()}`, bookingRef: booking.bookingRef || booking.id, ...charge }] : state.folioCharges,
        bookings: charge && booking ? state.bookings.map(b => (b.id === booking.id) ? { ...b, balance: (b.balance || 0) + table.orderValue } : b) : state.bookings,
      };
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
    case 'SET_DATE_RATE': {
      const { category, date, rates } = action.payload;
      const catOverrides = { ...(state.dateRateOverrides[category] || {}) };
      catOverrides[date] = rates;
      return { ...state, dateRateOverrides: { ...state.dateRateOverrides, [category]: catOverrides } };
    }
    case 'CLEAR_DATE_RATE': {
      const { category, date } = action.payload;
      const catOverrides = { ...(state.dateRateOverrides[category] || {}) };
      delete catOverrides[date];
      return { ...state, dateRateOverrides: { ...state.dateRateOverrides, [category]: catOverrides } };
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
    case 'ADD_DEMO_USER':
      return { ...state, demoUsers: [...state.demoUsers, { id: `demo_${Date.now()}`, ...action.payload }] };
    case 'UPDATE_DEMO_USER':
      return { ...state, demoUsers: state.demoUsers.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u) };
    case 'DELETE_DEMO_USER':
      return { ...state, demoUsers: state.demoUsers.filter(u => u.id !== action.payload) };
    // Room & Category CRUD
    case 'ADD_CATEGORY': {
      const newCat = { name: action.payload.name.toUpperCase(), rooms: [] };
      return { ...state, roomCategories: [...state.roomCategories, newCat] };
    }
    case 'UPDATE_CATEGORY': {
      const { oldName, newName } = action.payload;
      return {
        ...state,
        roomCategories: state.roomCategories.map(c =>
          c.name === oldName ? { ...c, name: newName.toUpperCase() } : c
        ),
      };
    }
    case 'DELETE_CATEGORY': {
      const name = action.payload;
      return {
        ...state,
        roomCategories: state.roomCategories.filter(c => c.name !== name),
        roomStatuses: state.roomStatuses.filter(r => {
          const cat = state.roomCategories.find(c => c.name === name);
          return !cat || !cat.rooms.some(rm => rm.number === r.number);
        }),
      };
    }
    case 'ADD_ROOM': {
      const { categoryName, room } = action.payload;
      return {
        ...state,
        roomCategories: state.roomCategories.map(c =>
          c.name === categoryName
            ? { ...c, rooms: [...c.rooms, { number: room.number, clean: true, status: 'available' }] }
            : c
        ),
        roomStatuses: [
          ...state.roomStatuses,
          { number: room.number, status: 'available', cleanStatus: 'clean', floor: Math.floor(room.number / 100), oooReason: undefined },
        ],
      };
    }
    case 'UPDATE_ROOM': {
      const { categoryName, roomNumber, updates } = action.payload;
      return {
        ...state,
        roomCategories: state.roomCategories.map(c =>
          c.name === categoryName
            ? { ...c, rooms: c.rooms.map(r => r.number === roomNumber ? { ...r, ...updates } : r) }
            : c
        ),
        roomStatuses: state.roomStatuses.map(r =>
          r.number === roomNumber ? { ...r, ...updates, cleanStatus: updates.clean !== undefined ? (updates.clean ? 'clean' : 'dirty') : r.cleanStatus, status: updates.status || r.status } : r
        ),
      };
    }
    case 'DELETE_ROOM': {
      const { categoryName, roomNumber } = action.payload;
      return {
        ...state,
        roomCategories: state.roomCategories.map(c =>
          c.name === categoryName
            ? { ...c, rooms: c.rooms.filter(r => r.number !== roomNumber) }
            : c
        ),
        roomStatuses: state.roomStatuses.filter(r => r.number !== roomNumber),
      };
    }
    case 'ADD_NIGHT_AUDIT': {
      const entry = { date: action.payload.date, completedAt: new Date().toISOString(), revenue: action.payload.revenue };
      return { ...state, auditLog: [...state.auditLog, entry] };
    }
    // Module enable/disable
    case 'TOGGLE_MODULE':
      return {
        ...state,
        enabledModules: {
          ...state.enabledModules,
          [action.payload]: !state.enabledModules[action.payload],
        },
      };
    case 'SET_MODULES':
      return { ...state, enabledModules: { ...state.enabledModules, ...action.payload } };
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
            adults: data.adults ?? (parseInt(data.pax?.split('+')[0]) || 2),
            children: data.children ?? (parseInt(data.pax?.split('+')[1]) || 0),
            plan: data.plan || 'EP',
            source: data.source || 'Walk-In',
             check_in: `${data.checkIn}T00:00:00Z`,
            check_out: `${data.checkOut}T00:00:00Z`,
            rate_per_night: data.rate || 4000,
          });
          let b = res.data;
          if (data.advancePaid > 0) {
            try {
              await pmsService.addPayment(b.id, {
                booking_id: b.id,
                amount: parseInt(data.advancePaid) || 0,
                mode: data.paymentMode || 'Cash',
                type: 'advance',
              });
              const updatedRes = await pmsService.getBooking(b.id);
              if (updatedRes?.data) {
                b = updatedRes.data;
              }
            } catch (err) {
              console.error('Failed to register advance payment', err);
            }
          }
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
            rate: b.rate_per_night,
            total: b.total_amount,
            paid: b.paid_amount,
            tax: b.tax,
            discount: b.discount,
          };
          rawDispatch({ type: 'ADD_BOOKING', payload: booking });
          showToast('Booking created');
          refreshData();
          return;
        }

        case 'ADD_PAYMENT': {
          const { bookingId, amount, mode, type } = action.payload;
          const booking = state.bookings.find(b => b.id === bookingId || b.bookingRef === bookingId);
          if (booking?.bookingRef && isUUID(booking.bookingRef)) {
            await pmsService.addPayment(booking.bookingRef, {
              booking_id: booking.bookingRef,
              amount: parseInt(amount) || 0,
              mode: mode || 'Cash',
              type: type || 'settlement',
            });
            showToast('Payment recorded');
          }
          localDispatch();
          refreshData();
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
          refreshData();
          return;
        }

        case 'CHECK_IN': {
          const id = action.payload;
          const booking = state.bookings.find(b => b.id === id || b.bookingRef === id);
          if (booking?.bookingRef && isUUID(booking.bookingRef)) {
            await pmsService.checkIn(booking.bookingRef);
            showToast('Guest checked in');
          }
          localDispatch();
          refreshData();
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

        case 'BULK_SET_CLEAN': {
          const floorC = action.payload;
          const roomsC = state.roomStatuses.filter(r => floorC === 'all' || r.floor === floorC);
          await Promise.allSettled(roomsC.map(r => {
            const uuid = roomUuidMap.current[r.number];
            if (uuid) return pmsService.setRoomClean(uuid);
            return Promise.resolve();
          }));
          localDispatch();
          showToast(`${roomsC.length} rooms marked clean`);
          return;
        }

        case 'BULK_SET_DIRTY': {
          const floorD = action.payload;
          const roomsD = state.roomStatuses.filter(r => floorD === 'all' || r.floor === floorD);
          await Promise.allSettled(roomsD.map(r => {
            const uuid = roomUuidMap.current[r.number];
            if (uuid) return pmsService.setRoomDirty(uuid);
            return Promise.resolve();
          }));
          localDispatch();
          showToast(`${roomsD.length} rooms marked dirty`);
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
          const { tableId, items } = action.payload;
          if (isUUID(tableId) && items?.length) {
            await Promise.allSettled(items.map(item =>
              pmsService.addKOT(tableId, {
                table_id: tableId,
                menu_item_id: item.id || null,
                item_name: item.name,
                quantity: item.qty || 1,
                price: item.price,
                notes: item.notes || '',
              })
            ));
          }
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

        case 'ADD_TRANSACTION': {
          const txData = action.payload;
          if (!api.getToken()) {
            localDispatch();
            return;
          }
          const res = await pmsService.createTransaction({
            date: txData.date || new Date().toISOString().slice(0, 10),
            type: txData.type,
            category: txData.category,
            description: txData.description,
            amount: txData.amount,
            method: txData.method,
            status: txData.status || 'completed',
            guest_name: txData.guestName || '',
          });
          const newTx = res.data;
          rawDispatch({
            type: 'ADD_TRANSACTION',
            payload: {
              ...txData,
              id: newTx?.id?.slice(0, 8) || txData.id,
              date: newTx?.date || txData.date,
            },
          });
          showToast('Transaction added');
          return;
        }

        case 'UPDATE_EMAIL_SCHEDULER': {
          const s = action.payload;
          if (api.getToken()) {
            try { await pmsService.upsertSetting('email_scheduler', JSON.stringify(s)); } catch {}
          }
          localDispatch();
          return;
        }

        case 'UPDATE_DEFAULT_RULES': {
          const rules = action.payload;
          if (api.getToken()) {
            try {
              await Promise.allSettled(Object.entries(rules).map(([k, v]) =>
                pmsService.upsertSetting(k, String(v))
              ));
            } catch {}
          }
          localDispatch();
          showToast('Settings saved');
          return;
        }

        case 'SET_DATE_RATE': {
          const { category: catName, date, rates } = action.payload;
          const cat = state.pricingRates.find(r => r.category === catName);
          if (cat?.id) {
            await Promise.allSettled(
              ['ep', 'cp', 'ap']
                .filter(p => rates[p] != null)
                .map(p => pmsService.setRateOverride({ category_id: cat.id, date, plan: p, rate: rates[p] }))
            );
          }
          localDispatch();
          return;
        }

        case 'CLEAR_DATE_RATE': {
          const { category: catName, date } = action.payload;
          const cat = state.pricingRates.find(r => r.category === catName);
          if (cat?.id) {
            await Promise.allSettled(
              ['ep', 'cp', 'ap'].map(p =>
                pmsService.clearRateOverride({ category_id: cat.id, date, plan: p })
              )
            );
          }
          localDispatch();
          return;
        }

        case 'TOGGLE_STOP_SELL': {
          const { category: catName, dateIdx } = action.payload;
          const cat = state.pricingRates.find(r => r.category === catName);
          if (cat?.id && dates[dateIdx]) {
            const isOn = state.stopSell?.[catName]?.[dateIdx];
            await Promise.allSettled(
              ['ep', 'cp', 'ap'].map(p =>
                pmsService.setRateOverride({
                  category_id: cat.id, date: dates[dateIdx], plan: p,
                  stop_sell: !isOn,
                })
              )
            );
          }
          localDispatch();
          return;
        }

        default:
          localDispatch();
      }
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        return;
      }
      localDispatch();
      showToast(err.message || 'Operation failed', 'error');
    }
  }, [state, showToast, setUser]);

  const [usingMockData, setUsingMockData] = useState(false);

  // Map roomId → room UUID from API
  const buildRoomMap = useCallback((rooms) => {
    const map = {};
    rooms.forEach(r => { map[r.room_number] = r.id; });
    roomUuidMap.current = map;
  }, []);

  const refreshData = useCallback(async () => {
    const currentToken = api.getToken();
    
    try {
      if (currentToken && !user) {
        const me = await api.getMe();
        if (me.success) { 
          setUser(me.data); 
          localStorage.setItem('yoyo_admin_user', JSON.stringify(me.data)); 
        }
      }
    } catch {}

    if (!currentToken && !user) {
      try {
        const cached = localStorage.getItem('yoyo_admin_user');
        if (cached) setUser(JSON.parse(cached));
      } catch {}
    }
    setAuthChecked(true);

    if (!api.getToken()) {
      setUsingMockData(true);
      setLoading(false);
      return;
    }

    try {
      const cachedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('yoyo_admin_user'));
        } catch { return null; }
      })();
      const currentUser = user || cachedUser;
      const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');

      const [roomsRes, catsRes, bookingsRes, tablesRes, menuRes, txnsRes, settingsRes, overridesRes, usersRes] = await Promise.allSettled([
        pmsService.getRooms(),
        pmsService.getCategories(),
        pmsService.getBookings({ limit: 100 }),
        pmsService.getPOSTables(),
        pmsService.getMenuItems(),
        pmsService.getTransactions({}),
        pmsService.getSettings(),
        pmsService.getRateOverrides(),
        isAdmin ? api.admin.get('/users?limit=100') : Promise.resolve({ success: true, data: { items: [] } }),
      ]);

      const apiRooms = roomsRes.status === 'fulfilled' ? roomsRes.value?.data || [] : [];
      const apiCats = catsRes.status === 'fulfilled' ? catsRes.value?.data || [] : [];
      const apiBookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value?.data?.items || [] : [];
      const apiTables = tablesRes.status === 'fulfilled' ? tablesRes.value?.data || [] : [];
      const apiMenu = menuRes.status === 'fulfilled' ? menuRes.value?.data || [] : [];

      buildRoomMap(apiRooms);

      const gotRealData = apiRooms.length > 0 || apiCats.length > 0 || apiBookings.length > 0;
      setUsingMockData(!gotRealData);

      const categories = apiCats.length > 0
        ? apiCats.map(c => ({
            name: c.name.toUpperCase(),
            rooms: apiRooms.filter(r => r.category_id === c.id).map(r => ({
              number: r.room_number,
              clean: r.clean_status === 'clean',
              status: r.status,
            })),
          }))
        : fallbackCats;

      const statuses = apiRooms.length > 0
        ? apiRooms.map(r => ({
            number: r.room_number,
            status: r.status,
            cleanStatus: r.clean_status,
            floor: r.floor,
            oooReason: r.ooo_reason || undefined,
          }))
        : fallbackRoomStatuses;

      const pricingRates = apiCats.length > 0
        ? apiCats.map(c => ({
            id: c.id,
            category: c.name,
            baseRate: c.base_price,
            ep: c.base_price,
            cp: c.base_price + (c.base_price > 5000 ? 800 : 500),
            ap: c.base_price + (c.base_price > 5000 ? 2500 : 2000),
          }))
        : fallbackPricing;

      const posTables = apiTables.length > 0
        ? apiTables.map(t => ({
            id: t.id,
            number: t.table_number,
            area: t.area,
            capacity: t.capacity,
            status: t.status,
            kotCount: t.kot_count || 0,
            guestName: t.guest_name || '',
            orderValue: t.current_order_value || 0,
          }))
        : fallbackPosTables;

      const bookings = apiBookings.length > 0
        ? apiBookings.map(b => ({
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
            rate: b.rate_per_night,
            total: b.total_amount,
            paid: b.paid_amount,
            tax: b.tax,
            discount: b.discount,
          }))
        : fallbackBookings;

      const menuItems = apiMenu.length > 0
        ? apiMenu.map((item, i) => ({
            id: item.id || i + 1,
            name: item.title,
            category: item.category,
            price: Math.round(item.price / 100),
            veg: !item.category?.toLowerCase().includes('chicken') && !item.category?.toLowerCase().includes('non-veg'),
          }))
        : fallbackMenuItems;

      const apiTxns = txnsRes.status === 'fulfilled' ? txnsRes.value?.data || [] : [];
      const transactions = apiTxns.length > 0 ? apiTxns.map(t => ({
        id: t.id?.slice(0, 8) || `TXN${Date.now()}`,
        date: t.date || new Date().toISOString().slice(0, 10),
        type: t.type,
        category: t.category,
        description: t.description || '',
        amount: t.amount,
        method: t.method,
        status: t.status,
        guestName: t.guest_name || '',
      })) : fallbackTxns;

      const apiSettings = settingsRes.status === 'fulfilled' ? settingsRes.value?.data || {} : {};
      const apiUsers = usersRes.status === 'fulfilled' ? usersRes.value?.data?.items || [] : [];
      const apiOverrides = overridesRes.status === 'fulfilled' ? overridesRes.value?.data || [] : [];

      const hkStaffList = apiUsers.filter(u => u.role === 'hk_staff').map(u => ({
        id: u.id,
        name: u.name,
        status: 'available',
        assignedRooms: [],
      }));
      const housekeepingStaff = hkStaffList.length > 0 ? hkStaffList : fallbackHKStaff;

      const defaultRules = {
        checkInTime: apiSettings.check_in_time || '12:00 PM',
        checkOutTime: apiSettings.check_out_time || '10:00 AM',
        holdExpiry: apiSettings.hold_expiry || '4 Hours',
        currency: apiSettings.currency || 'INR',
        taxRate: parseInt(apiSettings.tax_rate) || 12,
        nightAuditTime: apiSettings.night_audit_time || '01:00 AM',
        minAdvancePct: parseInt(apiSettings.minAdvancePct) || 0,
        minAdvanceAmt: parseInt(apiSettings.minAdvanceAmt) || 0,
        receiptHotelName: apiSettings.receiptHotelName || 'YOYO Fun Resort & Water Park',
        receiptAddress: apiSettings.receiptAddress || 'Plot No. 12, Waterfront Road, Near Beach Colony',
        receiptCity: apiSettings.receiptCity || 'Goa - 403001',
        receiptPhone: apiSettings.receiptPhone || '+91 98765 43210',
        receiptEmail: apiSettings.receiptEmail || 'accounts@yoyofun.in',
        receiptGstin: apiSettings.receiptGstin || '30ABCDE1234F1Z5',
        receiptPan: apiSettings.receiptPan || 'ABCDE1234F',
        singlePaymentMode: apiSettings.singlePaymentMode === 'true',
      };

      const overridesByDate = {};
      apiOverrides.forEach(o => {
        const catName = pricingRates.find(r => r.id === o.category_id)?.category;
        if (!catName) return;
        if (!overridesByDate[catName]) overridesByDate[catName] = {};
        if (!overridesByDate[catName][o.date]) overridesByDate[catName][o.date] = {};
        overridesByDate[catName][o.date][o.plan] = o.rate;
      });
      const dateRateOverrides = Object.keys(overridesByDate).length > 0 ? overridesByDate : {};

      rawDispatch({
        type: 'SET_INITIAL_DATA',
        payload: { roomCategories: categories, roomStatuses: statuses, pricingRates, bookings, posTables, menuItems, transactions, housekeepingStaff, defaultRules, dateRateOverrides },
      });
    } catch { setUsingMockData(true); }
    setLoading(false);
  }, [user, buildRoomMap]);

  // Persist room categories + audit log to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yoyo_room_categories', JSON.stringify(state.roomCategories));
      localStorage.setItem('yoyo_audit_log', JSON.stringify(state.auditLog));
      localStorage.setItem('yoyo_bills', JSON.stringify(state.bills));
    } catch {}
  }, [state.roomCategories, state.auditLog, state.bills]);

  // Load persisted data from localStorage on mount
  useEffect(() => {
    try {
      const savedCats = localStorage.getItem('yoyo_room_categories');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawDispatch({ type: 'SET_INITIAL_DATA', payload: { roomCategories: parsed } });
        }
      }
      const savedAudit = localStorage.getItem('yoyo_audit_log');
      if (savedAudit) {
        const parsed = JSON.parse(savedAudit);
        if (Array.isArray(parsed)) {
          rawDispatch({ type: 'SET_INITIAL_DATA', payload: { auditLog: parsed } });
        }
      }
    } catch {}
  }, []);

  // Load all data from API on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-poll every 30s for live updates
  useEffect(() => {
    if (!api.getToken()) return;
    const interval = setInterval(() => refreshData(), 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Computed values
  const activeBookings = state.bookings.filter(b => b.status !== 'checked-out' && b.status !== 'cancelled');
  const checkedInBookings = state.bookings.filter(b => b.status === 'checked-in');
  const occupiedCount = checkedInBookings.length;
  const totalRooms = state.roomCategories.reduce((s, c) => s + c.rooms.length, 0);
  const oooCount = state.roomStatuses.filter(r => r.status === 'ooo').length;
  const vacantCount = totalRooms - occupiedCount - oooCount;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  const totalRevenue = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const todayIncome = state.transactions.filter(t => t.date === todayStr && t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const todayCollected = state.transactions.filter(t => t.date === todayStr && t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const todayDiscounts = state.transactions.filter(t => t.date === todayStr && t.type === 'income' && t.status === 'completed').reduce((s, t) => s + Math.round(t.amount * 0.03), 0);
  const adr = occupiedCount > 0 ? Math.round(totalRevenue / occupiedCount) : 0;
  const revpar = Math.round(adr * (occupancyRate / 100));
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const dayLabels = dates.map((d, i) => {
    if (i === 0) return 'Today';
    const dt = new Date(d + 'T00:00:00');
    const day = dt.toLocaleDateString('en-IN', { weekday: 'short' });
    const date = dt.getDate();
    const mon = dt.toLocaleDateString('en-IN', { month: 'short' });
    return `${day} ${date} ${mon}`;
  });

  const todayStats = {
    arrivals: state.bookings.filter(b => b.checkIn === todayStr && b.status !== 'checked-out' && b.status !== 'cancelled').length,
    departures: state.bookings.filter(b => b.checkOut === todayStr && b.status !== 'cancelled').length,
    inHouse: occupiedCount, vacant: vacantCount, revenue: todayIncome, collected: todayCollected, discounts: todayDiscounts,
  };

  const housekeepingStats = {
    clean: state.roomStatuses.filter(r => r.cleanStatus === 'clean').length,
    dirty: state.roomStatuses.filter(r => r.cleanStatus === 'dirty').length,
    ooo: oooCount, vacant: vacantCount,
  };

  const yesterdayIncome = state.transactions.filter(t => t.date === yesterdayStr && t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const prevIncome = yesterdayIncome || todayIncome;
  const revenueChange = prevIncome > 0 ? Math.round(((todayIncome - prevIncome) / prevIncome) * 100) : 0;
  const prevOcc = yesterdayStr ? state.bookings.filter(b => yesterdayStr >= b.checkIn && yesterdayStr < b.checkOut).length : occupiedCount;
  const occChange = prevOcc > 0 ? Math.round(((occupiedCount - prevOcc) / prevOcc) * 100) : 0;
  const prevAdrValue = prevOcc > 0 ? Math.round((totalRevenue - todayIncome) / prevOcc) : adr;
  const adrChange = prevAdrValue > 0 ? Math.round(((adr - prevAdrValue) / prevAdrValue) * 100) : 0;
  const todayRevpar = Math.round(adr * (occupancyRate / 100));
  const prevRevpar = prevOcc > 0 && prevAdrValue > 0 ? Math.round(prevAdrValue * ((prevOcc / totalRooms) * 100 / 100)) : todayRevpar;
  const revparChange = prevRevpar > 0 ? Math.round(((todayRevpar - prevRevpar) / prevRevpar) * 100) : 0;
  const todayExpenses = state.transactions.filter(t => t.date === todayStr && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const yesterdayExpenses = state.transactions.filter(t => t.date === yesterdayStr && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevExpenses = yesterdayExpenses || todayExpenses || 1;
  const expensesChange = Math.round(((todayExpenses - prevExpenses) / prevExpenses) * 100);

  const dashboardKPI = {
    totalRevenue, occupancyRate, adr, revpar, totalExpenses,
    revenueChange, occupancyChange: occChange, adrChange, revparChange, expensesChange,
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

  const txVouchers = state.transactions.filter(t => t.guestName).map(t => ({
    id: t.id, date: t.date, guest: t.guestName, type: t.category,
    amount: t.amount, status: t.status === 'completed' ? 'generated' : 'pending',
  }));
  const vouchers = txVouchers.length > 0 ? txVouchers : state.vouchers;

  const value = {
    state, dispatch, rawDispatch, user, setUser, loading, authChecked, toasts, showToast, removeToast, refreshData, usingMockData,
    bookings: state.bookings, activeBookings, checkedInBookings,
    roomCategories: state.roomCategories, roomStatuses: state.roomStatuses,
    housekeepingStaff: state.housekeepingStaff, posTables: state.posTables,
    menuItems: state.menuItems, pricingRates: state.pricingRates, stopSell: state.stopSell, dateRateOverrides: state.dateRateOverrides,
    transactions: state.transactions, vouchers, roles: state.roles, demoUsers: state.demoUsers,
    defaultRules: state.defaultRules, emailScheduler: state.emailScheduler, enabledModules: state.enabledModules,
    folioCharges: state.folioCharges, bills: state.bills, auditLog: state.auditLog,
    dates, dayLabels, todayStats, housekeepingStats, dashboardKPI, dailyRevenue, revenueBreakdown,
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
