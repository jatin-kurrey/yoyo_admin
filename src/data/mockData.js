export const dates = [
  '2026-12-15', '2026-12-16', '2026-12-17', '2026-12-18',
  '2026-12-19', '2026-12-20', '2026-12-21',
];

export const dayLabels = [
  'Mon 15 Dec', 'Tue 16 Dec', 'Wed 17 Dec',
  'Thu 18 Dec', 'Fri 19 Dec', 'Sat 20 Dec', 'Sun 21 Dec',
];

export const roomCategories = [
  {
    name: 'SUPER DELUXE ROOMS',
    rooms: [
      { number: 101, clean: true, status: 'available' },
      { number: 102, clean: false, status: 'available' },
      { number: 103, clean: true, status: 'available' },
      { number: 104, clean: true, status: 'available' },
      { number: 105, clean: true, status: 'blocked' },
    ],
  },
  {
    name: 'FAMILY SUITES',
    rooms: [
      { number: 201, clean: true, status: 'available' },
      { number: 202, clean: true, status: 'ooo' },
      { number: 203, clean: false, status: 'available' },
    ],
  },
  {
    name: 'EXECUTIVE PACK',
    rooms: [
      { number: 301, clean: true, status: 'available' },
      { number: 302, clean: true, status: 'available' },
    ],
  },
];

export const bookings = [
  {
    id: 1, roomNumber: 101, checkIn: '2026-12-15', checkOut: '2026-12-18',
    guestName: 'R. Singh', pax: '2+1', plan: 'CP', source: 'AGODA',
    balance: 0, status: 'checked-in',
  },
  {
    id: 2, roomNumber: 101, checkIn: '2026-12-19', checkOut: '2026-12-21',
    guestName: 'Priya Mehta', pax: '2', plan: 'EP', source: 'BOOKING.COM',
    balance: 4500, status: 'future',
  },
  {
    id: 3, roomNumber: 103, checkIn: '2026-12-15', checkOut: '2026-12-16',
    guestName: 'M. Sharma', pax: '1', plan: 'EP', source: 'WALK-IN',
    balance: 2000, status: 'hold',
  },
  {
    id: 4, roomNumber: 104, checkIn: '2026-12-16', checkOut: '2026-12-19',
    guestName: 'Ananya Gupta', pax: '3', plan: 'AP', source: 'MMT',
    balance: 12000, status: 'checked-in',
  },
  {
    id: 5, roomNumber: 201, checkIn: '2026-12-17', checkOut: '2026-12-20',
    guestName: 'TATA Motors', pax: '6 (3 Rms)', plan: 'AP', source: 'CORPORATE',
    balance: 0, status: 'future',
  },
  {
    id: 6, roomNumber: 203, checkIn: '2026-12-15', checkOut: '2026-12-17',
    guestName: 'Vikram Joshi', pax: '2+2', plan: 'CP', source: 'AGODA',
    balance: 3200, status: 'checked-in',
  },
  {
    id: 7, roomNumber: 301, checkIn: '2026-12-18', checkOut: '2026-12-21',
    guestName: 'Neha Kapoor', pax: '1', plan: 'EP', source: 'WALK-IN',
    balance: 0, status: 'future',
  },
];

export const housekeepingStats = { clean: 12, dirty: 2, ooo: 1, vacant: 2 };

export const todayStats = {
  arrivals: 5, departures: 3, inHouse: 18, vacant: 2,
  revenue: 12500, collected: 8000, discounts: 500,
};

export const posOrders = [
  { table: 10, items: 3, room: 101, guest: 'R. Singh', status: 'live' },
  { table: 5, items: 2, room: null, guest: null, status: 'live' },
];

export const sidebarModules = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'calendar', label: 'Reservation Calendar', icon: 'CalendarDays' },
  { id: 'roomview', label: 'Room View', icon: 'DoorOpen' },
  { id: 'pos', label: 'Restaurant / POS', icon: 'UtensilsCrossed', sub: 'Captain App' },
  { id: 'hk', label: 'Housekeeping', icon: 'SprayCan', sub: 'Task Assignment' },
  { id: 'pricing', label: 'Pricing / Rates', icon: 'DollarSign' },
  { id: 'accounts', label: 'Accounts & Finance', icon: 'Receipt' },
  { id: 'reports', label: 'Reports', icon: 'FileText', sub: 'Night Audit' },
  { id: 'settings', label: 'Settings', icon: 'Settings', sub: 'User Roles' },
];

/* ─────────── DASHBOARD DATA ─────────── */
export const dashboardKPI = {
  totalRevenue: 284500,
  occupancyRate: 78,
  adr: 4850,
  revpar: 3783,
  totalExpenses: 89200,
  revenueChange: 12.5,
  occupancyChange: 5.2,
  adrChange: -2.1,
};

export const revenueBreakdown = [
  { label: 'Room Revenue', value: 185000, color: 'bg-blue-500' },
  { label: 'Restaurant / F&B', value: 65400, color: 'bg-emerald-500' },
  { label: 'Other Services', value: 34100, color: 'bg-amber-500' },
];

