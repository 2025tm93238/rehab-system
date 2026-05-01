import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Attach the JWT (if any) to every outgoing request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the token and bounce to /login. The hard redirect (rather
// than going through the React router) is intentional — it cleanly resets
// any in-flight component state that was relying on the now-invalid token.
// The pathname check prevents redirect loops when /login itself 401s
// (e.g. on a wrong password — that error should surface inline).
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const onAuthRoute =
        window.location.pathname === '/login' ||
        window.location.pathname === '/signup';
      const isAuthEndpoint = error.config?.url?.startsWith('/auth/');
      if (!onAuthRoute && !isAuthEndpoint) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
