import axios from 'axios';

// Auth lives in an HttpOnly cookie. Nothing sensitive is stored in JS-accessible storage.
export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 60000 });

let csrfPromise = null;
const readCookie = (name) => document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))?.split('=')[1];
async function csrfToken() {
  let t = readCookie('fluento_csrf');
  if (!t) { csrfPromise ??= api.get('/csrf').finally(() => { csrfPromise = null; }); await csrfPromise; t = readCookie('fluento_csrf'); }
  return t;
}

api.interceptors.request.use(async (config) => {
  if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    config.headers['X-CSRF-Token'] = await csrfToken();
  }
  return config;
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
api.interceptors.response.use((r) => r, (error) => {
  const status = error.response?.status;
  const code = error.response?.data?.error?.code;
  if (status === 401 && code === 'SESSION_EXPIRED') onUnauthorized();
  return Promise.reject(error);
});

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  const e = err?.response?.data?.error;
  if (e?.details && typeof e.details === 'object') {
    const first = Object.values(e.details).flat()[0];
    if (first) return String(first);
  }
  return e?.message || fallback;
}

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data.user),
  login: (d) => api.post('/auth/login', d).then((r) => r.data.user),
  register: (d) => api.post('/auth/register', d).then((r) => r.data.user),
  logout: () => api.post('/auth/logout'),
  forgot: (d) => api.post('/auth/forgot-password', d).then((r) => r.data),
  reset: (d) => api.post('/auth/reset-password', d).then((r) => r.data),
};
export const practiceApi = {
  create: (formData, onUploadProgress) => api.post('/practice', formData, { onUploadProgress, timeout: 180000 }).then((r) => r.data),
  list: (params) => api.get('/practice', { params }).then((r) => r.data),
  get: (id) => api.get(`/practice/${id}`).then((r) => r.data.session),
  status: (id) => api.get(`/practice/${id}/status`).then((r) => r.data),
  remove: (id) => api.delete(`/practice/${id}`),
  audioUrl: (id) => `/api/practice/${id}/audio`,
};
export const dashApi = {
  overview: () => api.get('/dashboard/overview').then((r) => r.data),
  analytics: (days = 30) => api.get('/dashboard/analytics', { params: { days } }).then((r) => r.data),
};
export const improvementApi = {
  get: () => api.get('/improvement').then((r) => r.data.plan),
  generate: () => api.post('/improvement/plan', {}, { timeout: 120000 }).then((r) => r.data.plan),
  toggle: (id, completed) => api.patch(`/improvement/tasks/${id}`, { completed }).then((r) => r.data.plan),
};
export const profileApi = {
  update: (d) => api.patch('/profile', d).then((r) => r.data.user),
  password: (d) => api.patch('/profile/password', d).then((r) => r.data),
  remove: (d) => api.delete('/profile', { data: d }),
};
