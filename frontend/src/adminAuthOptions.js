import { apiRequest, ApiError } from './api';

function pauseBeforeRetry(signal) {
  return new Promise((resolve, reject) => {
    const cancelled = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Sign-in setup was cancelled.', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', cancelled);
      resolve();
    }, 500);
    if (signal?.aborted) cancelled();
    else signal?.addEventListener('abort', cancelled, { once: true });
  });
}

// A successful policy response is authoritative. If this discovery endpoint is
// unavailable, the page may still present credentials for server verification;
// neither login nor the protected session check is bypassed.
export async function fetchAdminAuthOptions(signal) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const options = await apiRequest('/admin/auth-options', { signal, cache: 'no-store' }, { auth: false, timeout: 8000 });
      if (typeof options?.passwordEnabled !== 'boolean' || typeof options?.googleEnabled !== 'boolean'
        || typeof options.googleClientId !== 'string'
        || (options.googleEnabled && !/^[a-z\d._-]+\.apps\.googleusercontent\.com$/i.test(options.googleClientId))) {
        throw new ApiError('Sign-in options could not be verified. Please try again.', 0, 'INVALID_AUTH_OPTIONS');
      }
      return options;
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') throw error;
      const transient = ['CONNECTION', 'TIMEOUT'].includes(error.code) || error.status === 408 || error.status >= 500;
      if (!transient || attempt > 0) throw error;
      await pauseBeforeRetry(signal);
    }
  }
}
