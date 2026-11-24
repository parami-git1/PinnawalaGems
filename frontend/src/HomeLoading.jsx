import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeLoading.css';
import ResponsiveImage from './ResponsiveImage';

export default function HomeLoading({ leaving = false, failed = false, onRetry, message = 'Preparing your collection' }) {
  const dialog = useRef(null);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  useLayoutEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={`pg-home-loading${leaving ? ' is-leaving' : ''}${failed ? ' has-error' : ''}`} aria-label="Loading Pinnawala Gems" onCancel={(event) => event.preventDefault()}><div className="pg-home-loading__content"><ResponsiveImage src="/logo.png" alt="" width="104" height="66" maxWidth={320} sizes="104px" loading="eager" /><span className="pg-home-loading__rule" /><h2>Pinnawala Gems</h2><p role="status" aria-live="polite">{failed ? 'We couldn’t finish preparing your visit.' : slow ? 'A little longer. Your collection is on its way.' : message}</p>{!failed && <span className="pg-home-loading__line" aria-hidden="true"><i /></span>}{(failed || slow) && <div className="pg-home-loading__actions">{failed && onRetry && <button type="button" onClick={onRetry}>Try again</button>}<Link to="/catalog">Browse the collection</Link><Link to="/contact">Contact our team</Link></div>}</div></dialog>;
}
