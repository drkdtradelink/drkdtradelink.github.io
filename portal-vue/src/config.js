// API Base URL environment configuration
// Testing / Development: http://localhost:3000
// Production: https://drkdtradelink-github-io.onrender.com

const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const mode = import.meta.env.MODE;

export const PROD_API_URL = 'https://drkdtradelink-github-io.onrender.com';
export const DEV_API_URL = 'http://localhost:3000';

export const API_BASE_URL = (envApiUrl !== undefined && envApiUrl !== '')
  ? envApiUrl
  : (mode === 'production' ? PROD_API_URL : DEV_API_URL);

/**
 * Returns full API URL for a given relative path.
 * E.g., getApiUrl('/api/auth/login') -> 'https://drkdtradelink-github-io.onrender.com/api/auth/login'
 */
export function getApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
