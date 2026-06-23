const VITE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const PMS_BASE = import.meta.env.VITE_PMS_API_URL || `${VITE_API_URL}/pms`;
const ADMIN_BASE = VITE_API_URL.endsWith('/admin') ? VITE_API_URL : `${VITE_API_URL}/admin`;
const PUBLIC_BASE = VITE_API_URL;

function getToken() {
  return localStorage.getItem('yoyo_admin_token');
}

function setToken(token) {
  localStorage.setItem('yoyo_admin_token', token);
}

function clearToken() {
  localStorage.removeItem('yoyo_admin_token');
}

async function request(base, method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = getToken();
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`;
  }
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, opts);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  pms: {
    get: (path) => request(PMS_BASE, 'GET', path),
    post: (path, body) => request(PMS_BASE, 'POST', path, body),
    patch: (path, body) => request(PMS_BASE, 'PATCH', path, body),
    delete: (path) => request(PMS_BASE, 'DELETE', path),
  },
  admin: {
    get: (path) => request(ADMIN_BASE, 'GET', path),
    post: (path, body) => request(ADMIN_BASE, 'POST', path, body),
  },
  public: {
    get: (path) => request(PUBLIC_BASE, 'GET', path),
  },
  login: async (email, password) => {
    const res = await fetch(`${ADMIN_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.data.token);
    }
    return data;
  },
  logout: async () => {
    try { await request(ADMIN_BASE, 'POST', '/auth/logout'); } catch {}
    clearToken();
  },
  getMe: () => request(ADMIN_BASE, 'GET', '/auth/me'),
  getToken,
  setToken,
  clearToken,
};
