import { API_ORIGIN } from './api';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);
const ARCHIVE_PHOTO = '1783237563958.webp';

// Preserve an already-public archive photograph without relying on a visitor's
// localhost or a Render disk. The source bytes are retained unchanged.
export function publicMediaUrl(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) return '';
  const isUploadPath = /^\/uploads\//.test(source);
  let url;
  try { url = new URL(source); } catch { /* Local frontend paths stay local. */ }
  const isLegacyUpload = url && LOCAL_HOSTS.has(url.hostname.toLowerCase()) && /^\/uploads\//.test(url.pathname);
  if (!isUploadPath && !isLegacyUpload) return source;
  const pathname = isUploadPath ? source.split('?')[0] : url.pathname;
  const search = isUploadPath ? source.slice(pathname.length) : url.search;
  if (pathname === `/uploads/${ARCHIVE_PHOTO}` && !search) return '/images/perf-workshop-archive-original-1783237563958-v1.webp';
  return `${API_ORIGIN}${pathname}${search}`;
}
