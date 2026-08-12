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
    name: 'WATER PARK COTTAGES',
    rooms: [
      { number: 101, clean: true, status: 'available' },
      { number: 102, clean: false, status: 'available' },
      { number: 103, clean: true, status: 'available' },
      { number: 104, clean: true, status: 'available' },
      { number: 105, clean: true, status: 'blocked' },
    ],
  },
  {
    name: 'PREMIUM VILLAS',
    rooms: [
      { number: 201, clean: true, status: 'available' },
      { number: 202, clean: true, status: 'ooo' },
      { number: 203, clean: false, status: 'available' },
    ],
  },
  {
    name: 'STANDARD ROOMS',
    rooms: [
      { number: 301, clean: true, status: 'available' },
      { number: 302, clean: true, status: 'available' },
    ],
  },
];

export const bookings = [
  {
    id: 1, roomNumber: 101, checkIn: '2026-12-15', checkOut: '2026-12-18',
    guestName: 'Rajesh Patel', pax: '2+1', plan: 'CP', source: 'AGODA',
    balance: 0, status: 'checked-in', rate: 5500, paid: 16500, total: 16500, advancePaid: 16500, tax: 1768, discount: 0,
  },
  {
    id: 2, roomNumber: 101, checkIn: '2026-12-19', checkOut: '2026-12-21',
    guestName: 'Priya Sharma', pax: '2', plan: 'EP', source: 'BOOKING.COM',
    balance: 4500, status: 'future', rate: 4500, paid: 4500, total: 9000, advancePaid: 4500, tax: 964, discount: 0,
  },
  {
    id: 3, roomNumber: 103, checkIn: '2026-12-15', checkOut: '2026-12-16',
    guestName: 'Amit Verma', pax: '1', plan: 'EP', source: 'WALK-IN',
    balance: 2000, status: 'hold', rate: 4500, paid: 2000, total: 4500, advancePaid: 2000, tax: 482, discount: 0,
  },
  {
    id: 4, roomNumber: 104, checkIn: '2026-12-16', checkOut: '2026-12-19',
    guestName: 'Neha Gupta', pax: '3', plan: 'AP', source: 'MMT',
    balance: 12000, status: 'checked-in', rate: 7000, paid: 9000, total: 21000, advancePaid: 5000, tax: 2250, discount: 0,
  },
  {
    id: 5, roomNumber: 201, checkIn: '2026-12-17', checkOut: '2026-12-20',
    guestName: 'Infosys Team', pax: '6 (3 Rms)', plan: 'AP', source: 'CORPORATE',
    balance: 0, status: 'future', rate: 10000, paid: 30000, total: 30000, advancePaid: 10000, tax: 3214, discount: 0,
  },
  {
    id: 6, roomNumber: 203, checkIn: '2026-12-15', checkOut: '2026-12-17',
    guestName: 'Vikram Joshi', pax: '2+2', plan: 'CP', source: 'AGODA',
    balance: 3200, status: 'checked-in', rate: 8500, paid: 13800, total: 17000, advancePaid: 5000, tax: 1821, discount: 0,
  },
  {
    id: 7, roomNumber: 301, checkIn: '2026-12-18', checkOut: '2026-12-21',
    guestName: 'Kavita Reddy', pax: '1', plan: 'EP', source: 'WALK-IN',
    balance: 0, status: 'future', rate: 3000, paid: 9000, total: 9000, advancePaid: 3000, tax: 964, discount: 0,
  },
];

export const housekeepingStats = { clean: 12, dirty: 2, ooo: 1, vacant: 2 };

export const todayStats = {
  arrivals: 5, departures: 3, inHouse: 18, vacant: 2,
  revenue: 12500, collected: 8000, discounts: 500,
};

export const posOrders = [
  { table: 10, items: 3, room: 101, guest: 'Rajesh Patel', status: 'live' },
  { table: 5, items: 2, room: null, guest: null, status: 'live' },
];

