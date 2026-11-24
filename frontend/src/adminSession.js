const TOKEN_KEY = 'adminToken';
const CHANGE_EVENT = 'pinnawala:admin-session';
let verified = null;

export function getAdminToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function subscribeAdminSession(callback) {
  const storage = (event) => {
    if (event.key !== TOKEN_KEY && event.key !== null) return;
    verified = null;
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', storage);
  return () => { window.removeEventListener(CHANGE_EVENT, callback); window.removeEventListener('storage', storage); };
}

export function setAdminToken(token) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('The server did not return an administrator session.');
  try { localStorage.setItem(TOKEN_KEY, token); }
  catch { throw new Error('Your browser could not store this session. Allow site storage and try again.'); }
  verified = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// An earlier failed request must never sign out a newer login.
export function clearAdminSession(expectedToken) {
  if (expectedToken !== undefined && getAdminToken() !== expectedToken) return false;
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* Storage may already be unavailable. */ }
  verified = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

export function rememberVerifiedAdminSession(token, session) {
  if (token !== getAdminToken()) return;
  verified = { token, session, checkedAt: Date.now() };
}

export function getVerifiedAdminSession(token) {
  return verified?.token === token && verified.session.expiresAt > Date.now()
    && Date.now() - verified.checkedAt < 60000 ? verified.session : null;
}
