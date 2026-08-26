import { api } from './api';

export const pmsService = {
  getDashboardStats: () => api.pms.get('/dashboard/stats'),

  getBookings: (params) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', params.page);
    if (params?.limit) q.set('limit', params.limit);
    return api.pms.get(`/bookings?${q.toString()}`);
  },
  getBooking: (id) => api.pms.get(`/bookings/${id}`),
  createBooking: (data) => api.pms.post('/bookings', data),
  checkIn: (id) => api.pms.patch(`/bookings/${id}/check-in`),
  checkOut: (id) => api.pms.patch(`/bookings/${id}/check-out`),
  cancelBooking: (id) => api.pms.delete(`/bookings/${id}`),

  getFolio: (id) => api.pms.get(`/bookings/${id}/folio`),
  addFolioEntry: (id, data) => api.pms.post(`/bookings/${id}/folio`, data),
  addPayment: (id, data) => api.pms.post(`/bookings/${id}/payments`, data),

  getRooms: () => api.pms.get('/rooms'),

  getPOSTables: () => api.pms.get('/pos/tables'),
  occupyTable: (id, guestName, guestPhone) => api.pms.post(`/pos/tables/${id}/occupy`, { guest_name: guestName, guest_phone: guestPhone }),
  addKOT: (tableId, data) => api.pms.post(`/pos/tables/${tableId}/kot`, data),
  generateBill: (id) => api.pms.post(`/pos/tables/${id}/bill`),
  vacateTable: (id) => api.pms.post(`/pos/tables/${id}/vacate`),
  moveToRoom: (id, bookingId) => api.pms.post(`/pos/tables/${id}/move-to-room`, { booking_id: bookingId }),
  getKOTs: (id) => api.pms.get(`/pos/tables/${id}/kots`),

  getHKTasks: (status) => api.pms.get(`/housekeeping/tasks${status ? `?status=${status}` : ''}`),
  createHKTask: (data) => api.pms.post('/housekeeping/tasks', data),
  updateHKTask: (id, status) => api.pms.patch(`/housekeeping/tasks/${id}`, { status }),
  setRoomClean: (id) => api.pms.patch(`/housekeeping/rooms/${id}/clean`),
  setRoomDirty: (id) => api.pms.patch(`/housekeeping/rooms/${id}/dirty`),
  setRoomOOO: (id, reason) => api.pms.patch(`/housekeeping/rooms/${id}/ooo`, { reason }),
  setRoomAvailable: (id) => api.pms.patch(`/housekeeping/rooms/${id}/available`),

  getCategories: () => api.pms.get('/categories'),
  updateRates: (id, basePrice) => api.pms.patch(`/categories/${id}/rates`, { base_price: basePrice }),

  getMenuItems: () => api.public.get('/restaurant/items'),

  getTransactions: (params) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.status) q.set('status', params.status);
    return api.pms.get(`/transactions?${q.toString()}`);
  },
  createTransaction: (data) => api.pms.post('/transactions', data),
  deleteTransaction: (id) => api.pms.delete(`/transactions/${id}`),

  getSettings: () => api.pms.get('/settings'),
  upsertSetting: (key, value) => api.pms.post('/settings', { key, value }),

  getRateOverrides: (categoryId) => api.pms.get(`/rate-overrides${categoryId ? `?category_id=${categoryId}` : ''}`),
  setRateOverride: (data) => api.pms.post('/rate-overrides', data),
  clearRateOverride: (data) => api.pms.post('/rate-overrides/clear', data),

  getSystemStats: () => api.pms.get('/system/stats'),
  backupSystem: () => api.pms.get('/system/backup'),
  restoreSystem: (data) => api.pms.post('/system/restore', data),
  resetSystem: () => api.pms.post('/system/reset'),

  // Waterpark Counter Bookings & Stats
  createCounterBooking: (data) => api.admin.post('/bookings', data),
  getAdminTickets: () => api.admin.get('/tickets'),
  getAdminBookings: () => api.admin.get('/bookings'),
  getAdminDashboardStats: () => api.admin.get('/dashboard/stats'),

  // CMS endpoints
  getHeroSlides: () => api.admin.get('/hero-slides'),
  createHeroSlide: (data) => api.admin.post('/hero-slides', data),
  updateHeroSlide: (id, data) => api.admin.patch(`/hero-slides/${id}`, data),
  deleteHeroSlide: (id) => api.admin.delete(`/hero-slides/${id}`),

  getAttractions: () => api.admin.get('/attractions'),
  createAttraction: (data) => api.admin.post('/attractions', data),
  updateAttraction: (id, data) => api.admin.patch(`/attractions/${id}`, data),
  deleteAttraction: (id) => api.admin.delete(`/attractions/${id}`),

  createTicket: (data) => api.admin.post('/tickets', data),
  updateTicket: (id, data) => api.admin.patch(`/tickets/${id}`, data),
  deleteTicket: (id) => api.admin.delete(`/tickets/${id}`),
  toggleTicketStatus: (id) => api.admin.patch(`/tickets/${id}/toggle-status`),

  getGallery: () => api.admin.get('/gallery'),
  createGalleryItem: (data) => api.admin.post('/gallery', data),
  updateGalleryItem: (id, data) => api.admin.patch(`/gallery/${id}`, data),
  deleteGalleryItem: (id) => api.admin.delete(`/gallery/${id}`),

  getContentPages: () => api.admin.get('/content'),
  updateContentPage: (slug, data) => api.admin.patch(`/content/${slug}`, data),

  // POS Tables Management
  createPOSTable: (data) => api.pms.post('/pos/tables', data),
  updatePOSTable: (id, data) => api.pms.patch(`/pos/tables/${id}`, data),
  deletePOSTable: (id) => api.pms.delete(`/pos/tables/${id}`),

  // Restaurant Menu Items Management
  getAdminMenuItems: () => api.admin.get('/restaurant/items'),
  createMenuItem: (data) => api.admin.post('/restaurant/items', data),
  updateMenuItem: (id, data) => api.admin.patch(`/restaurant/items/${id}`, data),
  deleteMenuItem: (id) => api.admin.delete(`/restaurant/items/${id}`),

  // Waterpark Costume & Locker Management
  searchWaterparkCustomers: (q) => api.pms.get(`/waterpark/customers/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  syncWaterparkCustomer: (data) => api.pms.post('/waterpark/customers/sync', data),
  getLockers: () => api.pms.get('/waterpark/lockers'),
  createLocker: (data) => api.pms.post('/waterpark/lockers', data),
  getCostumes: () => api.pms.get('/waterpark/costumes'),
  createCostume: (data) => api.pms.post('/waterpark/costumes', data),
  issueLockerAndCostumes: (data) => api.pms.post('/waterpark/issues', data),
  returnLockerAndCostumes: (id, data) => api.pms.post(`/waterpark/issues/${id}/return`, data),
  getWaterparkIssues: () => api.pms.get('/waterpark/issues'),
};
