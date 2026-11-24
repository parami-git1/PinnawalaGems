import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_LOGIN_PATH } from './adminPaths';
import { clearAdminSession, getAdminToken, getVerifiedAdminSession, rememberVerifiedAdminSession, subscribeAdminSession } from './adminSession';
import { verifyAdminSession } from './adminSessionApi';
import { AdminAccessLockContext } from './adminAccessContext';
import './AdminAccess.css';

export function AdminBoundary() {
  useEffect(() => {
    const previous = document.querySelector('meta[name="robots"]');
    const content = previous?.getAttribute('content');
    const meta = previous || document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow, noarchive, nosnippet';
    if (!previous) document.head.appendChild(meta);
    return () => { if (!previous) meta.remove(); else if (content === null) meta.removeAttribute('content'); else meta.content = content; };
  }, []);
  return <Outlet />;
}

export function AdminProtectedRoute() {
  const location = useLocation();
  const token = useSyncExternalStore(subscribeAdminSession, getAdminToken, () => '');
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ token: '', status: 'checking', session: null });
  useEffect(() => {
    if (!token) return undefined;
    let mounted = true;
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (!mounted) return;
      setResult((previous) => {
        const session = previous.token === token ? previous.session : null;
        return { token, status: session && previous.status !== 'error' && previous.status !== 'checking' ? 'revalidating' : 'checking', session };
      });
      try {
        const cached = getVerifiedAdminSession(token);
        const session = cached || await verifyAdminSession(token, controller.signal);
        if (!mounted || getAdminToken() !== token) return;
        if (!cached) rememberVerifiedAdminSession(token, session);
        setResult({ token, status: 'authenticated', session });
      } catch (error) {
        if (!mounted || controller.signal.aborted || getAdminToken() !== token) return;
        if ([401, 403].includes(error.status)) { clearAdminSession(token); return; }
        setResult((previous) => ({ token, status: 'error', session: previous.token === token ? previous.session : null }));
      }
    });
    return () => { mounted = false; controller.abort(); };
  }, [token, revision]);

  const hasVerifiedSession = result.token === token && Boolean(result.session);
  const permitted = hasVerifiedSession && ['authenticated', 'revalidating'].includes(result.status);
  const expiresAt = hasVerifiedSession ? result.session.expiresAt : null;
  const failed = result.token === token && result.status === 'error';
  useEffect(() => {
    if (!token || !expiresAt) return undefined;
    const timer = window.setTimeout(() => clearAdminSession(token), Math.max(0, expiresAt - Date.now()));
    // Re-check on returning to an older tab; API authorization still runs on
    // every private request while this guard protects the rendered workspace.
    const revalidate = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() >= expiresAt) clearAdminSession(token);
      else if (!getVerifiedAdminSession(token)) setRevision((value) => value + 1);
    };
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => { window.clearTimeout(timer); window.removeEventListener('focus', revalidate); document.removeEventListener('visibilitychange', revalidate); };
  }, [token, expiresAt]);

  useEffect(() => {
    if (failed && hasVerifiedSession) document.getElementById('admin-access-title')?.focus({ preventScroll: true });
  }, [failed, hasVerifiedSession]);

  if (!token) return <Navigate to={ADMIN_LOGIN_PATH} replace state={{ from: location }} />;
  return <>
    {hasVerifiedSession && <AdminAccessLockContext.Provider value={!permitted}><div hidden={!permitted} inert={!permitted} aria-hidden={!permitted || undefined}><Outlet /></div></AdminAccessLockContext.Provider>}
    {!permitted && <main id="main-content" className="admin-access" aria-labelledby="admin-access-title">
    <div><img src="/logo.png" alt="" width="78" height="54" />
      <p className="admin-access__eyebrow">Pinnawala Gems</p>
      <h1 id="admin-access-title" tabIndex={-1}>{failed ? 'Unable to verify access' : 'Verifying your access'}</h1>
      <p role="status">{failed ? 'Your workspace remains locked while sign-in verification is unavailable. Please try again.' : 'Checking your administrator session…'}</p>
      {failed && <div className="admin-access__actions"><button type="button" onClick={() => setRevision((value) => value + 1)}>Try again</button><button type="button" onClick={() => clearAdminSession(token)}>Sign out</button></div>}
      <Link to="/">Back to website</Link>
    </div>
    </main>}
  </>;
}
