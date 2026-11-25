import { invalidatePublicResources } from './resourceCache';
import { clearAdminSession, getAdminToken } from './adminSession';

export function normalizeApiBase(value) {
  const server = String(value || 'https://pinnawalagems.onrender.com').trim().replace(/\/+$/, '');
  return /\/api$/i.test(server) ? server : `${server}/api`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);
export const API_ORIGIN = API_BASE.replace(/\/api$/i, '');
export const resolveApiUrl = (base, path = '') => `${normalizeApiBase(base)}/${String(path).replace(/^\/?api(?:\/|$)/i, '').replace(/^\/+/, '')}`;
export const apiUrl = (path = '') => resolveApiUrl(API_BASE, path);

export class ApiError extends Error {
  constructor(message, status = 0, code = '') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Keep the deadline active through response parsing, not just the first headers.
export async function apiRequest(path, options = {}, { auth = true, timeout = 15000 } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener('abort', cancel, { once: true });
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const requestToken = auth ? getAdminToken() : null;
  if (auth) headers.set('Authorization', `Bearer ${requestToken || ''}`);
  try {
    const response = await fetch(apiUrl(path), { ...options, ...(auth ? { cache: 'no-store' } : {}), headers, signal: controller.signal });
    if (response.status === 401 && auth) clearAdminSession(requestToken);
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch { throw new ApiError('The configured service did not return JSON API data. Please check the backend address and deployment.', response.status, 'INVALID_RESPONSE'); }
    if (!response.ok) throw new ApiError(typeof data?.message === 'string' ? data.message : `The request failed (HTTP ${response.status}). Please try again.`, response.status);
    if (auth && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) invalidatePublicResources(path);
    return data;
  } catch (error) {
    if (timedOut) throw new ApiError('The request took too long. Your changes are still here; please try again.', 0, 'TIMEOUT');
    if (error.name === 'AbortError') throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError('The backend could not be reached. Check your connection and try again.', 0, 'CONNECTION');
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}

// The admin keeps its existing local filters, but always retrieves every server page.
export async function fetchAllRecords(endpoint, { signal } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
  try {
    const first = await apiRequest(`${endpoint}?limit=200&page=1`, { signal: controller.signal });
    if (Array.isArray(first)) return first;
    const pages = Number(first.totalPages || 1);
    if (!Array.isArray(first.stones) || !Number.isInteger(pages) || pages < 1 || pages > 10000) throw new ApiError('The inventory returned invalid pagination data. Please refresh or check the backend deployment.', 0, 'INVALID_RESPONSE');
    const stones = [...first.stones];
    for (let page = 2; page <= pages; page += 1) {
      const data = await apiRequest(`${endpoint}?limit=200&page=${page}`, { signal: controller.signal });
      if (!Array.isArray(data.stones)) throw new ApiError('A page of inventory could not be read. Please refresh to load the complete collection.', 0, 'INVALID_RESPONSE');
      stones.push(...data.stones);
    }
    const unique = [...new Map(stones.map((stone, index) => [stone._id || `record-${index}`, stone])).values()];
    if (Number.isFinite(Number(first.total)) && unique.length !== Number(first.total)) throw new ApiError('The inventory changed while it was loading. Refresh to retrieve the complete collection.', 0, 'STALE_PAGES');
    return unique;
  } catch (error) {
    if (timedOut) throw new ApiError('The complete inventory is taking too long to load. Please refresh; no partial inventory was applied.', 0, 'TIMEOUT');
    throw error;
  } finally { window.clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}

export const fetchAllGemstones = (options) => fetchAllRecords('/inventory/admin/stones', options);