export const sidebarModules = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'calendar', label: 'Reservation Calendar', icon: 'CalendarDays' },
  { id: 'roomview', label: 'Room View', icon: 'DoorOpen' },
  { id: 'pos', label: 'Waterfront Restaurant', icon: 'UtensilsCrossed', sub: 'KOT & Billing' },
  { id: 'kitchen_inventory', label: 'Kitchen Inventory', icon: 'Boxes', sub: 'Stock & Recipe BOM' },
  { id: 'hk', label: 'Housekeeping', icon: 'SprayCan', sub: 'Task Assignment' },
  { id: 'pricing', label: 'Pricing / Rates', icon: 'DollarSign' },
  { id: 'accounts', label: 'Accounts & Finance', icon: 'Receipt' },
  { id: 'reports', label: 'Reports', icon: 'FileText', sub: 'Night Audit' },
  { id: 'waterpark', label: 'Ticket Counter', icon: 'Ticket', sub: 'Waterpark Booking' },
  { id: 'website_cms', label: 'Website CMS', icon: 'Globe', sub: 'Manage Website Content' },
  { id: 'settings', label: 'Settings', icon: 'Settings', sub: 'User Roles' },
];

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
  { label: 'Waterfront Restaurant', value: 65400, color: 'bg-emerald-500' },
  { label: 'Water Park Tickets', value: 34100, color: 'bg-amber-500' },
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

export const posAreas = ['Waterfront Dining', 'Rooftop Lounge', 'Poolside Cafe'];
export const posTables = [
  { id: 1, number: 1, area: 'Waterfront Dining', capacity: 4, status: 'vacant' },
  { id: 2, number: 2, area: 'Waterfront Dining', capacity: 2, status: 'occupied', kotCount: 2, guestName: 'Ravi Kumar', orderValue: 1240 },
  { id: 3, number: 3, area: 'Waterfront Dining', capacity: 6, status: 'billed', kotCount: 0, guestName: '', orderValue: 3400 },
  { id: 4, number: 4, area: 'Waterfront Dining', capacity: 4, status: 'vacant' },
  { id: 5, number: 5, area: 'Rooftop Lounge', capacity: 4, status: 'occupied', kotCount: 4, guestName: 'Ananya Jain', orderValue: 2100 },
  { id: 6, number: 6, area: 'Rooftop Lounge', capacity: 2, status: 'vacant' },
  { id: 7, number: 7, area: 'Rooftop Lounge', capacity: 6, status: 'occupied', kotCount: 1, guestName: 'Vikram Bhatt', orderValue: 890 },
  { id: 8, number: 8, area: 'Rooftop Lounge', capacity: 4, status: 'vacant' },
  { id: 9, number: 9, area: 'Poolside Cafe', capacity: 8, status: 'occupied', kotCount: 6, guestName: 'Birthday Party', orderValue: 12400 },
  { id: 10, number: 10, area: 'Poolside Cafe', capacity: 4, status: 'vacant' },
  { id: 11, number: 11, area: 'Poolside Cafe', capacity: 4, status: 'billed', kotCount: 0, guestName: '', orderValue: 1800 },
  { id: 12, number: 12, area: 'Poolside Cafe', capacity: 2, status: 'vacant' },
];

