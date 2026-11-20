// This is a public route identifier, never an authentication secret.
export const DEFAULT_ADMIN_PORTAL_PATH = '/workspace/pg-0d221cf9d8b8c1683d22fdea';

export function normalizeAdminPortalPath(value) {
  const path = typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
  return /^\/workspace\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path) && path.length <= 200
    ? path : DEFAULT_ADMIN_PORTAL_PATH;
}

export const ADMIN_PORTAL_PATH = normalizeAdminPortalPath(import.meta.env.VITE_ADMIN_PORTAL_PATH);
export const ADMIN_LOGIN_PATH = `${ADMIN_PORTAL_PATH}/sign-in`;

export function safeAdminReturnPath(from) {
  const candidate = typeof from === 'string' ? from
    : from && typeof from.pathname === 'string' ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '';
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return ADMIN_PORTAL_PATH;
  try {
    const origin = typeof window === 'undefined' ? 'https://local.invalid' : window.location.origin;
    const url = new URL(candidate, origin);
    if (url.origin !== origin || url.pathname === ADMIN_LOGIN_PATH
      || !(url.pathname === ADMIN_PORTAL_PATH || url.pathname.startsWith(`${ADMIN_PORTAL_PATH}/`))) return ADMIN_PORTAL_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return ADMIN_PORTAL_PATH; }
}
