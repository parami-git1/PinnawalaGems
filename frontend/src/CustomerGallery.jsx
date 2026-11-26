import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './CustomerGallery.css';
import ResponsiveImage from './ResponsiveImage';

function Arrow({ previous = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d={previous ? 'M20 12H5m6-6-6 6 6 6' : 'M4 12h15m-6-6 6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GalleryPhoto = memo(function GalleryPhoto({ src, index, total, clone = false }) {
  return (
    <figure
      className={`pg-community__slide${clone ? ' pg-community__slide--clone' : ''}`}
      aria-hidden={clone || undefined}
      inert={clone || undefined}
      role={clone ? undefined : 'group'}
      aria-roledescription={clone ? undefined : 'slide'}
      aria-label={clone ? undefined : `${index + 1} of ${total}`}
    >
      <div className="pg-community__photo">
          <ResponsiveImage
            src={src}
            alt={clone ? '' : `A shared moment at Pinnawala Gems, photo ${index + 1}`}
            width="640"
            height="700"
            maxWidth={900}
            sizes="(max-width:599px) 80vw,(max-width:1023px) 45vw,28vw"
            draggable="false"
          />
        <span className="pg-community__photo-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </figure>
  );
});

export default function CustomerGallery({ photos = [] }) {
  const images = useMemo(() => Array.isArray(photos) ? photos.filter((photo) => typeof photo === 'string' && photo.trim()) : [], [photos]);
  const total = images.length;
  const clones = total > 1 ? Math.min(3, total) : 0;
  const track = useRef(null);
  const activeRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window));
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [interactionVersion, setInteractionVersion] = useState(0);
  const trackId = useId();

  const slides = useMemo(() => {
    const real = images.map((src, index) => ({ src, index, clone: false, key: `real-${index}` }));
    if (!clones) return real;
    return [
      ...real.slice(-clones).map((slide) => ({ ...slide, clone: true, key: `before-${slide.index}` })),
      ...real,
      ...real.slice(0, clones).map((slide) => ({ ...slide, clone: true, key: `after-${slide.index}` })),
    ];
  }, [images, clones]);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element || !total) return undefined;
    let settleTimer;
    let correcting = false;

    const distance = () => {
      const first = element.children[0];
      const second = element.children[1];
      return first && second ? second.offsetLeft - first.offsetLeft : first?.offsetWidth || 1;
    };
    const nearestPhysical = () => Math.round(element.scrollLeft / distance());
    const displayIndex = (physical) => ((physical - clones) % total + total) % total;
    const setDisplayed = (index) => { activeRef.current = index; };
    const jumpTo = (physical) => {
      correcting = true;
      element.scrollTo({ left: physical * distance(), behavior: 'instant' });
      correcting = false;
    };
    const settle = () => {
      if (correcting) return;
      const physical = nearestPhysical();
      const index = displayIndex(physical);
      setDisplayed(index);
      if (clones && (physical < clones || physical >= clones + total)) jumpTo(index + clones);
    };
    const handleScroll = () => {
      if (correcting) return;
      setDisplayed(displayIndex(nearestPhysical()));
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 140);
    };
    const align = () => jumpTo(activeRef.current + clones);
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(align) : null;
    activeRef.current = Math.min(activeRef.current, total - 1);
    setDisplayed(activeRef.current);
    jumpTo(activeRef.current + clones);
    resize?.observe(element);
    window.addEventListener('resize', align);
    element.addEventListener('scroll', handleScroll, { passive: true });
    element.addEventListener('scrollend', settle);
    return () => {
      resize?.disconnect();
      window.removeEventListener('resize', align);
      window.clearTimeout(settleTimer);
      element.removeEventListener('scroll', handleScroll);
      element.removeEventListener('scrollend', settle);
    };
  }, [total, clones]);

  useEffect(() => {
    const element = track.current;
    if (!element) return undefined;
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [total]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChange = () => {
      setReducedMotion(query.matches);
    };
    const visibilityChange = () => setPageVisible(!document.hidden);
    query.addEventListener('change', motionChange);
    document.addEventListener('visibilitychange', visibilityChange);
    return () => {
      query.removeEventListener('change', motionChange);
      document.removeEventListener('visibilitychange', visibilityChange);
    };
  }, []);

  const advance = useCallback((direction) => {
    const element = track.current;
    if (!element || total < 2) return;
    const first = element.children[0];
    const second = element.children[1];
    const distance = second.offsetLeft - first.offsetLeft;
    const physical = Math.round(element.scrollLeft / distance);
    element.scrollTo({ left: (physical + direction) * distance, behavior: reducedMotion ? 'instant' : 'smooth' });
  }, [total, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !visible || !pageVisible || interacting || focused || hovered || total < 2) return undefined;
    const interval = window.setInterval(() => advance(1), 4200);
    return () => window.clearInterval(interval);
  }, [reducedMotion, visible, pageVisible, interacting, focused, hovered, total, advance, interactionVersion]);

  useEffect(() => {
    if (!interacting) return undefined;
    const release = () => setInteracting(false);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [interacting]);

  const moveManually = (direction) => {
    setInteractionVersion((value) => value + 1);
    advance(direction);
  };
  const handleKey = (event) => {
    if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setInteractionVersion((value) => value + 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') advance(event.key === 'ArrowLeft' ? -1 : 1);
    else {
      const element = track.current;
      const distance = element.children[1]?.offsetLeft - element.children[0]?.offsetLeft;
      if (distance) element.scrollTo({ left: (clones + (event.key === 'Home' ? 0 : total - 1)) * distance, behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  };

  if (!total) return null;

  return (
    <section className="pg-community pg-section" aria-labelledby="pg-community-title">
      <div className="pg-container">
        <div className="pg-community__heading" data-reveal>
          <div>
            <h2 id="pg-community-title">Beautiful stones.<br /><em>Even better connections.</em></h2>
          </div>
          <div className="pg-community__introduction">
            <Link to="/feedback" className="pg-text-link">Meet our community<Arrow /></Link>
          </div>
        </div>

        <div
          className="pg-community__carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Moments with the Pinnawala Gems community"
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className={`pg-community__track${total === 1 ? ' pg-community__track--single' : ''}`}
            ref={track}
            id={trackId}
            tabIndex={0}
            aria-label="Photo gallery. Swipe or use the left and right arrow keys to browse."
            aria-live="off"
            onKeyDown={handleKey}
            onPointerDown={() => setInteracting(true)}
            onWheel={() => setInteractionVersion((value) => value + 1)}
            style={{ '--community-columns': Math.min(3, total) }}
          >
            {slides.map((slide) => <GalleryPhoto key={slide.key} src={slide.src} index={slide.index} total={total} clone={slide.clone} />)}
          </div>
          {total > 1 && <>
            <button type="button" className="pg-community__arrow pg-community__arrow--previous" onClick={() => moveManually(-1)} aria-label="Previous community photo" aria-controls={trackId}><Arrow previous /></button>
            <button type="button" className="pg-community__arrow pg-community__arrow--next" onClick={() => moveManually(1)} aria-label="Next community photo" aria-controls={trackId}><Arrow /></button>
          </>}
        </div>
      </div>
    </section>
  );
}
