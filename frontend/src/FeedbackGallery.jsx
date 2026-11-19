import { useEffect, useRef, useState } from 'react';
import { imageDelivery } from './imageDelivery';
import { FEEDBACK_PREVIEW, FEEDBACK_STARTER, FEEDBACK_SRCSET, FEEDBACK_SIZES } from './pageHeroAssets';

const prepared = new Map();
const warned = new Set();
const imageKey = (source) => `${source}:${window.innerWidth}:${window.devicePixelRatio || 1}`;

function reportImageError(source, reason) {
  let url = source;
  try { const parsed = new URL(source, window.location.origin); url = parsed.origin + parsed.pathname; } catch { /* Keep a useful source label. */ }
  const detail = { url, reason, area: 'feedback-gallery' };
  if (!warned.has(url)) {
    warned.add(url);
    console.warn('[Pinnawala image delivery]', detail);
  }
  window.dispatchEvent(new CustomEvent('pinnawala:image-error', { detail }));
}

function decodePhoto(delivery, priority) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    let settled = false;
    let decoding = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(deadline);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error); else resolve(image.currentSrc || delivery.src);
    };
    const deadline = window.setTimeout(() => finish(new Error('timeout')), 15000);
    image.decoding = 'async';
    image.fetchPriority = priority;
    image.onload = async () => {
      if (decoding) return;
      decoding = true;
      try { if (image.decode) await image.decode(); finish(); }
      catch { finish(image.naturalWidth ? null : new Error('decode')); }
    };
    image.onerror = () => finish(new Error('load'));
    if (delivery.sizes) image.sizes = delivery.sizes;
    if (delivery.srcSet) image.srcset = delivery.srcSet;
    image.src = delivery.src;
    if (image.complete && image.naturalWidth) image.onload();
  });
}

function preparePhoto(source, priority = 'auto') {
  const key = imageKey(source);
  if (prepared.has(key)) return prepared.get(key);
  const delivery = source === FEEDBACK_STARTER
    ? { src: FEEDBACK_STARTER, srcSet: FEEDBACK_SRCSET, sizes: FEEDBACK_SIZES, original: FEEDBACK_STARTER }
    : imageDelivery(source, { width: 1000, sizes: FEEDBACK_SIZES });
  const promise = (async () => {
    let url;
    try { url = await decodePhoto(delivery, priority); }
    catch (error) {
      reportImageError(source, error.message);
      if (delivery.src === delivery.original) throw error;
      try { url = await decodePhoto({ src: delivery.original }, priority); }
      catch (originalError) { reportImageError(source, originalError.message); throw originalError; }
    }
    return { source, url, ready: true };
  })();
  prepared.set(key, promise);
  if (prepared.size > 32) prepared.delete(prepared.keys().next().value);
  return promise;
}

const starterPhoto = () => ({ source: FEEDBACK_STARTER, url: FEEDBACK_STARTER, srcSet: FEEDBACK_SRCSET, initial: true, ready: false });

