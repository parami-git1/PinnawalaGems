import { useLayoutEffect, useRef } from 'react';
import './HomeLoading.css';
import ResponsiveImage from './ResponsiveImage';

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
  return <dialog ref={dialog} className={`pg-home-loading${leaving ? ' is-leaving' : ''}`} aria-label="Loading Pinnawala Gems" onCancel={(event) => event.preventDefault()}><div className="pg-home-loading__content" role="status" aria-live="polite" aria-busy={!leaving}><ResponsiveImage src="/logo.png" alt="" width="104" height="66" maxWidth={320} sizes="104px" loading="eager" /><span className="pg-home-loading__rule" /><h2>Pinnawala Gems</h2><p>{message}</p><span className="pg-home-loading__line"><i /></span></div></dialog>;
}
