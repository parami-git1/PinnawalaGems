import { GoogleLogin } from '@react-oauth/google';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLogin.css';

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

export default function Login() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState('');
  const submittingRef = useRef(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const apiUrl = import.meta.env.VITE_API_URL || 'https://pinnawalagems.onrender.com';

  const readResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return response.json();
    const body = await response.text();
    throw new Error(body.startsWith('<!DOCTYPE') ? 'The admin service is not available at the configured address.' : body || 'Unexpected server response. Please try again.');
  };

  const signIn = async (path, payload, method) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setErrorMsg('');
    setSubmitting(method);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${apiUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || (method === 'google' ? 'This Google account is not authorised as an admin.' : 'Invalid admin credentials. Please try again.'));
      if (typeof data.token !== 'string' || !data.token) throw new Error('The server did not return an admin session. Please try again.');
      localStorage.setItem('adminToken', data.token);
      navigate('/admin', { replace: true });
    } catch (error) {
      setErrorMsg(error.name === 'AbortError' ? 'The sign-in request took too long. Please try again.' : error.message || 'Unable to sign in. Please check your connection and try again.');
    } finally {
      window.clearTimeout(timeout);
      submittingRef.current = false;
      setSubmitting('');
    }
  };
  const handlePasswordLogin = (event) => { event.preventDefault(); signIn('/api/admin/login', { username, password }, 'password'); };
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
        <p className="admin-login-description">Sign in with your administrator account to continue.</p>

        {errorMsg && <div className="admin-login-error" role="alert"><span>{errorMsg}</span><button type="button" aria-label="Dismiss sign-in error" onClick={() => setErrorMsg('')}><LoginIcon type="close" /></button></div>}

        {googleClientId && <><div className="admin-login-google" inert={submitting ? true : undefined}><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg('Google sign-in failed. Please try again.')} theme="outline" size="large" text="continue_with" /></div><div className="admin-login-divider"><span />Or use admin credentials<span /></div></>}

        <form onSubmit={handlePasswordLogin} aria-label="Administrator sign in" aria-busy={Boolean(submitting)}>
          <div className="admin-login-field"><label htmlFor="admin-username">Username</label><input id="admin-username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck="false" placeholder="Enter your username" required disabled={Boolean(submitting)} /></div>
          <div className="admin-login-field"><label htmlFor="admin-password">Password</label><div className="admin-login-password"><input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required disabled={Boolean(submitting)} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)} disabled={Boolean(submitting)}><LoginIcon type={showPassword ? 'eye-off' : 'eye'} /></button></div></div>
          <button type="submit" className="admin-login-submit" disabled={Boolean(submitting)}>{submitting ? <><span className="admin-login-spinner" />Signing in…</> : <>Sign in<LoginIcon type="arrow" /></>}</button>
        </form>

        {!googleClientId && <p className="admin-login-google-note">Google sign-in is unavailable. Use your admin credentials above.</p>}
        <div className="admin-login-authorisation"><LoginIcon /><p>Access is restricted to authorised administrators.</p></div>
      </div>
      <p className="admin-login-copyright">Pinnawala Gems · Administrative workspace</p>
    </section>
  </main>;
}
