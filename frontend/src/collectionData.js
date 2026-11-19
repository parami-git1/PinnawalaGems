import { API_BASE } from './api';
import { publicResourceCache } from './resourceCache';

const LEGACY_KEY = 'inventory/legacy-complete';
const CACHE_AGE = 60000;
const text = (value) => String(value ?? '').trim();
const folded = (value) => text(value).toLocaleLowerCase();
const categoryOf = (stone) => text(stone.categoryId?._id || stone.categoryId || stone.category?._id);
const weightOf = (stone) => {
  const stored = stone.caratWeight;
  const value = stored != null && stored !== '' ? Number(stored) : Number.parseFloat(text(stone.weight));
  return Number.isFinite(value) && value >= 0 ? value : null;
};

function invalidCatalog() {
  const error = new Error('The complete collection could not be verified. Please retry.');
  error.status = 422;
  return error;
}

async function read(path, signal) {
  const response = await fetch(`${API_BASE}/${path}`, { signal, cache: 'no-cache' });
  if (!response.ok) {
    const error = new Error(`Collection request failed: ${response.status}`);
    error.status = response.status;
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = Number(retryAfter);
      const retryAt = Number.isFinite(seconds) && seconds >= 0 ? Date.now() + seconds * 1000 : Date.parse(retryAfter);
      if (Number.isFinite(retryAt)) error.retryAt = Math.max(Date.now(), retryAt);
    }
    throw error;
  }
  return response.json();
}

function hasServerFilters(data) {
  return Array.isArray(data?.stones) && Array.isArray(data.categoryCounts)
    && data.filterOptions && typeof data.filterOptions === 'object'
    && Number.isSafeInteger(data.total) && data.total >= 0;
}

// The deployed legacy API supports only some filters. Never filter just its first
// page, or assume a response to a filtered request contains the whole inventory.
async function readCompleteLegacyCatalog(signal) {
  const first = await read('inventory/stones?limit=200&page=1', signal);
  if (Array.isArray(first)) return uniqueRecords(first);
  const pages = first?.totalPages;
  if (!Array.isArray(first?.stones) || !Number.isSafeInteger(pages) || pages < 0 || pages > 10000 || first.currentPage !== 1) throw invalidCatalog();
  if (pages > 0 && first.stones.length === 0) throw invalidCatalog();
  const stones = [...first.stones];
  for (let page = 2; page <= pages; page += 1) {
    const next = await read(`inventory/stones?limit=200&page=${page}`, signal);
    if (!Array.isArray(next?.stones) || next.currentPage !== page || next.totalPages !== pages || next.stones.length === 0) throw invalidCatalog();
    stones.push(...next.stones);
  }
  if (pages === 0 && stones.length > 0) throw invalidCatalog();
  const result = uniqueRecords(stones);
  if (Number.isSafeInteger(first.total) && first.total !== result.length) throw invalidCatalog();
  return result;
}

function uniqueRecords(stones) {
  if (stones.some((stone) => !stone || !text(stone._id))) throw invalidCatalog();
  if (new Set(stones.map((stone) => text(stone._id))).size !== stones.length) throw invalidCatalog();
  return stones;
}

function optionsFor(stones, field) {
  const values = new Map();
  for (const stone of stones) {
    const value = text(stone[field]);
    if (value && !values.has(folded(value))) values.set(folded(value), value);
  }
  return [...values.values()].sort((a, b) => a.localeCompare(b));
}

export function filterLegacyCatalog(stones, params) {
  const category = params.get('categoryId');
  const search = folded(params.get('search'));
  const min = params.has('minWeight') ? Number(params.get('minWeight')) : null;
  const max = params.has('maxWeight') ? Number(params.get('maxWeight')) : null;
  const fields = ['shape', 'cut', 'origin', 'color'];
  const filtered = stones.filter((stone) => {
    if (category && categoryOf(stone) !== category) return false;
    if (search && !['title', 'stoneId', 'color', 'shape', 'origin'].some((field) => folded(stone[field]).includes(search))) return false;
    if (fields.some((field) => params.get(field) && folded(stone[field]) !== folded(params.get(field)))) return false;
    if (params.has('hasCertificate') && (stone.hasCertificate === true) !== (params.get('hasCertificate') === 'true')) return false;
    const weight = weightOf(stone);
    return (min == null || (weight != null && weight >= min)) && (max == null || (weight != null && weight <= max));
  });
  const sort = params.get('sort') || 'featured';
  const newest = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || text(b._id).localeCompare(text(a._id));
  filtered.sort((a, b) => {
    if (sort === 'name') return text(a.title).localeCompare(text(b.title)) || text(a._id).localeCompare(text(b._id));
    if (sort === 'weight-low' || sort === 'weight-high') {
      const left = weightOf(a), right = weightOf(b);
      if (left == null || right == null) return (left == null) - (right == null) || text(a._id).localeCompare(text(b._id));
      return (sort === 'weight-low' ? left - right : right - left) || text(a._id).localeCompare(text(b._id));
    }
    return (sort === 'featured' ? Number(b.isFeatured === true) - Number(a.isFeatured === true) : 0) || newest(a, b);
  });
  const limit = Math.min(200, Math.max(1, Number(params.get('limit')) || 30));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const counts = new Map();
  for (const stone of stones) counts.set(categoryOf(stone), (counts.get(categoryOf(stone)) || 0) + 1);
  return {
    stones: filtered.slice((page - 1) * limit, page * limit), total: filtered.length,
    totalPages: Math.ceil(filtered.length / limit), currentPage: page, limit,
    categoryCounts: [...counts].map(([categoryId, count]) => ({ categoryId, count })),
    filterOptions: { shapes: optionsFor(stones, 'shape'), cuts: optionsFor(stones, 'cut'), origins: optionsFor(stones, 'origin'), colors: optionsFor(stones, 'color') },
  };
}

export async function loadCollectionResource(path, { signal } = {}) {
  const params = new URLSearchParams(path.split('?')[1]);
  const cached = publicResourceCache.get(LEGACY_KEY);
  if (cached && Date.now() - cached.updatedAt < CACHE_AGE) return filterLegacyCatalog(cached.data, params);
  const response = await read(path, signal);
  if (hasServerFilters(response)) return response;
  if (!Array.isArray(response) && !Array.isArray(response?.stones)) throw invalidCatalog();
  const stones = await readCompleteLegacyCatalog(signal);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  publicResourceCache.set(LEGACY_KEY, { data: stones, updatedAt: Date.now() });
  return filterLegacyCatalog(stones, params);
}