export const menuCategories = ['All', 'Starters', 'Soups', 'Main Course', 'Biryani', 'Breads', 'South Indian', 'Chinese', 'Beverages', 'Desserts', 'Thali'];
export const menuItems = [
  { id: 1, name: 'Paneer Tikka', category: 'Starters', price: 350, veg: true },
  { id: 2, name: 'Hara Bhara Kebab', category: 'Starters', price: 280, veg: true },
  { id: 3, name: 'Veg Spring Rolls', category: 'Starters', price: 250, veg: true },
  { id: 4, name: 'Aloo Tikki Chaat', category: 'Starters', price: 220, veg: true },
  { id: 5, name: 'Dahi Puri', category: 'Starters', price: 200, veg: true },
  { id: 6, name: 'Mushroom Tikka', category: 'Starters', price: 320, veg: true },
  { id: 7, name: 'Corn Cheese Balls', category: 'Starters', price: 260, veg: true },
  { id: 8, name: 'Chicken Tikka', category: 'Starters', price: 380, veg: false },
  { id: 9, name: 'Chicken 65', category: 'Starters', price: 360, veg: false },
  { id: 10, name: 'Tandoori Chicken (Half)', category: 'Starters', price: 420, veg: false },
  { id: 11, name: 'Chicken Malai Tikka', category: 'Starters', price: 400, veg: false },
  { id: 12, name: 'Fish Amritsari', category: 'Starters', price: 450, veg: false },
  { id: 13, name: 'Chilli Fish', category: 'Starters', price: 420, veg: false },
  { id: 14, name: 'Sweet Corn Soup', category: 'Soups', price: 180, veg: true },
  { id: 15, name: 'Tomato Soup', category: 'Soups', price: 160, veg: true },
  { id: 16, name: 'Chicken Clear Soup', category: 'Soups', price: 200, veg: false },
  { id: 17, name: 'Dal Makhani', category: 'Main Course', price: 380, veg: true },
  { id: 18, name: 'Dal Tadka', category: 'Main Course', price: 300, veg: true },
  { id: 19, name: 'Paneer Butter Masala', category: 'Main Course', price: 420, veg: true },
  { id: 20, name: 'Shahi Paneer', category: 'Main Course', price: 450, veg: true },
  { id: 21, name: 'Malai Kofta', category: 'Main Course', price: 400, veg: true },
  { id: 22, name: 'Mix Veg Curry', category: 'Main Course', price: 300, veg: true },
  { id: 23, name: 'Chana Masala', category: 'Main Course', price: 280, veg: true },
  { id: 24, name: 'Butter Chicken', category: 'Main Course', price: 480, veg: false },
  { id: 25, name: 'Chicken Curry', category: 'Main Course', price: 400, veg: false },
  { id: 26, name: 'Chicken Kadai', category: 'Main Course', price: 440, veg: false },
  { id: 27, name: 'Chicken Tikka Masala', category: 'Main Course', price: 460, veg: false },
  { id: 28, name: 'Mutton Rogan Josh', category: 'Main Course', price: 580, veg: false },
  { id: 29, name: 'Mutton Curry', category: 'Main Course', price: 520, veg: false },
  { id: 30, name: 'Fish Curry', category: 'Main Course', price: 480, veg: false },
  { id: 31, name: 'Prawn Masala', category: 'Main Course', price: 550, veg: false },
  { id: 32, name: 'Egg Curry', category: 'Main Course', price: 260, veg: false },
  { id: 33, name: 'Veg Biryani', category: 'Biryani', price: 350, veg: true },
  { id: 34, name: 'Chicken Biryani', category: 'Biryani', price: 420, veg: false },
  { id: 35, name: 'Mutton Biryani', category: 'Biryani', price: 520, veg: false },
  { id: 36, name: 'Egg Biryani', category: 'Biryani', price: 320, veg: false },
  { id: 37, name: 'Jeera Rice', category: 'Biryani', price: 160, veg: true },
  { id: 38, name: 'Steamed Rice', category: 'Biryani', price: 120, veg: true },
  { id: 39, name: 'Tandoori Roti', category: 'Breads', price: 40, veg: true },
  { id: 40, name: 'Butter Naan', category: 'Breads', price: 50, veg: true },
  { id: 41, name: 'Garlic Naan', category: 'Breads', price: 60, veg: true },
  { id: 42, name: 'Laccha Paratha', category: 'Breads', price: 50, veg: true },
  { id: 43, name: 'Aloo Paratha', category: 'Breads', price: 70, veg: true },
  { id: 44, name: 'Cheese Naan', category: 'Breads', price: 90, veg: true },
  { id: 45, name: 'Masala Dosa', category: 'South Indian', price: 220, veg: true },
  { id: 46, name: 'Plain Dosa', category: 'South Indian', price: 160, veg: true },
  { id: 47, name: 'Idli Sambhar', category: 'South Indian', price: 160, veg: true },
  { id: 48, name: 'Vada Sambhar', category: 'South Indian', price: 160, veg: true },
  { id: 49, name: 'Rava Dosa', category: 'South Indian', price: 200, veg: true },
  { id: 50, name: 'Uttapam', category: 'South Indian', price: 200, veg: true },
  { id: 51, name: 'Veg Manchurian', category: 'Chinese', price: 280, veg: true },
  { id: 52, name: 'Chicken Manchurian', category: 'Chinese', price: 360, veg: false },
  { id: 53, name: 'Veg Fried Rice', category: 'Chinese', price: 260, veg: true },
  { id: 54, name: 'Chicken Fried Rice', category: 'Chinese', price: 320, veg: false },
  { id: 55, name: 'Hakka Noodles', category: 'Chinese', price: 260, veg: true },
  { id: 56, name: 'Chicken Hakka Noodles', category: 'Chinese', price: 320, veg: false },
  { id: 57, name: 'Chilli Paneer (Dry)', category: 'Chinese', price: 340, veg: true },
  { id: 58, name: 'Schezwan Fried Rice', category: 'Chinese', price: 300, veg: true },
  { id: 59, name: 'Masala Chai', category: 'Beverages', price: 40, veg: true },
  { id: 60, name: 'Coffee', category: 'Beverages', price: 50, veg: true },
  { id: 61, name: 'Fresh Lime Soda', category: 'Beverages', price: 80, veg: true },
  { id: 62, name: 'Buttermilk (Chaas)', category: 'Beverages', price: 50, veg: true },
  { id: 63, name: 'Mango Lassi', category: 'Beverages', price: 120, veg: true },
  { id: 64, name: 'Sweet Lassi', category: 'Beverages', price: 100, veg: true },
  { id: 65, name: 'Coconut Water', category: 'Beverages', price: 60, veg: true },
  { id: 66, name: 'Cold Drink', category: 'Beverages', price: 50, veg: true },
  { id: 67, name: 'Fresh Juice', category: 'Beverages', price: 120, veg: true },
  { id: 68, name: 'Mocktail', category: 'Beverages', price: 150, veg: true },
  { id: 69, name: 'Gulab Jamun (2 pcs)', category: 'Desserts', price: 100, veg: true },
  { id: 70, name: 'Rasmalai', category: 'Desserts', price: 120, veg: true },
  { id: 71, name: 'Ice Cream (Scoop)', category: 'Desserts', price: 60, veg: true },
  { id: 72, name: 'Kulfi', category: 'Desserts', price: 80, veg: true },
  { id: 73, name: 'Gajar Halwa', category: 'Desserts', price: 100, veg: true },
  { id: 74, name: 'Phirni', category: 'Desserts', price: 80, veg: true },
  { id: 75, name: 'Brownie with Ice Cream', category: 'Desserts', price: 180, veg: true },
  { id: 76, name: 'Veg Thali', category: 'Thali', price: 650, veg: true },
  { id: 77, name: 'Non-Veg Thali', category: 'Thali', price: 850, veg: false },
  { id: 78, name: 'Gujarati Thali', category: 'Thali', price: 700, veg: true },
];

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

