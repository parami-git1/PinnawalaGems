export const publicResourceCache = new Map();
export const PUBLIC_RESOURCE_MAX_AGE = 60000;
const subscribers = new Set();

export function storePublicResource(path, data) {
  publicResourceCache.set(path, { data, updatedAt: Date.now() });
  if (publicResourceCache.size > 120) publicResourceCache.delete(publicResourceCache.keys().next().value);
}

export function affectedResource(path) {
  const clean = String(path).replace(/^\/?api\//, '').replace(/^\//, '').split('?')[0];
  return clean.startsWith('inventory/') ? 'inventory/' : clean.split('/')[0];
}

export function invalidatePublicResources(path) {
  const prefix = affectedResource(path);
  if (!['home', 'contact', 'inventory/', 'feedback', 'workshop', 'event-ads'].includes(prefix)) return;
  for (const key of publicResourceCache.keys()) if (key.startsWith(prefix)) publicResourceCache.delete(key);
  subscribers.forEach((subscriber) => subscriber(prefix));
}

export function subscribeResourceInvalidation(subscriber) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}
