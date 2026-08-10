import axios from 'axios';

// withCredentials: true means the browser sends/receives the httpOnly cookies
// (access_token / refresh_token) that auth-service sets. This is why CORS on
// every backend must set credentials:true and echo the exact origin.
export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

export const mainApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MAIN_API_URL || 'http://localhost:5001',
  withCredentials: true,
});

// AI + file endpoints are reached THROUGH the main backend's proxy
// (/api/proxy/...), so the browser only ever talks to two hosts: auth-service
// and main-service. Swap to a direct ai-storage URL later if you want the
// frontend to bypass the gateway for large file uploads.
export const aiApi = {
  chat: (payload: { messages: { role: string; content: string }[] }) =>
    mainApi.post('/api/proxy/api/ai/chat', payload),
  analyze: (payload: { input: string; instructions?: string }) =>
    mainApi.post('/api/proxy/api/ai/analyze', payload),
};

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return mainApi.post('/api/proxy/api/files/upload', form, {
      headers: { 'content-type': 'multipart/form-data' },
    });
  },
  list: () => mainApi.get('/api/proxy/api/files'),
};

let refreshing: Promise<unknown> | null = null;

// One shared 401 interceptor: on the first 401, try /refresh once and replay
// the original request. Avoids a stampede of parallel refresh calls.
mainApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing = refreshing || authApi.post('/api/auth/refresh');
        await refreshing;
        refreshing = null;
        return mainApi(original);
      } catch (refreshErr) {
        refreshing = null;
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}
