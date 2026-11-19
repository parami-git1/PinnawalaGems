import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { imageDelivery, IMAGE_UNAVAILABLE } from './imageDelivery';
import './ResponsiveImage.css';

const REQUEST_TIMEOUT = 15000;
const RETRY_DELAYS = [600, 1800];

// Only an art-direction breakpoint changes the React source. The browser owns
// srcset selection, including changes to viewport size and device pixel ratio.
function useMobileSource(enabled, breakpoint) {
  const query = `(max-width: ${breakpoint}px)`;
  const subscribe = useCallback((listener) => {
    if (!enabled || typeof window.matchMedia !== 'function') return () => {};
    const media = window.matchMedia(query);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [enabled, query]);
  const snapshot = useCallback(() => enabled && typeof window.matchMedia === 'function' && window.matchMedia(query).matches, [enabled, query]);
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

function safeUrl(value) {
  if (!value) return '[missing image URL]';
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.origin + url.pathname;
    return `${url.protocol}[redacted]`;
  } catch { return '[invalid image URL]'; }
}

function diagnostic(src, reason) {
  const detail = { url: safeUrl(src), reason };
  console.warn('[Pinnawala image delivery]', detail);
  window.dispatchEvent(new CustomEvent('pinnawala:image-error', { detail }));
}

function canRetry(src) {
  if (typeof src !== 'string' || !src.trim()) return false;
  try { return /^https?:$/.test(new URL(src, window.location.origin).protocol); }
  catch { return false; }
}

// A new public URL also escapes an expired, still pending browser request.
// Preserve signed/private URLs exactly: adding parameters can invalidate them.
function retryUrl(src, revision) {
  if (!revision || !canRetry(src)) return src;
  try {
    const url = new URL(src, window.location.origin);
    if (url.search || /\/s--[^/]+\//.test(url.pathname)) return src;
    url.searchParams.set('_pg_image_retry', String(revision));
    return /^\/(?!\/)/.test(src) ? url.pathname + url.search + url.hash : url.href;
  } catch { return src; }
}

function sourceOptions(delivery, fallback) {
  const sources = [{ src: delivery.src, srcSet: delivery.srcSet, sizes: delivery.sizes, fallback: false }];
  if (delivery.original && (delivery.original !== delivery.src || delivery.srcSet)) {
    sources.push({ src: delivery.original, fallback: false });
  }
  if (fallback && !sources.some((source) => source.src === fallback && !source.srcSet)) {
    sources.push({ src: fallback, fallback: true });
  }
  return sources;
}

function NativeImage({ request, active, hidden, onSuccess, onReady, onError, onLoad, alt, width, height, loading, fetchPriority, className, fade, ...props }) {
  const { sources } = request;
  const [attempt, setAttempt] = useState({ index: 0, retries: 0, revision: 0, status: 'loading' });
  const [near, setNear] = useState(() => loading === 'eager' || typeof IntersectionObserver === 'undefined');
  const node = useRef(null);
  const failed = useRef(new Set());
  const loaded = useRef(new Set());
  const recovered = useRef(false);
  const retryTimer = useRef(null);
  const callbacks = useRef({ onReady, onError, onLoad, onSuccess });
  useEffect(() => { callbacks.current = { onReady, onError, onLoad, onSuccess }; }, [onReady, onError, onLoad, onSuccess]);
  const source = sources[attempt.index];
  const requestSrc = retryUrl(source.src, attempt.cacheBust ? attempt.revision : 0);
  const isError = attempt.status === 'error';
  const eager = hidden || loading === 'eager';

  useEffect(() => {
    if (near || eager || !active) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '600px 0px' });
    if (node.current) observer.observe(node.current);
    return () => observer.disconnect();
  }, [near, eager, active, attempt.revision]);

  const fail = useCallback((reason, image) => {
    if (!active || !['loading', 'ready'].includes(attempt.status) || failed.current.has(attempt.revision) || (loaded.current.has(attempt.revision) && attempt.status !== 'ready')) return;
    failed.current.add(attempt.revision);
    const url = image?.currentSrc || requestSrc || source.src;
    if (url) diagnostic(url, reason);

    // Try the real original after a failed transform, then an explicit caller
    // fallback. Retry transient failures only when neither alternative remains.
    const nextOriginal = attempt.index === 0 && sources[1] && !sources[1].fallback;
    const nextFallback = sources[attempt.index + 1]?.fallback;
    const retry = !nextOriginal && !nextFallback && !source.fallback && canRetry(source.src) && attempt.retries < RETRY_DELAYS.length;
    const nextIndex = nextOriginal || nextFallback ? attempt.index + 1 : attempt.index;
    if (nextOriginal || nextFallback || retry) {
      const delay = retry ? RETRY_DELAYS[attempt.retries] : 150;
      setAttempt({ ...attempt, status: 'retrying' });
      retryTimer.current = window.setTimeout(() => {
        retryTimer.current = null;
        setAttempt({ index: nextIndex, retries: retry ? attempt.retries + 1 : 0, revision: attempt.revision + 1, cacheBust: retry, status: 'loading' });
      }, delay);
      return;
    }

    setAttempt({ ...attempt, status: 'error' });
    const error = new Error(`Image ${reason}: ${safeUrl(url)}`);
    error.reason = reason;
    callbacks.current.onError?.(error);
    callbacks.current.onReady?.({ failed: true, src: url });
  }, [active, attempt, requestSrc, source, sources]);

  const complete = useCallback((event) => {
    const image = event.currentTarget;
    if (!active || attempt.status !== 'loading' || !image.naturalWidth || failed.current.has(attempt.revision) || loaded.current.has(attempt.revision)) return;
    loaded.current.add(attempt.revision);
    setAttempt({ ...attempt, status: 'ready' });
    callbacks.current.onSuccess?.(request);
    // Deliver the actual native image event while currentTarget is available.
    callbacks.current.onLoad?.(event);
    callbacks.current.onReady?.({ failed: Boolean(source.fallback), src: image.currentSrc || requestSrc });
  }, [active, attempt, request, requestSrc, source.fallback]);

  useEffect(() => {
    const image = node.current;
    if (!active || attempt.status !== 'loading') return undefined;
    if (!source.src) {
      // Report a missing source asynchronously, just like a native load error.
      const missing = window.setTimeout(() => fail('missing', image), 0);
      return () => window.clearTimeout(missing);
    }
    if (image?.complete && image.naturalWidth && !loaded.current.has(attempt.revision)) {
      // Cached images can complete before effects. Dispatch a real load event so
      // callers still receive currentTarget and naturalWidth, exactly once.
      image.dispatchEvent(new Event('load'));
    }
    if ((!near && !eager) || loaded.current.has(attempt.revision)) return undefined;
    const deadline = window.setTimeout(() => fail('timeout', image), REQUEST_TIMEOUT);
    return () => window.clearTimeout(deadline);
  }, [active, attempt, eager, fail, near, source.src]);

  useEffect(() => {
    if (!active) return undefined;
    const recover = () => {
      if (document.visibilityState === 'hidden' || recovered.current || attempt.status !== 'error') return;
      const original = sources.findIndex((candidate) => !candidate.fallback && !candidate.srcSet && candidate.src === request.original);
      const index = original < 0 ? 0 : original;
      if (!canRetry(sources[index].src)) return;
      recovered.current = true;
      setAttempt({ index, retries: 0, revision: attempt.revision + 1, cacheBust: true, status: 'loading' });
    };
    const visible = () => { if (document.visibilityState === 'visible') recover(); };
    window.addEventListener('online', recover);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('online', recover);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [active, attempt, request.original, sources]);

  useEffect(() => () => window.clearTimeout(retryTimer.current), [active]);

  // A preserved image keeps its original DOM node and layout. Only the incoming
  // candidate is hidden and out of flow while its native request is in flight.
  return <img {...props} key={attempt.revision} ref={node}
    src={isError ? IMAGE_UNAVAILABLE : requestSrc || undefined}
    srcSet={!isError ? source.srcSet : undefined} sizes={!isError ? source.sizes : undefined}
    alt={isError ? `${alt || 'Photograph'} — image unavailable` : alt} width={width} height={height}
    className={`pg-responsive-image ${className}${hidden ? ' pg-responsive-image--candidate' : ''}`}
    loading={eager ? 'eager' : loading} decoding="async" fetchPriority={fetchPriority}
    data-image-state={isError ? 'error' : attempt.status === 'ready' ? 'ready' : 'loading'}
    data-image-preserved={!active || undefined} data-image-fade={fade}
    aria-hidden={hidden || props['aria-hidden']} aria-busy={active && attempt.status !== 'ready' && !isError}
    onLoad={complete} onError={(event) => fail('load', event.currentTarget)} />;
}

// Native <img> children preserve page selectors, intrinsic dimensions and hover
// effects. There is no detached preload, decode gate, or failed-promise cache.
export default function ResponsiveImage({ src, mobileSrc, breakpoint = 599, alt, width, height, maxWidth = 800, sizes = '100vw', loading = 'lazy', fetchPriority = 'auto', className = '', fallback, onReady, onError, onLoad, preservePrevious = false, fade = true, retryKey = 0, ...props }) {
  const mobile = useMobileSource(Boolean(mobileSrc), breakpoint);
  const selected = mobile && mobileSrc ? mobileSrc : src;
  const delivery = useMemo(() => imageDelivery(selected, { width: maxWidth, sizes }), [selected, maxWidth, sizes]);
  const request = useMemo(() => ({
    key: JSON.stringify([delivery.src, delivery.srcSet, delivery.sizes, delivery.original, fallback, retryKey]),
    original: delivery.original,
    sources: sourceOptions(delivery, fallback),
  }), [delivery, fallback, retryKey]);
  const [good, setGood] = useState(null);
  const previous = preservePrevious && good && good.key !== request.key ? good : null;
  const shared = { ...props, alt, width, height, loading, fetchPriority, className, fade };
  return <>
    {previous && <NativeImage key={previous.key} {...shared} request={previous} active={false} hidden={false} />}
    <NativeImage key={request.key} {...shared} request={request} active hidden={Boolean(previous)} onSuccess={setGood} onReady={onReady} onError={onError} onLoad={onLoad} />
  </>;
}