export const dailyRevenue = [
  { date: '15 Dec', revenue: 41200, occupancy: 72 },
  { date: '16 Dec', revenue: 38500, occupancy: 68 },
  { date: '17 Dec', revenue: 42800, occupancy: 75 },
  { date: '18 Dec', revenue: 45600, occupancy: 82 },
  { date: '19 Dec', revenue: 39100, occupancy: 71 },
  { date: '20 Dec', revenue: 47300, occupancy: 88 },
  { date: '21 Dec', revenue: 41000, occupancy: 76 },
];

/* ─────────── POS / RESTAURANT DATA ─────────── */
export const posAreas = ['Indoor Dining', 'Rooftop', 'Garden Area'];
export const posTables = [
  { id: 1, number: 1, area: 'Indoor Dining', capacity: 4, status: 'vacant' },
  { id: 2, number: 2, area: 'Indoor Dining', capacity: 2, status: 'occupied', kotCount: 2, guestName: 'Amit Shah', orderValue: 1240 },
  { id: 3, number: 3, area: 'Indoor Dining', capacity: 6, status: 'billed', kotCount: 0, guestName: '', orderValue: 3400 },
  { id: 4, number: 4, area: 'Indoor Dining', capacity: 4, status: 'vacant' },
  { id: 5, number: 5, area: 'Rooftop', capacity: 4, status: 'occupied', kotCount: 4, guestName: 'Riya Jain', orderValue: 2100 },
  { id: 6, number: 6, area: 'Rooftop', capacity: 2, status: 'vacant' },
  { id: 7, number: 7, area: 'Rooftop', capacity: 6, status: 'occupied', kotCount: 1, guestName: 'Vikram Bhatt', orderValue: 890 },
  { id: 8, number: 8, area: 'Rooftop', capacity: 4, status: 'vacant' },
  { id: 9, number: 9, area: 'Garden Area', capacity: 8, status: 'occupied', kotCount: 6, guestName: 'Corporate Event', orderValue: 12400 },
  { id: 10, number: 10, area: 'Garden Area', capacity: 4, status: 'vacant' },
  { id: 11, number: 11, area: 'Garden Area', capacity: 4, status: 'billed', kotCount: 0, guestName: '', orderValue: 1800 },
  { id: 12, number: 12, area: 'Garden Area', capacity: 2, status: 'vacant' },
];

export const menuCategories = ['All', 'Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts'];
export const menuItems = [
  { id: 1, name: 'Paneer Tikka', category: 'Starters', price: 350, veg: true },
  { id: 2, name: 'Chicken Wings', category: 'Starters', price: 420, veg: false },
  { id: 3, name: 'Spring Rolls', category: 'Starters', price: 280, veg: true },
  { id: 4, name: 'Dal Makhani', category: 'Main Course', price: 450, veg: true },
  { id: 5, name: 'Butter Chicken', category: 'Main Course', price: 520, veg: false },
  { id: 6, name: 'Paneer Butter Masala', category: 'Main Course', price: 480, veg: true },
  { id: 7, name: 'Biryani', category: 'Main Course', price: 550, veg: false },
  { id: 8, name: 'Naan', category: 'Breads', price: 60, veg: true },
  { id: 9, name: 'Garlic Naan', category: 'Breads', price: 80, veg: true },
  { id: 10, name: 'Masala Soda', category: 'Beverages', price: 120, veg: true },
  { id: 11, name: 'Fresh Lime', category: 'Beverages', price: 90, veg: true },
  { id: 12, name: 'Gulab Jamun', category: 'Desserts', price: 180, veg: true },
  { id: 13, name: 'Ice Cream Sundae', category: 'Desserts', price: 250, veg: true },
];

/* ─────────── HOUSEKEEPING DATA ─────────── */
export const housekeepingStaff = [
  { id: 1, name: 'Sunil Kumar', assignedRooms: [101, 102, 103], status: 'busy' },
  { id: 2, name: 'Ramesh Yadav', assignedRooms: [104, 105], status: 'available' },
  { id: 3, name: 'Dinesh Patel', assignedRooms: [201, 202, 203], status: 'busy' },
  { id: 4, name: 'Manoj Singh', assignedRooms: [301, 302], status: 'idle' },
];

export const roomStatusList = [
  { number: 101, status: 'occupied', cleanStatus: 'clean', floor: 1 },
  { number: 102, status: 'occupied', cleanStatus: 'dirty', floor: 1 },
  { number: 103, status: 'vacant', cleanStatus: 'clean', floor: 1 },
  { number: 104, status: 'occupied', cleanStatus: 'clean', floor: 1 },
  { number: 105, status: 'vacant', cleanStatus: 'clean', floor: 1 },
  { number: 201, status: 'occupied', cleanStatus: 'dirty', floor: 2 },
  { number: 202, status: 'ooo', cleanStatus: 'clean', floor: 2, oooReason: 'Plumbing Maintenance' },
  { number: 203, status: 'vacant', cleanStatus: 'dirty', floor: 2 },
  { number: 301, status: 'vacant', cleanStatus: 'clean', floor: 3 },
  { number: 302, status: 'occupied', cleanStatus: 'clean', floor: 3 },
];

