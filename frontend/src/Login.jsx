import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import { apiRequest } from './api';
import { safeAdminReturnPath } from './adminPaths';
import { rememberVerifiedAdminSession, setAdminToken } from './adminSession';
import { verifyAdminSession } from './adminSessionApi';
import { fetchAdminAuthOptions } from './adminAuthOptions';

function LoginIcon({ type = 'shield' }) {
  const paths = {
    shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    'eye-off': 'm3 3 18 18M10.6 5.1A12 12 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-4 4M6 6a20 20 0 0 0-4 6s4 7 10 7a12 12 0 0 0 5-1.2M10 10a3 3 0 0 0 4 4',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    back: 'M19 12H5m6-6-6 6 6 6',
    close: 'm6 6 12 12M6 18 18 6',
    gem: 'm7 4-5 6 10 11 10-11-5-6H7Zm-5 6h20M7 4l5 17 5-17M7 4l5 6 5-6',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>;
}

function validGoogleClientId(value) {
  return typeof value === 'string' && /^[a-z\d._-]+\.apps\.googleusercontent\.com$/i.test(value.trim()) ? value.trim() : '';
}

function GoogleSignIn({ clientId, disabled, onSuccess, onError, onRetry }) {
  const [scriptState, setScriptState] = useState('loading');
  const [buttonWidth, setButtonWidth] = useState(200);
  const control = useRef(null);
  useEffect(() => {
    if (scriptState !== 'loading') return undefined;
    const timer = window.setTimeout(() => setScriptState('error'), 8000);
    return () => window.clearTimeout(timer);
  }, [scriptState]);
  useEffect(() => {
    const node = control.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setButtonWidth(Math.max(200, Math.min(320, Math.floor(entry.contentRect.width)))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div className="admin-login-google-wrap">
    <GoogleOAuthProvider clientId={clientId} onScriptLoadSuccess={() => setScriptState('ready')} onScriptLoadError={() => setScriptState('error')}>
      <div ref={control} className={`admin-login-google${scriptState === 'ready' ? '' : ' is-pending'}`} inert={disabled || scriptState !== 'ready' ? true : undefined} aria-hidden={scriptState !== 'ready' || undefined}>
        <GoogleLogin onSuccess={onSuccess} onError={onError} theme="outline" size="large" text="continue_with" width={buttonWidth} />
      </div>
    </GoogleOAuthProvider>
    {scriptState === 'loading' && <p className="admin-login-progress" role="status"><span className="admin-login-spinner" />Preparing Google sign-in…</p>}
    {scriptState === 'error' && <div className="admin-login-service-state" role="alert"><p>Google sign-in could not load. Check your connection and try again.</p><button type="button" onClick={onRetry} disabled={disabled}>Retry Google sign-in</button></div>}
  </div>;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState('');
  const [options, setOptions] = useState({ status: 'loading', data: null });
  const [optionsRevision, setOptionsRevision] = useState(0);
  const [googleAttempt, setGoogleAttempt] = useState(0);
  const submittingRef = useRef(false);
  const activeRequest = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; activeRequest.current?.abort(); }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setOptions({ status: 'loading', data: null });
      try {
        const data = await fetchAdminAuthOptions(controller.signal);
        if (!controller.signal.aborted) setOptions({ status: 'ready', data });
      } catch (error) {
        if (!controller.signal.aborted) setOptions({ status: 'error', data: null, error });
      }
    });
    return () => controller.abort();
  }, [optionsRevision]);
  const policyKnown = options.status === 'ready';
  // Rendering an entry form does not authorize access. When the options route
  // is unavailable, the login endpoint and mandatory session check still make
  // the decision. A verified Google-only policy continues to disable passwords.
  const passwordEnabled = !policyKnown || options.data.passwordEnabled;
  const googleClientId = policyKnown
    ? options.data.googleEnabled ? options.data.googleClientId : ''
    : validGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const googleEnabled = Boolean(googleClientId);

  const signIn = async (path, payload, method) => {
    if (submittingRef.current || (method === 'google' ? !googleEnabled : !passwordEnabled)) return;
    submittingRef.current = true;
    setErrorMsg('');
    setSubmitting(method);
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const data = await apiRequest(path, { method: 'POST', body: JSON.stringify(payload), signal: controller.signal }, { auth: false, timeout: 20000 });
      if (!mounted.current) return;
      if (typeof data.token !== 'string' || !data.token) throw new Error('The server did not return an admin session. Please try again.');
      const session = await verifyAdminSession(data.token, controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      setAdminToken(data.token);
      rememberVerifiedAdminSession(data.token, session);
      navigate(safeAdminReturnPath(location.state?.from), { replace: true });
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) setErrorMsg(error.status === 404
        ? 'Sign-in needs the latest backend update before administrator access can be verified.'
        : error.message || 'Unable to sign in. Please check your connection and try again.');
    } finally {
      submittingRef.current = false;
      activeRequest.current = null;
      if (mounted.current) setSubmitting('');
    }
  };
  const handlePasswordLogin = (event) => { event.preventDefault(); signIn('/api/admin/login', { username: username.trim(), password }, 'password'); };
  const handleGoogleSuccess = (credentialResponse) => signIn('/api/admin/google-login', { credential: credentialResponse.credential }, 'google');

  return <main id="main-content" className="admin-login">
    <div className="admin-login-brand-panel">
      <Link to="/" className="admin-login-brand"><span><img src="/image_27d308.png" alt="" width="44" height="44" /></span><span>Pinnawala Gems<small>ADMINISTRATION</small></span></Link>
      <div className="admin-login-brand-copy"><span className="admin-login-brand-icon"><LoginIcon type="gem" /></span><p className="admin-login-eyebrow">The business behind the brilliance</p><h1>Your workspace.<br /><em>Everything in view.</em></h1><p>Manage your inventory, appointments and website content from one organised workspace.</p><div className="admin-login-workspaces"><span>Inventory</span><span>Appointments</span><span>Website</span></div></div>
      <div className="admin-login-brand-footer"><span />Pinnawala Gems · Sri Lanka</div>
    </div>

    <section className="admin-login-form-panel" aria-labelledby="admin-login-title">
      <Link className="admin-login-back" to="/"><LoginIcon type="back" />Back to website</Link>
      <div className="admin-login-card">
        <span className="admin-login-security-icon"><LoginIcon /></span>
        <p className="admin-login-eyebrow">Secure admin portal</p>
        <h2 id="admin-login-title">Welcome back</h2>
        <p className="admin-login-description">{googleEnabled && !passwordEnabled ? 'Continue with the Google account authorised to manage this website.' : 'Use your administrator email and password, or continue with Google.'}</p>

        {errorMsg && <div className="admin-login-error" role="alert"><span>{errorMsg}</span><button type="button" aria-label="Dismiss sign-in error" onClick={() => setErrorMsg('')}><LoginIcon type="close" /></button></div>}

        {options.status === 'loading' && <p className="admin-login-progress" role="status"><span className="admin-login-spinner" />Checking secure sign-in…</p>}
        {options.status === 'error' && <div className="admin-login-service-state" role="status"><p>{options.error?.status === 404 ? 'The sign-in settings need a backend update. You can enter your admin email and password below; access will still be verified.' : 'Sign-in settings could not load. You can try your admin email and password below.'}</p><button type="button" onClick={() => setOptionsRevision((value) => value + 1)}>Check sign-in options</button></div>}
        {policyKnown && !passwordEnabled && !googleEnabled && <div className="admin-login-service-state" role="status"><p>Administrator sign-in is disabled in this website’s settings. Contact the website owner to complete setup.</p><button type="button" onClick={() => setOptionsRevision((value) => value + 1)}>Check sign-in options</button></div>}
        {googleEnabled ? <GoogleSignIn key={`${googleClientId}:${googleAttempt}`} clientId={googleClientId} disabled={Boolean(submitting)} onSuccess={handleGoogleSuccess} onError={() => setErrorMsg('Google sign-in failed. Please try again.')} onRetry={() => setGoogleAttempt((value) => value + 1)} /> : <div className="admin-login-google-unavailable"><button type="button" disabled><span aria-hidden="true">G</span>Continue with Google</button><p>{policyKnown ? 'Google sign-in is not enabled for this website yet.' : 'Google sign-in will be available after its website setup is complete.'}</p></div>}
        <div className="admin-login-divider"><span />Or use email and password<span /></div>

        {!passwordEnabled && <p className="admin-login-method-note">Email and password sign-in is disabled. Use the authorised Google account above.</p>}
        <form onSubmit={handlePasswordLogin} aria-label="Administrator sign in" aria-busy={submitting === 'password'}>
          <div className="admin-login-field"><label htmlFor="admin-username">Email or username</label><input id="admin-username" name="username" type="text" inputMode="email" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck="false" placeholder="Enter your admin email" required disabled={!passwordEnabled || Boolean(submitting)} /></div>
          <div className="admin-login-field"><label htmlFor="admin-password">Password</label><div className="admin-login-password"><input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required disabled={!passwordEnabled || Boolean(submitting)} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)} disabled={!passwordEnabled || Boolean(submitting)}><LoginIcon type={showPassword ? 'eye-off' : 'eye'} /></button></div></div>
          <button type="submit" className="admin-login-submit" disabled={!passwordEnabled || Boolean(submitting)}>{submitting === 'password' ? <><span className="admin-login-spinner" />Signing in…</> : <>Sign in<LoginIcon type="arrow" /></>}</button>
        </form>

        {submitting === 'google' && <p className="admin-login-progress" role="status"><span className="admin-login-spinner" />Verifying your administrator access…</p>}
        <div className="admin-login-authorisation"><LoginIcon /><p>Access is restricted to authorised administrators.</p></div>
      </div>
      <p className="admin-login-copyright">Pinnawala Gems · Administrative workspace</p>
    </section>
  </main>;
}
