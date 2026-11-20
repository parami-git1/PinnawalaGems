import { useCallback, useEffect, useRef, useState } from 'react';
import { publicResourceCache as cache, PUBLIC_RESOURCE_MAX_AGE, subscribeResourceInvalidation } from '../resourceCache';
import { PUBLIC_RESOURCE_MAX_ATTEMPTS, requestPublicResource } from '../publicResourceClient';

export { API_BASE } from '../api';

const cachedState = (path) => {
  const saved = cache.get(path);
  return {
    path, data: saved?.data ?? null, status: saved ? 'success' : 'loading',
    refreshing: false, recovering: false, error: null, attempt: 0,
    maxAttempts: PUBLIC_RESOURCE_MAX_ATTEMPTS, nextRetryAt: null,
    updatedAt: saved?.updatedAt ?? null,
    stale: Boolean(saved && Date.now() - saved.updatedAt >= PUBLIC_RESOURCE_MAX_AGE),
  };
};

// Each resource settles independently. A slow API must never block the page.
// Pass `null` as the path to defer a request until the path is available.
export function useRemoteResource(path, { loader, timeout = 15000 } = {}) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [resource, setResource] = useState(() => path ? cachedState(path) : { path: null, data: null, status: 'idle', refreshing: false, recovering: false, error: null, attempt: 0, maxAttempts: PUBLIC_RESOURCE_MAX_ATTEMPTS, nextRetryAt: null, updatedAt: null, stale: false });
  const previousRequest = useRef(null);
  const lastWakeup = useRef({ path, at: 0 });
  const retry = useCallback(() => setRefreshVersion((value) => value + 1), []);
  useEffect(() => {
    if (!path) return;
    return subscribeResourceInvalidation((prefix) => { if (path.startsWith(prefix)) retry(); });
  }, [path, retry]);

  useEffect(() => {
    if (!path) return;
    const previous = previousRequest.current;
    const force = previous?.path === path && previous.refreshVersion !== refreshVersion;
    previousRequest.current = { path, refreshVersion };
    let mounted = true;
    let request;
    let latestAttempt = 0;

    Promise.resolve().then(async () => {
      if (!mounted) return;
      const saved = cache.get(path);
      if (!force && saved && Date.now() - saved.updatedAt < PUBLIC_RESOURCE_MAX_AGE) {
        // A route may change paths within the same mounted component. Always
        // synchronize a fresh cache hit instead of leaving its old error/data.
        setResource(cachedState(path));
        return;
      }
      setResource((current) => {
        const state = current.path === path ? current : cachedState(path);
        return { ...state, path, status: state.data == null ? 'loading' : 'success', refreshing: state.data != null, recovering: false, error: null, nextRetryAt: null };
      });
      request = requestPublicResource(path, {
        loader, timeout,
        onProgress: (progress) => {
          latestAttempt = progress.attempt;
          if (mounted) setResource((current) => ({ ...current, ...progress }));
        },
      });
      try {
        const data = await request.promise;
        if (mounted) setResource({ ...cachedState(path), data, attempt: latestAttempt });
      } catch (error) {
        if (mounted && error?.name !== 'AbortError') setResource((current) => ({
          ...current, path, status: 'error', refreshing: false, recovering: false,
          error, attempt: error.attempts || current.attempt, nextRetryAt: error.retryAt || null,
          stale: current.data != null,
        }));
      } finally {
        request.release();
      }
    });

    return () => {
      mounted = false;
      request?.release();
    };
  }, [path, refreshVersion, loader, timeout]);

  useEffect(() => {
    if (!path) return;
    const revalidate = () => {
      if (document.visibilityState === 'hidden' || navigator.onLine === false) return;
      const state = resource.path === path ? resource : cachedState(path);
      if (state.status === 'error' && state.error?.transient === false) return;
      if (state.nextRetryAt && state.nextRetryAt > Date.now()) return;
      const saved = cache.get(path);
      const aging = !saved || Date.now() - saved.updatedAt >= PUBLIC_RESOURCE_MAX_AGE;
      if (state.status !== 'error' && !aging) return;
      if (lastWakeup.current.path === path && Date.now() - lastWakeup.current.at < 1000) return;
      lastWakeup.current = { path, at: Date.now() };
      retry();
    };
    window.addEventListener('online', revalidate);
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.removeEventListener('online', revalidate);
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [path, resource, retry]);

  const idle = { path: null, data: null, status: 'idle', refreshing: false, recovering: false, error: null, attempt: 0, maxAttempts: PUBLIC_RESOURCE_MAX_ATTEMPTS, nextRetryAt: null, updatedAt: null, stale: false };
  return { ...(path ? (resource.path === path ? resource : cachedState(path)) : idle), retry };
}