/* ─────────── PRICING DATA ─────────── */
export const pricingRates = [
  { category: 'Super Deluxe', baseRate: 4000, ep: 4000, cp: 4800, ap: 6000 },
  { category: 'Family Suite', baseRate: 6500, ep: 6500, cp: 7500, ap: 9000 },
  { category: 'Executive Pack', baseRate: 8500, ep: 8500, cp: 9800, ap: 11500 },
];

export const pricingCalendar = dates.map((date, i) => ({
  date,
  categories: [
    { name: 'Super Deluxe', rate: 4000 + (i % 3 === 0 ? 500 : 0), available: i !== 2 },
    { name: 'Family Suite', rate: 6500 + (i % 2 === 0 ? 800 : 0), available: true },
    { name: 'Executive Pack', rate: 8500, available: i !== 4 },
  ],
}));

/* ─────────── ACCOUNTS DATA ─────────── */
export const transactions = [
  { id: 'TXN001', date: '15 Dec', type: 'income', category: 'Room Booking', description: 'R. Singh - Room 101 (3 nights)', amount: 12000, method: 'UPI', status: 'completed' },
  { id: 'TXN002', date: '15 Dec', type: 'income', category: 'Restaurant', description: 'Table 5 - Dinner', amount: 2340, method: 'Card', status: 'completed' },
  { id: 'TXN003', date: '16 Dec', type: 'expense', category: 'Supplies', description: 'Kitchen Groceries Purchase', amount: 8500, method: 'Cash', status: 'completed' },
  { id: 'TXN004', date: '16 Dec', type: 'income', category: 'Room Booking', description: 'Ananya Gupta - Room 104 (3 nights)', amount: 18000, method: 'UPI', status: 'completed' },
  { id: 'TXN005', date: '17 Dec', type: 'income', category: 'Other Services', description: 'Laundry Service - Room 101', amount: 800, method: 'Cash', status: 'completed' },
  { id: 'TXN006', date: '17 Dec', type: 'expense', category: 'Utilities', description: 'Electricity Bill Payment', amount: 12500, method: 'Bank Transfer', status: 'completed' },
  { id: 'TXN007', date: '18 Dec', type: 'income', category: 'Restaurant', description: 'Corporate Event - Garden Area', amount: 12400, method: 'Card', status: 'pending' },
  { id: 'TXN008', date: '18 Dec', type: 'expense', category: 'Salary', description: 'Staff Monthly Wages', amount: 45000, method: 'Bank Transfer', status: 'completed' },
  { id: 'TXN009', date: '19 Dec', type: 'income', category: 'Room Booking', description: 'Neha Kapoor - Room 301 (3 nights)', amount: 25500, method: 'UPI', status: 'pending' },
  { id: 'TXN010', date: '19 Dec', type: 'expense', category: 'Maintenance', description: 'AC Repair - Room 202', amount: 3200, method: 'Cash', status: 'completed' },
];

export const vouchers = [
  { id: 'VCH001', date: '15 Dec', guest: 'R. Singh', type: 'Booking Voucher', amount: 12000, status: 'generated' },
  { id: 'VCH002', date: '16 Dec', guest: 'Ananya Gupta', type: 'Booking Voucher', amount: 18000, status: 'generated' },
  { id: 'VCH003', date: '15 Dec', guest: 'M. Sharma', type: 'Advance Receipt', amount: 2000, status: 'generated' },
  { id: 'VCH004', date: '19 Dec', guest: 'Neha Kapoor', type: 'Booking Voucher', amount: 25500, status: 'pending' },
];

/* ─────────── REPORTS DATA ─────────── */
export const nightAuditData = {
  date: '21 Dec 2026',
  totalRooms: 10,
  occupiedRooms: 8,
  vacancy: 2,
  totalRevenue: 41200,
  totalTax: 4944,
  totalDiscounts: 1200,
  netRevenue: 40000,
  cashCollected: 16480,
  upiCollected: 14420,
  cardCollected: 8240,
  pendingBalance: 2060,
};

/* ─────────── SETTINGS DATA ─────────── */
export const userRoles = [
  {
    id: 1, name: 'Hotel Manager', users: 2,
    permissions: { dashboard: true, calendar: true, pos: true, housekeeping: true, pricing: true, accounts: true, reports: true, settings: true },
  },
  {
    id: 2, name: 'Front Desk', users: 4,
    permissions: { dashboard: true, calendar: true, pos: false, housekeeping: false, pricing: false, accounts: false, reports: true, settings: false },
  },
  {
    id: 3, name: 'Restaurant Captain', users: 3,
    permissions: { dashboard: false, calendar: false, pos: true, housekeeping: false, pricing: false, accounts: false, reports: false, settings: false },
  },
  {
    id: 4, name: 'Housekeeper', users: 4,
    permissions: { dashboard: false, calendar: false, pos: false, housekeeping: true, pricing: false, accounts: false, reports: false, settings: false },
  },
  {
    id: 5, name: 'Accountant', users: 1,
    permissions: { dashboard: false, calendar: false, pos: false, housekeeping: false, pricing: false, accounts: true, reports: true, settings: false },
  },
];
