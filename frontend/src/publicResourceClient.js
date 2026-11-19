import { API_BASE } from './api';
import { storePublicResource, subscribeResourceInvalidation } from './resourceCache';

export const PUBLIC_RESOURCE_MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [600, 1800];
const MAX_RETRY_WAIT = 30000;
const pending = new Map();
const cooldowns = new Map();
const loaderIds = new WeakMap();
let nextLoaderId = 0;

function cancelled() {
  return new DOMException('The resource request was cancelled.', 'AbortError');
}

function failure(error) {
  if (error?.name === 'AbortError') return error;
  if (error?.name === 'PublicResourceError') return error;
  const result = new Error(error?.message || 'The public resource could not be loaded.');
  result.name = 'PublicResourceError';
  result.status = Number(error?.status) || 0;
  result.code = error?.code || (result.status ? 'HTTP' : 'CONNECTION');
  result.transient = result.status
    ? result.status === 408 || result.status === 429 || (result.status >= 500 && result.status <= 599)
    : !['INVALID_RESPONSE', 'INVALID_DATA'].includes(result.code)
      && (error instanceof TypeError || ['NetworkError', 'TimeoutError'].includes(error?.name) || ['TIMEOUT', 'CONNECTION'].includes(error?.code));
  result.retryAt = error?.retryAt || null;
  return result;
}

function retryTime(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Date.now() + seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(Date.now(), date) : null;
}

async function readJson(path, signal) {
  const response = await fetch(`${API_BASE}/${path}`, { signal, cache: 'no-cache' });
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    error.retryAt = retryTime(response.headers.get('Retry-After'));
    throw error;
  }
  try {
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw cancelled();
    if (error instanceof SyntaxError) {
      error.code = 'INVALID_RESPONSE';
      error.status = response.status;
    }
    throw error;
  }
}

// A fresh controller and deadline cover both headers and JSON parsing on every
// attempt. Racing cancellation also bounds custom loaders that ignore signals.
async function attemptRequest(path, loader, timeout, signal) {
  if (signal.aborted) throw cancelled();
  const controller = new AbortController();
  let stop;
  let timer;
  let timedOut = false;
  const interrupted = new Promise((resolve, reject) => {
    stop = () => { reject(cancelled()); controller.abort(); };
    signal.addEventListener('abort', stop, { once: true });
    timer = window.setTimeout(() => {
      timedOut = true;
      const error = new Error('The public resource request took too long.');
      error.code = 'TIMEOUT';
      reject(failure(error));
      controller.abort();
    }, timeout);
  });
  try {
    const work = Promise.resolve().then(() => {
      if (controller.signal.aborted) throw cancelled();
      return loader ? loader(path, { signal: controller.signal }) : readJson(path, controller.signal);
    });
    return await Promise.race([work, interrupted]);
  } catch (error) {
    if (signal.aborted) throw cancelled();
    if (timedOut) {
      const timeoutError = new Error('The public resource request took too long.');
      timeoutError.code = 'TIMEOUT';
      throw failure(timeoutError);
    }
    if (error?.name === 'AbortError') {
      // A loader can cancel its own work independently. Only our subscriber
      // cancellation may silently end the request; an unexpected abort recovers.
      const interruptedError = new Error('The public resource request was interrupted.');
      interruptedError.code = 'CONNECTION';
      throw failure(interruptedError);
    }
    throw failure(error);
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener('abort', stop);
  }
}

function waitForRetry(delay, signal) {
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    const stop = () => { window.clearTimeout(timer); reject(cancelled()); };
    const timer = window.setTimeout(() => { signal.removeEventListener('abort', stop); resolve(); }, delay);
    signal.addEventListener('abort', stop, { once: true });
  });
}

function publish(entry, update) {
  entry.progress = { ...entry.progress, ...update };
  entry.subscribers.forEach(({ onProgress }) => onProgress?.(entry.progress));
}

async function recover(entry) {
  const { path, loader, timeout, controller, key } = entry;
  const blocked = cooldowns.get(key);
  if (blocked?.retryAt > Date.now()) throw blocked;
  cooldowns.delete(key);
  for (let round = 0; round < PUBLIC_RESOURCE_MAX_ATTEMPTS; round += 1) {
    if (controller.signal.aborted) throw cancelled();
    publish(entry, { attempt: round + 1, recovering: round > 0, nextRetryAt: null });
    try {
      const data = await attemptRequest(path, loader, timeout, controller.signal);
      if (controller.signal.aborted) throw cancelled();
      cooldowns.delete(key);
      storePublicResource(path, data);
      return data;
    } catch (caught) {
      if (controller.signal.aborted || caught?.name === 'AbortError') throw cancelled();
      const error = failure(caught);
      error.attempts = round + 1;
      if (error.retryAt > Date.now()) {
        cooldowns.set(key, error);
        if (cooldowns.size > 120) cooldowns.delete(cooldowns.keys().next().value);
      }
      const delay = Math.max(RETRY_DELAYS[round] || 0, (error.retryAt || 0) - Date.now());
      // Long server cooldowns remain visible errors; never retry before the
      // server permits it or leave a background timer running for hours.
      if (!error.transient || round + 1 === PUBLIC_RESOURCE_MAX_ATTEMPTS || delay > MAX_RETRY_WAIT) throw error;
      publish(entry, { error, recovering: true, nextRetryAt: Date.now() + delay });
      await waitForRetry(delay, controller.signal);
    }
  }
}

// Only anonymous GET resources use this client. Different custom loaders and
// deadlines are separate requests, while identical consumers share recovery.
export function requestPublicResource(path, { loader, timeout = 15000, onProgress } = {}) {
  const deadline = Number.isFinite(Number(timeout)) && Number(timeout) > 0 ? Math.min(Number(timeout), 2147483647) : 15000;
  if (loader && !loaderIds.has(loader)) loaderIds.set(loader, ++nextLoaderId);
  const key = `${path}\n${loader ? loaderIds.get(loader) : 'fetch'}\n${deadline}`;
  let entry = pending.get(key);
  if (!entry || entry.controller.signal.aborted) {
    entry = {
      key, path, loader, timeout: deadline, controller: new AbortController(),
      subscribers: new Set(), abortTimer: null, settled: false,
      progress: { attempt: 0, maxAttempts: PUBLIC_RESOURCE_MAX_ATTEMPTS, recovering: false, error: null, nextRetryAt: null },
    };
    pending.set(key, entry);
    entry.promise = Promise.resolve().then(() => recover(entry)).finally(() => {
      entry.settled = true;
      window.clearTimeout(entry.abortTimer);
      if (pending.get(key) === entry) pending.delete(key);
    });
  }
  window.clearTimeout(entry.abortTimer);
  const subscriber = { onProgress };
  entry.subscribers.add(subscriber);
  onProgress?.(entry.progress);
  let released = false;
  return {
    promise: entry.promise,
    release() {
      if (released) return;
      released = true;
      entry.subscribers.delete(subscriber);
      if (entry.subscribers.size || entry.settled) return;
      // React StrictMode immediately subscribes again during its effect replay.
      // One event-loop turn lets that subscriber reuse the same GET safely.
      entry.abortTimer = window.setTimeout(() => {
        if (entry.subscribers.size || entry.settled) return;
        if (pending.get(key) === entry) pending.delete(key);
        entry.controller.abort();
      }, 0);
    },
  };
}

subscribeResourceInvalidation((prefix) => {
  for (const [key, entry] of pending) {
    if (!entry.path.startsWith(prefix)) continue;
    pending.delete(key);
    window.clearTimeout(entry.abortTimer);
    entry.controller.abort();
  }
});
