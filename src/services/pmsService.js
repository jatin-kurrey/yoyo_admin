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
  addKOT: (data) => api.pms.post('/pos/tables/kot', data),
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
};
