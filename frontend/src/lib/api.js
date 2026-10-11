// API Client Configuration with Automatic Bearer Token Attachment
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const trimmed = envUrl.trim().replace(/\/$/, '');
  // Ensure the base url points to the /api route prefix
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = getBaseUrl();

export async function fetchApi(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Automatically attach Bearer token from localStorage in client-side environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => fetchApi(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options = {}) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options = {}) => fetchApi(endpoint, { method: 'DELETE', ...options }),
};

export default api;
