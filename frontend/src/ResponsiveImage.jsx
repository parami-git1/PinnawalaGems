import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { imageDelivery, IMAGE_PLACEHOLDER, IMAGE_UNAVAILABLE } from './imageDelivery';
import './ResponsiveImage.css';

const decoded = new Map();
const warned = new Set();
const listeners = new Set();
const viewport = () => `${window.innerWidth}:${window.devicePixelRatio || 1}`;
const resize = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('resize', resize, { passive: true });
  return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener('resize', resize); };
};

function loadImage(delivery, priority, retryKey = 0) {
  const key = JSON.stringify([delivery.src, delivery.srcSet, delivery.sizes, viewport(), retryKey]);
  if (decoded.has(key)) return decoded.get(key);
  const promise = new Promise((resolve, reject) => {
    const image = new window.Image();
    let complete = false;
    let decoding = false;
    const finish = (error) => {
      if (complete) return;
      complete = true; window.clearTimeout(deadline); image.onload = null; image.onerror = null;
      if (error) reject(error); else resolve(image.currentSrc || delivery.src);
    };
    const deadline = window.setTimeout(() => finish(new Error('timeout')), 15000);
    image.decoding = 'async'; image.fetchPriority = priority; image.loading = 'eager';
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
  decoded.set(key, promise);
  if (decoded.size > 160) decoded.delete(decoded.keys().next().value);
  // Failed entries expire, rather than triggering an automatic retry loop.
  promise.catch(() => window.setTimeout(() => { if (decoded.get(key) === promise) decoded.delete(key); }, 30000));
  return promise;
}

function diagnostic(src, reason) {
  let url = src;
  try { const parsed = new URL(src, window.location.origin); url = parsed.origin + parsed.pathname; } catch { /* Keep the supplied label. */ }
  const detail = { url, reason };
  if (!warned.has(url)) {
    if (warned.size > 100) warned.clear();
    warned.add(url); console.warn('[Pinnawala image delivery]', detail);
  }
  window.dispatchEvent(new CustomEvent('pinnawala:image-error', { detail }));
}

// Keep a native <img>: existing page geometry, selectors and hover effects stay intact.
export default function ResponsiveImage({ src, mobileSrc, breakpoint = 599, alt, width, height, maxWidth = 800, sizes = '100vw', loading = 'lazy', fetchPriority = 'auto', className = '', fallback, onReady, onError, onLoad, preservePrevious = false, fade = true, retryKey = 0, ...props }) {
  const dimension = useSyncExternalStore(subscribe, viewport, () => '1440:1');
  const selected = mobileSrc && Number(dimension.split(':')[0]) <= breakpoint ? mobileSrc : src;
  const delivery = useMemo(() => imageDelivery(selected, { width: maxWidth, sizes }), [selected, maxWidth, sizes]);
  const key = JSON.stringify([selected, delivery.src, delivery.srcSet, sizes, dimension, retryKey]);
  const node = useRef(null);
  const callbacks = useRef({ onReady, onError, onLoad });
  useEffect(() => { callbacks.current = { onReady, onError, onLoad }; }, [onReady, onError, onLoad]);
  const [near, setNear] = useState(() => loading === 'eager' || !('IntersectionObserver' in window));
  const [result, setResult] = useState({ key: '', url: '', failed: false });
  const ready = result.key === key && Boolean(result.url);
  const previous = preservePrevious && Boolean(result.url);
  const isError = result.key === key && result.failed;
  const notified = useRef('');
  useEffect(() => {
    if (near || loading === 'eager') return undefined;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); observer.disconnect(); } }, { rootMargin: '240px 0px' });
    if (node.current) observer.observe(node.current);
    return () => observer.disconnect();
  }, [near, loading]);
  useEffect(() => {
    if (!near && loading !== 'eager') return undefined;
    let active = true;
    async function prepare() {
      if (!delivery.src) { if (active) setResult({ key, url: IMAGE_UNAVAILABLE, failed: true }); return; }
      try {
        const url = await loadImage(delivery, fetchPriority, retryKey);
        if (active) setResult({ key, url, failed: false, fallbackUsed: false });
      } catch (error) {
        if (!active) return;
        diagnostic(delivery.original, error.message);
        // A newly deployed format may be unavailable in an old cache/browser.
        // Try the original local asset once, or the caller's explicit fallback.
        const alternative = fallback || (delivery.original.startsWith('/') && delivery.src !== delivery.original ? delivery.original : '');
        if (alternative && alternative !== delivery.src) {
          try { const url = await loadImage({ src: alternative }, fetchPriority); if (active) setResult({ key, url, failed: alternative !== delivery.original, fallbackUsed: true }); return; } catch { /* Show the explicit unavailable tile. */ }
        }
        if (active) setResult({ key, url: IMAGE_UNAVAILABLE, failed: true });
        callbacks.current.onError?.(error);
      }
    }
    prepare();
    return () => { active = false; };
  }, [key, near, loading, fetchPriority, fallback, delivery, retryKey]);
  const notify = useCallback((event) => {
    if (!ready || notified.current === key) return;
    notified.current = key;
    callbacks.current.onReady?.({ failed: isError, src: result.url });
    callbacks.current.onLoad?.(event);
  }, [ready, key, isError, result.url]);
  useEffect(() => {
    if (ready && node.current?.complete && node.current.naturalWidth) notify();
  }, [key, ready, notify]);
  const renderError = () => {
    if (!ready || result.url === IMAGE_UNAVAILABLE) return;
    diagnostic(selected, 'display');
    notified.current = '';
    setResult({ key, url: IMAGE_UNAVAILABLE, failed: true, fallbackUsed: true });
    callbacks.current.onError?.(new Error('display'));
  };
  return <img {...props} ref={node} src={ready || previous ? result.url : IMAGE_PLACEHOLDER} srcSet={ready && !isError && !result.fallbackUsed ? delivery.srcSet : undefined} sizes={ready && !isError && !result.fallbackUsed ? sizes : undefined} alt={isError ? `${alt || 'Photograph'} — image unavailable` : alt} width={width} height={height} className={`pg-responsive-image ${className}`} loading={loading} decoding="async" fetchPriority={fetchPriority} data-image-state={ready ? isError ? 'error' : 'ready' : 'loading'} data-image-fade={fade} aria-busy={!ready} onLoad={notify} onError={renderError} />;
}