export default function FeedbackGallery({ photos, reducedMotion, Icon }) {
  const [selection, setSelection] = useState({ list: '', index: 0 });
  const [current, setCurrent] = useState(starterPhoto);
  const [incoming, setIncoming] = useState(null);
  const [fading, setFading] = useState(false);
  const [photoPaused, setPhotoPaused] = useState(false);
  const [photoHovered, setPhotoHovered] = useState(false);
  const [photoFocused, setPhotoFocused] = useState(false);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const failed = useRef(new Set());
  const photoList = JSON.stringify(photos);
  const requestedIndex = selection.list === photoList ? selection.index % photos.length : 0;
  const target = photos[requestedIndex];
  const activeSlide = photos.indexOf(current.source);
  const galleryState = error?.source === target ? 'error' : incoming?.ready ? 'transitioning' : incoming || target !== current.source || !current.ready ? 'loading' : 'ready';

  // Keep the displayed photograph intact while its replacement downloads/decodes.
  // A changed photo list or a rapid second click cancels only the stale intent.
  useEffect(() => {
    if (incoming || error?.source === target || (target === current.source && (!retry || current.ready))) return undefined;
    let active = true;
    preparePhoto(target).then((photo) => {
      if (!active) return;
      setError(null);
      if (photo.source === current.source) setCurrent({ ...photo, initial: true, ready: false, revision: retry });
      else setIncoming({ ...photo, ready: false });
    }).catch((failure) => {
      failed.current.add(target);
      if (active) setError({ source: target, reason: failure.message });
    });
    return () => { active = false; };
  }, [target, current.source, current.ready, incoming, retry, error]);

  useEffect(() => {
    if (!incoming?.ready) return undefined;
    let second;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setFading(true));
    });
    return () => { window.cancelAnimationFrame(first); window.cancelAnimationFrame(second); };
  }, [incoming]);

  useEffect(() => {
    if (!incoming || !fading) return undefined;
    // Also settle in browsers that suppress transitionend in a background tab.
    const timer = window.setTimeout(() => {
      setCurrent(incoming);
      setIncoming(null);
      setFading(false);
    }, reducedMotion ? 0 : 850);
    return () => window.clearTimeout(timer);
  }, [incoming, fading, reducedMotion]);

  const finishFade = (event) => {
    if (event.propertyName !== 'opacity' || !incoming || !fading) return;
    setCurrent(incoming);
    setIncoming(null);
    setFading(false);
  };
  const selectPhoto = (index) => setSelection({ list: photoList, index: (index + photos.length) % photos.length });

  useEffect(() => {
    if (photos.length <= 1 || incoming || !current.ready || photoPaused || photoHovered || photoFocused || reducedMotion || (target !== current.source && error?.source !== target)) return undefined;
    const timer = window.setTimeout(() => {
      for (let offset = 1; offset <= photos.length; offset += 1) {
        const index = (requestedIndex + offset) % photos.length;
        if (!failed.current.has(photos[index])) {
          setSelection({ list: photoList, index });
          break;
        }
      }
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [photos, photoList, requestedIndex, target, current.source, current.ready, incoming, photoPaused, photoHovered, photoFocused, reducedMotion, error]);

  // Prepare just the next photograph at low priority, never the whole slideshow.
  useEffect(() => {
    if (!current.ready || incoming || target !== current.source || photos.length <= 1) return;
    const next = photos[(requestedIndex + 1) % photos.length];
    if (!failed.current.has(next)) preparePhoto(next, 'low').catch(() => failed.current.add(next));
  }, [photos, requestedIndex, target, current.source, current.ready, incoming]);

  const retryPhoto = () => {
    prepared.delete(imageKey(target));
    failed.current.delete(target);
    setError(null);
    if (target === current.source) setCurrent((photo) => ({ ...photo, ready: false }));
    setRetry((value) => value + 1);
  };
  const currentLoaded = async (event) => {
    const image = event.currentTarget;
    try { if (image.decode) await image.decode(); } catch { if (!image.naturalWidth) return; }
    if (!image.isConnected) return;
    setCurrent((photo) => photo.source === image.dataset.photoSource ? { ...photo, ready: true } : photo);
  };
  const incomingLoaded = async (event, expected) => {
    const image = event.currentTarget;
    try { if (image.decode) await image.decode(); } catch { if (!image.naturalWidth) return; }
    if (!image.isConnected) return;
    setIncoming((photo) => photo?.source === expected.source && photo.url === expected.url ? { ...photo, ready: true } : photo);
  };
  const displayFailed = (photo) => {
    reportImageError(photo.source, 'display');
    failed.current.add(photo.source);
    setError({ source: photo.source, reason: 'display' });
    if (photo === incoming) {
      setIncoming(null);
      setFading(false);
    } else setCurrent((displayed) => ({ ...displayed, ready: false, displayFailed: true }));
  };

  return <div className="feedback-gallery" aria-label="Pinnawala Gems photo gallery" aria-roledescription="carousel" aria-busy={galleryState === 'loading'} data-gallery-state={galleryState} data-active-photo={current.source} onMouseEnter={() => setPhotoHovered(true)} onMouseLeave={() => setPhotoHovered(false)} onFocusCapture={() => setPhotoFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPhotoFocused(false); }}>
    <div className="feedback-gallery-preview" style={{ backgroundImage: `url("${FEEDBACK_PREVIEW}")` }} aria-hidden="true" />
    {[current, incoming].filter(Boolean).map((photo) => <img key={`${photo.source}:${photo.revision || 0}`} src={photo.url} srcSet={photo.srcSet} sizes={photo.srcSet ? FEEDBACK_SIZES : undefined} alt={photo === current ? photo.source === FEEDBACK_STARTER ? 'Gemstone craftsmanship' : 'At Pinnawala Gems' : ''} aria-hidden={photo !== current} width="1000" height="1250" loading="eager" fetchPriority={photo.source === FEEDBACK_STARTER ? 'high' : 'auto'} decoding="async" data-image-state={photo.displayFailed ? 'error' : photo.ready ? 'ready' : 'loading'} data-photo-source={photo.source} className={`feedback-gallery-photo${photo.initial ? ' is-starter' : ''}${photo === current ? ' is-active is-current' : ` is-entering${fading ? ' is-active' : ''}`}`} onLoad={photo === incoming ? (event) => incomingLoaded(event, photo) : !photo.ready ? currentLoaded : undefined} onTransitionEnd={photo === incoming ? finishFade : undefined} onError={() => displayFailed(photo)} />)}
    <div className="feedback-gallery-shade" />
    <div className="feedback-gallery-caption"><p className="feedback-eyebrow">The Pinnawala Journal</p><h1 id="feedback-title">A Legacy of<br /><em>Brilliance</em></h1><span className="feedback-caption-rule" /><p className="feedback-gallery-description">Every stone carries a story. We are honoured to hear the moments, memories, and meaning our clients discover with us.</p>
      {photos.length > 1 && <div className="feedback-photo-dots">{photos.map((_, index) => <button key={index} type="button" className={index === activeSlide ? 'is-active' : ''} aria-label={`Photo ${index + 1} of ${photos.length}`} aria-current={index === activeSlide ? 'true' : undefined} onClick={() => selectPhoto(index)}><span /></button>)}</div>}
    </div>
    {galleryState === 'error' && <div className="feedback-gallery-error" role="status"><span>This photo could not load.</span><button type="button" onClick={retryPhoto}>Retry photo</button></div>}
    {photos.length > 1 && <div className="feedback-photo-controls"><div className="feedback-photo-arrows"><button type="button" aria-label="Previous photo" onClick={() => selectPhoto(requestedIndex - 1)}><Icon name="left" /></button><button type="button" aria-label={photoPaused || reducedMotion ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPhotoPaused((paused) => !paused)} disabled={reducedMotion}><Icon name={photoPaused || reducedMotion ? 'play' : 'pause'} /></button><button type="button" aria-label="Next photo" onClick={() => selectPhoto(requestedIndex + 1)}><Icon name="right" /></button></div></div>}
  </div>;
}