export const pricingRates = [
  { category: 'Water Park Cottage', baseRate: 4500, ep: 4500, cp: 5500, ap: 7000 },
  { category: 'Premium Villa', baseRate: 7500, ep: 7500, cp: 8500, ap: 10000 },
  { category: 'Standard Room', baseRate: 3000, ep: 3000, cp: 3800, ap: 5000 },
];

export const pricingCalendar = dates.map((date, i) => ({
  date,
  categories: [
    { name: 'Water Park Cottage', rate: 4500 + (i % 3 === 0 ? 500 : 0), available: i !== 2 },
    { name: 'Premium Villa', rate: 7500 + (i % 2 === 0 ? 800 : 0), available: true },
    { name: 'Standard Room', rate: 3000, available: i !== 4 },
  ],
}));

export const folioCharges = [
  { id: 'FCH1', bookingRef: 1, type: 'room_charge', description: 'Room Rent (3 nights - Water Park Cottage)', amount: 16500, quantity: 1 },
  { id: 'FCH2', bookingRef: 1, type: 'restaurant', description: 'Dinner - Room Service (Table 5)', amount: 2400, quantity: 1 },
  { id: 'FCH3', bookingRef: 1, type: 'laundry', description: 'Wash & Fold - 3 pieces', amount: 450, quantity: 1 },
  { id: 'FCH4', bookingRef: 4, type: 'room_charge', description: 'Room Rent (3 nights - Premium Villa)', amount: 21000, quantity: 1 },
  { id: 'FCH5', bookingRef: 4, type: 'restaurant', description: 'Breakfast Buffet × 3', amount: 1800, quantity: 3 },
  { id: 'FCH6', bookingRef: 6, type: 'room_charge', description: 'Room Rent (2 nights - Premium Villa)', amount: 17000, quantity: 1 },
];

