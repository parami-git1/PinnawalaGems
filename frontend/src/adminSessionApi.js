import { apiRequest, ApiError } from './api';

export async function verifyAdminSession(token, signal) {
  const session = await apiRequest('/admin/session', {
    signal, cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
  }, { auth: false, timeout: 15000 });
  if (session?.admin?.role !== 'admin' || typeof session.admin.subject !== 'string' || !session.admin.subject.trim()
    || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
    throw new ApiError('The server could not verify this administrator session. Please sign in again.', 401, 'INVALID_ADMIN_SESSION');
  }
  return session;
}
