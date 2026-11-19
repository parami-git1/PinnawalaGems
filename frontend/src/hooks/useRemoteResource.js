import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { publicResourceCache as cache, subscribeResourceInvalidation } from '../resourceCache';

export { API_BASE } from '../api';
const CACHE_AGE = 60000;
const cachedState = (path) => ({ path, data: cache.get(path)?.data ?? null, status: cache.has(path) ? 'success' : 'loading', refreshing: false });

// Each resource settles independently. A slow API must never block the page.
export function useRemoteResource(path, { loader, timeout = 15000 } = {}) {
  const [attempt, setAttempt] = useState(0);
  const [resource, setResource] = useState(() => cachedState(path));
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => subscribeResourceInvalidation((prefix) => { if (path.startsWith(prefix)) retry(); }), [path, retry]);

  useEffect(() => {
    const saved = cache.get(path);
    if (!attempt && saved && Date.now() - saved.updatedAt < CACHE_AGE) return undefined;
    const controller = new AbortController();
    let mounted = true;
    const deadline = window.setTimeout(() => controller.abort(), timeout);

    async function load() {
      if (!mounted) return;
      setResource((current) => {
        const data = current.path === path ? current.data : cache.get(path)?.data ?? null;
        return { path, data, status: data == null ? 'loading' : 'success', refreshing: data != null };
      });
      try {
        let data;
        for (let round = 0; round < 2; round += 1) {
          try {
            if (loader) data = await loader(path, { signal: controller.signal });
            else {
              const response = await fetch(`${API_BASE}/${path}`, { signal: controller.signal, cache: 'no-cache' });
              if (!response.ok) { const error = new Error(`Request failed: ${response.status}`); error.status = response.status; throw error; }
              data = await response.json();
            }
            break;
          } catch (error) {
            if (round || controller.signal.aborted || (error.status && error.status < 500 && error.status !== 408)) throw error;
            await new Promise((resolve) => window.setTimeout(resolve, 400));
            if (controller.signal.aborted) throw error;
          }
        }
        if (mounted) {
          cache.set(path, { data, updatedAt: Date.now() });
          if (cache.size > 120) cache.delete(cache.keys().next().value);
          setResource({ path, data, status: 'success', refreshing: false });
        }
      } catch {
        if (mounted) setResource((current) => ({ ...current, status: 'error', refreshing: false }));
      } finally {
        window.clearTimeout(deadline);
      }
    }

    Promise.resolve().then(load);
    return () => {
      mounted = false;
      window.clearTimeout(deadline);
      controller.abort();
    };
  }, [path, attempt, loader, timeout]);

  return { ...(resource.path === path ? resource : cachedState(path)), retry };
}
