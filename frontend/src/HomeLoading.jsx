import { useLayoutEffect, useRef } from 'react';
import './HomeLoading.css';

export default function HomeLoading({ leaving = false, message = 'Preparing your collection' }) {
  const dialog = useRef(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={`pg-home-loading${leaving ? ' is-leaving' : ''}`} aria-label="Loading Pinnawala Gems" onCancel={(event) => event.preventDefault()}><div className="pg-home-loading__content" role="status" aria-live="polite" aria-busy={!leaving}><img src="/logo.png" alt="" width="104" height="66" /><span className="pg-home-loading__rule" /><h2>Pinnawala Gems</h2><p>{message}</p><svg className="pg-home-loading__facet" viewBox="0 0 80 60" fill="none" aria-hidden="true"><path d="M21 7h38l15 19-34 29L6 26 21 7ZM6 26h68M21 7l9 19L40 7l10 19 9-19M30 26l10 29 10-29" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></svg><span className="pg-home-loading__line"><i /></span></div></dialog>;
}