export const transactions = [
  { id: 'TXN001', date: '15 Dec', type: 'income', category: 'Room Booking', description: 'Rajesh Patel - Cottage 101 (3 nights)', amount: 13500, method: 'UPI', status: 'completed' },
  { id: 'TXN002', date: '15 Dec', type: 'income', category: 'Restaurant', description: 'Table 5 - Dinner', amount: 2340, method: 'Card', status: 'completed' },
  { id: 'TXN003', date: '16 Dec', type: 'expense', category: 'Supplies', description: 'Kitchen Groceries Purchase', amount: 8500, method: 'Cash', status: 'completed' },
  { id: 'TXN004', date: '16 Dec', type: 'income', category: 'Room Booking', description: 'Neha Gupta - Premium Villa 104 (3 nights)', amount: 22500, method: 'UPI', status: 'completed' },
  { id: 'TXN005', date: '17 Dec', type: 'income', category: 'Other Services', description: 'Water Park Entry - Room 101', amount: 1200, method: 'Cash', status: 'completed' },
  { id: 'TXN006', date: '17 Dec', type: 'expense', category: 'Utilities', description: 'Electricity Bill Payment', amount: 12500, method: 'Bank Transfer', status: 'completed' },
  { id: 'TXN007', date: '18 Dec', type: 'income', category: 'Restaurant', description: 'Poolside Party - Garden Area', amount: 12400, method: 'Card', status: 'pending' },
  { id: 'TXN008', date: '18 Dec', type: 'expense', category: 'Salary', description: 'Staff Monthly Wages', amount: 45000, method: 'Bank Transfer', status: 'completed' },
  { id: 'TXN009', date: '19 Dec', type: 'income', category: 'Room Booking', description: 'Kavita Reddy - Standard Room 301 (3 nights)', amount: 9000, method: 'UPI', status: 'pending' },
  { id: 'TXN010', date: '19 Dec', type: 'expense', category: 'Maintenance', description: 'Water Slide Repair - Pool 2', amount: 3200, method: 'Cash', status: 'completed' },
];

export const vouchers = [
  { id: 'VCH001', date: '15 Dec', guest: 'Rajesh Patel', type: 'Booking Voucher', amount: 13500, status: 'generated' },
  { id: 'VCH002', date: '16 Dec', guest: 'Neha Gupta', type: 'Booking Voucher', amount: 22500, status: 'generated' },
  { id: 'VCH003', date: '15 Dec', guest: 'Amit Verma', type: 'Advance Receipt', amount: 2000, status: 'generated' },
  { id: 'VCH004', date: '19 Dec', guest: 'Kavita Reddy', type: 'Booking Voucher', amount: 9000, status: 'pending' },
];

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

