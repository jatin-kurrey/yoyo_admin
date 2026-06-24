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
  occupyTable: (id, guestName) => api.pms.post(`/pos/tables/${id}/occupy`, { guest_name: guestName }),
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
};
