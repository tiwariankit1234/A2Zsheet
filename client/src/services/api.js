import axios from 'axios';

const TOKEN_KEY = 'a2z_token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
};

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalises every failure into an Error with a readable message and the HTTP status.
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    let message = err.response?.data?.error?.message;
    if (!message) {
      if (err.code === 'ECONNABORTED') message = 'The server took too long to respond.';
      else if (!err.response) message = 'Cannot reach the server. Is the API running?';
      else message = `Request failed (${status})`;
    }
    const e = new Error(message);
    e.status = status;
    return Promise.reject(e);
  }
);

const data = (p) => p.then((r) => r.data);

export const api = {
  health: () => data(http.get('/health')),
  meta: () => data(http.get('/meta')),
  topics: () => data(http.get('/topics')),
  problems: (params) => data(http.get('/problems', { params })),
  search: (q, params) => data(http.get('/problems/search', { params: { q, ...params } })),
  problem: (id) => data(http.get(`/problems/${id}`)),

  progress: () => data(http.get('/progress')),
  setProgress: (id, body) => data(http.put(`/progress/${id}`, body)),
  bookmarks: () => data(http.get('/bookmarks')),
  setBookmark: (id, bookmarked) => data(http.put(`/bookmarks/${id}`, { bookmarked })),

  guest: () => data(http.post('/auth/guest')),
  register: (body) => data(http.post('/auth/register', body)),
  login: (body) => data(http.post('/auth/login', body)),
  me: () => data(http.get('/auth/me')),
};