export const userRoles = [
  {
    id: 1, name: 'General Manager', users: 2,
    permissions: { dashboard: true, calendar: true, pos: true, housekeeping: true, pricing: true, accounts: true, reports: true, settings: true },
  },
  {
    id: 2, name: 'Front Desk Staff', users: 4,
    permissions: { dashboard: true, calendar: true, pos: false, housekeeping: false, pricing: false, accounts: false, reports: true, settings: false },
  },
  {
    id: 3, name: 'Restaurant Captain', users: 3,
    permissions: { dashboard: false, calendar: false, pos: true, housekeeping: false, pricing: false, accounts: false, reports: false, settings: false },
  },
  {
    id: 4, name: 'Housekeeping Staff', users: 4,
    permissions: { dashboard: false, calendar: false, pos: false, housekeeping: true, pricing: false, accounts: false, reports: false, settings: false },
  },
  {
    id: 5, name: 'Accountant', users: 1,
    permissions: { dashboard: false, calendar: false, pos: false, housekeeping: false, pricing: false, accounts: true, reports: true, settings: false },
  },
  {
    id: 6, name: 'Head Chef / Kitchen Staff', users: 2,
    permissions: { dashboard: false, calendar: false, pos: true, kitchen_inventory: true, housekeeping: false, pricing: false, accounts: false, reports: false, settings: false },
  },
];

export const mockSuppliers = [
  { id: 'SUP01', name: 'Fresh Dairy & Farms', phone: '+91 98765 43210', email: 'orders@freshdairy.com', address: 'Plot 12, MIDC Industrial Area', gstin: '27AAAAA0000A1Z5' },
  { id: 'SUP02', name: 'Metro Cash & Carry', phone: '+91 98111 22334', email: 'b2b@metro.co.in', address: 'Sector 18, Commercial Hub', gstin: '27BBBBB1111B2Z6' },
  { id: 'SUP03', name: 'Royal Spice Traders', phone: '+91 97222 33445', email: 'sales@royalspices.com', address: 'Spices Market, Old Town', gstin: '27CCCCC2222C3Z7' },
];

export const mockInventoryItems = [
  { id: 'INV-101', sku: 'RAW-001', name: 'Paneer (Fresh Cottage Cheese)', category: 'Dairy', unit: 'kg', currentStock: 4.5, minStockLevel: 5.0, unitCost: 320, supplier: 'Fresh Dairy & Farms', batchNumber: 'BAT-2026-881', expiryDate: '2026-08-15' },
  { id: 'INV-102', sku: 'RAW-002', name: 'Tomato Puree', category: 'Vegetables', unit: 'kg', currentStock: 12.0, minStockLevel: 4.0, unitCost: 80, supplier: 'Metro Cash & Carry', batchNumber: 'BAT-2026-412', expiryDate: '2026-09-30' },
  { id: 'INV-103', sku: 'RAW-003', name: 'Refined Cooking Oil', category: 'Dry Pantry', unit: 'L', currentStock: 25.0, minStockLevel: 10.0, unitCost: 140, supplier: 'Metro Cash & Carry', batchNumber: 'BAT-2026-104', expiryDate: '2027-01-15' },
  { id: 'INV-104', sku: 'RAW-004', name: 'Basmati Rice (Premium)', category: 'Dry Pantry', unit: 'kg', currentStock: 45.0, minStockLevel: 15.0, unitCost: 110, supplier: 'Metro Cash & Carry', batchNumber: 'BAT-2026-090', expiryDate: '2027-06-30' },
  { id: 'INV-105', sku: 'RAW-005', name: 'Fresh Whole Milk', category: 'Dairy', unit: 'L', currentStock: 8.0, minStockLevel: 10.0, unitCost: 65, supplier: 'Fresh Dairy & Farms', batchNumber: 'BAT-2026-902', expiryDate: '2026-08-14' },
  { id: 'INV-106', sku: 'RAW-006', name: 'Amul Butter', category: 'Dairy', unit: 'kg', currentStock: 3.2, minStockLevel: 2.0, unitCost: 540, supplier: 'Fresh Dairy & Farms', batchNumber: 'BAT-2026-310', expiryDate: '2026-08-20' },
  { id: 'INV-107', sku: 'RAW-007', name: 'Chicken (Bone-in)', category: 'Meat', unit: 'kg', currentStock: 15.0, minStockLevel: 8.0, unitCost: 220, supplier: 'Fresh Meat Supplies', batchNumber: 'BAT-2026-551', expiryDate: '2026-08-16' },
  { id: 'INV-108', sku: 'RAW-008', name: 'Garam Masala Blend', category: 'Spices', unit: 'g', currentStock: 850.0, minStockLevel: 500.0, unitCost: 0.8, supplier: 'Royal Spice Traders', batchNumber: 'BAT-2026-112', expiryDate: '2027-03-31' },
];

