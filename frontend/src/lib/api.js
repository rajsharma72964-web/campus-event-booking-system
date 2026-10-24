// API Client Configuration with Automatic Bearer Token Attachment
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const trimmed = envUrl.trim().replace(/\/$/, '');
  // Ensure the base url points to the /api route prefix
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = getBaseUrl();

// Helper to retrieve token from localStorage or cookie with validation
export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    let token = localStorage.getItem('token');
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(/(^|;)\s*token\s*=\s*([^;]+)/);
      if (match) token = decodeURIComponent(match[2]);
    }
    if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
      return token.trim();
    }
  } catch (err) {
    console.error('Error reading stored token:', err);
  }
  return null;
};

export async function fetchApi(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Automatically attach Bearer token if not explicitly provided
  const token = getStoredToken();
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Global 401 handler: dispatch custom event if token is rejected on authenticated routes
  if (
    response.status === 401 &&
    !cleanEndpoint.includes('/auth/login') &&
    !cleanEndpoint.includes('/auth/register')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }

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
