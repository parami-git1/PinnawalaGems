import { useEffect, useRef, useState } from 'react';
import { CONTACT_HERO, CONTACT_SRCSET, CONTACT_SIZES, CONTACT_PREVIEW } from './pageHeroAssets';

export default function ContactHeroImage() {
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const onLoad = async (event) => {
    const image = event.currentTarget;
    const source = image.currentSrc;
    try { if (image.decode) await image.decode(); }
    catch { if (!image.naturalWidth) return; }
    if (mounted.current && image.currentSrc === source && image.naturalWidth) setReady(true);
  };
  const onError = (event) => {
    const url = new URL(event.currentTarget.currentSrc || event.currentTarget.src, window.location.origin);
    const detail = { url: url.origin + url.pathname, reason: 'contact-hero-load' };
    console.warn('[Pinnawala image delivery]', detail);
    window.dispatchEvent(new CustomEvent('pinnawala:image-error', { detail }));
    setReady(false);
    if (!fallback) setFallback(true);
    else setFailed(true);
  };

  return <div className="pg-contact-banner-image" style={{ backgroundImage: `url("${CONTACT_PREVIEW}")` }} aria-hidden="true">
    <img src={fallback ? '/contact-hero-v2.png' : CONTACT_HERO} srcSet={fallback ? undefined : CONTACT_SRCSET} sizes={fallback ? undefined : CONTACT_SIZES}
      width="1774" height="887" alt="" loading="eager" fetchPriority="high" decoding="async"
      data-image-state={failed ? 'error' : ready ? 'ready' : 'loading'} onLoad={onLoad} onError={onError} />
  </div>;
}