export const mockRecipes = [
  {
    menuItemName: 'Paneer Butter Masala',
    sellingPrice: 340,
    ingredients: [
      { inventoryItemId: 'INV-101', name: 'Paneer (Fresh Cottage Cheese)', qty: 0.2, unit: 'kg' },
      { inventoryItemId: 'INV-102', name: 'Tomato Puree', qty: 0.1, unit: 'kg' },
      { inventoryItemId: 'INV-106', name: 'Amul Butter', qty: 0.03, unit: 'kg' },
      { inventoryItemId: 'INV-108', name: 'Garam Masala Blend', qty: 10, unit: 'g' },
    ],
  },
  {
    menuItemName: 'Chicken Biryani',
    sellingPrice: 420,
    ingredients: [
      { inventoryItemId: 'INV-107', name: 'Chicken (Bone-in)', qty: 0.25, unit: 'kg' },
      { inventoryItemId: 'INV-104', name: 'Basmati Rice (Premium)', qty: 0.2, unit: 'kg' },
      { inventoryItemId: 'INV-103', name: 'Refined Cooking Oil', qty: 0.05, unit: 'L' },
    ],
  },
];

export const mockInventoryTransactions = [
  { id: 'TX-1001', date: '2026-08-12 10:30 AM', type: 'purchase_in', item: 'Paneer (Fresh Cottage Cheese)', qty: '+10.0 kg', cost: '₹3,200', ref: 'INV-9941', reason: 'Weekly Purchase' },
  { id: 'TX-1002', date: '2026-08-12 01:15 PM', type: 'pos_deduction', item: 'Paneer (Fresh Cottage Cheese)', qty: '-0.6 kg', cost: '₹192', ref: 'KOT-3', reason: 'POS Order: 3x Paneer Butter Masala' },
  { id: 'TX-1003', date: '2026-08-12 04:00 PM', type: 'wastage', item: 'Fresh Whole Milk', qty: '-2.0 L', cost: '₹130', ref: 'WST-12', reason: 'Spoiled due to fridge power glitch' },
];

export const mockAudits = [
  {
    id: 'AUD-8801',
    auditNumber: 'AUD-8801',
    date: '2026-08-10',
    status: 'reconciled',
    notes: 'Weekly Kitchen Physical Stock Audit',
    items: [
      { itemId: 'INV-101', name: 'Paneer (Fresh Cottage Cheese)', systemQty: 6.0, physicalQty: 4.5, variance: -1.5, unit: 'kg', costLoss: 480, reason: 'Over-portioning in dinner service' },
      { itemId: 'INV-105', name: 'Fresh Whole Milk', systemQty: 10.0, physicalQty: 8.0, variance: -2.0, unit: 'L', costLoss: 130, reason: 'Spoilage' },
    ],
  },
];

export const mockPurchaseOrders = [
  {
    id: 'PO-9001',
    poNumber: 'PO-9001',
    date: '2026-08-11',
    supplier: 'Fresh Dairy & Farms',
    status: 'approved',
    totalAmount: 4850,
    expectedDate: '2026-08-14',
    items: [
      { itemId: 'INV-101', name: 'Paneer (Fresh Cottage Cheese)', qty: 10, unit: 'kg', unitPrice: 320, total: 3200 },
      { itemId: 'INV-105', name: 'Fresh Whole Milk', qty: 25, unit: 'L', unitPrice: 65, total: 1625 },
    ],
  },
];

