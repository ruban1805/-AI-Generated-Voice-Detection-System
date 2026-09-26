/**
 * API Configuration helper
 * Supports both same-origin deployments (like Cloud Run or Vite dev)
 * and decoupled frontend hosting (like Netlify or Vercel pointing to a backend API).
 */
export const API_BASE: string = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
