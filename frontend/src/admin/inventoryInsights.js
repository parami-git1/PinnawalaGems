const list = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim().replace(/\s+/g, ' ') : '';
export const canonical = value => text(value).toLowerCase();

export function caratNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string' || !/^\s*\d+(?:\.\d+)?\s*(?:ct|cts|carat|carats)?\s*$/i.test(value)) return null;
  const result = Number.parseFloat(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}

function amount(value) {
  if (value === null || value === undefined || text(value) === '') return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}

function normalizeRows(items, categories, source) {
  const names = new Map(list(categories).map(category => [String(category._id), text(category.title) || 'Uncategorised']));
  return list(items).map((item, index) => {
    const category = item.categoryId;
    const id = typeof category === 'object' && category ? category._id : category;
    const categoryName = names.get(String(id)) || text(category?.title) || 'Uncategorised';
    const quantity = amount(item.quantity);
    const validQuantity = quantity !== null && Number.isInteger(quantity);
    const status = ['available', 'reserved', 'sold'].includes(canonical(item.stockStatus)) ? canonical(item.stockStatus) : 'available';
    return {
      key: `${source}:${item._id || index}`, source, original: item, id: text(item._id), reference: text(item.stoneId),
      title: text(item.title) || 'Untitled gemstone', categoryKey: `${source}:${id || 'uncategorised'}`, categoryName,
      color: text(item.color), shape: text(item.shape), cut: text(item.cut), origin: text(item.origin), treatment: text(item.treatment) || 'Unspecified',
      weight: caratNumber(item.caratWeight) ?? caratNumber(item.weight), price: amount(item.price),
      quantity: validQuantity ? quantity : 0, quantityKnown: validQuantity, includedInStock: item.includedInStock !== false, status,
      hasCertificate: item.hasCertificate === true,
      isTopGem: source === 'showcase' && item.isTopGem === true, isFeatured: source === 'showcase' && item.isFeatured === true,
      image: text(item.image),
    };
  });
}

// Independent record sets: their IDs do not link the same physical gemstone.
export function normalizeInventory({ stones, categories, stockStones, stockCategories } = {}) {
  return [...normalizeRows(stockStones, stockCategories, 'stock'), ...normalizeRows(stones, categories, 'showcase')];
}

export const DEFAULT_INSIGHT_FILTERS = {
  search: '', source: 'stock', category: '', color: '', shape: '', cut: '', origin: '',
  minWeight: '', maxWeight: '', availability: '', inclusion: 'included', certification: '',
  minPrice: '', maxPrice: '', treatment: '', placement: '',
};

function bound(value) { return value === '' || value === null || value === undefined ? null : amount(value); }
export function rangeError(filters) {
  for (const [minKey, maxKey, label] of [['minWeight', 'maxWeight', 'carat'], ['minPrice', 'maxPrice', 'price']]) {
    const low = bound(filters[minKey]), high = bound(filters[maxKey]);
    if ((text(filters[minKey]) && low === null) || (text(filters[maxKey]) && high === null)) return `Enter a valid, non-negative ${label} range.`;
    if (low !== null && high !== null && low > high) return `Minimum ${label} must not be greater than maximum ${label}.`;
  }
  return '';
}

export function filterInventory(rows, filters = {}) {
  if (rangeError(filters)) return [];
  const terms = canonical(filters.search).split(' ').filter(Boolean);
  const minWeight = bound(filters.minWeight), maxWeight = bound(filters.maxWeight), minPrice = bound(filters.minPrice), maxPrice = bound(filters.maxPrice);
  return list(rows).filter(row => {
    if (filters.source && filters.source !== 'all' && row.source !== filters.source) return false;
    if (filters.category && row.categoryKey !== filters.category) return false;
    if (['color', 'shape', 'cut', 'origin', 'treatment'].some(key => filters[key] && canonical(row[key]) !== canonical(filters[key]))) return false;
    if (filters.inclusion === 'included' && !row.includedInStock) return false;
    if (filters.inclusion === 'excluded' && row.includedInStock) return false;
    if (filters.availability === 'available' && !(row.quantity > 0 && row.status === 'available' && row.includedInStock)) return false;
    if (filters.availability === 'out' && (!row.quantityKnown || row.quantity > 0)) return false;
    if (['reserved', 'sold'].includes(filters.availability) && row.status !== filters.availability) return false;
    if (filters.certification === 'yes' && !row.hasCertificate) return false;
    if (filters.certification === 'no' && row.hasCertificate) return false;
    if (filters.placement === 'homepage' && !row.isTopGem) return false;
    if (filters.placement === 'featured' && !row.isFeatured) return false;
    if ((minWeight !== null || maxWeight !== null) && row.weight === null) return false;
    if (minWeight !== null && row.weight < minWeight) return false;
    if (maxWeight !== null && row.weight > maxWeight) return false;
    if ((minPrice !== null || maxPrice !== null) && row.price === null) return false;
    if (minPrice !== null && row.price < minPrice) return false;
    if (maxPrice !== null && row.price > maxPrice) return false;
    const searchable = canonical([row.title, row.reference, row.categoryName, row.color, row.shape, row.cut, row.origin].join(' '));
    return terms.every(term => searchable.includes(term));
  });
}

export function inventorySummary(rows) {
  const summary = { records: 0, pieces: 0, availablePieces: 0, reservedPieces: 0, soldPieces: 0, recordedCarats: 0, recordedValue: 0, unknownWeightPieces: 0, unpricedPieces: 0, unknownQuantityRecords: 0, minWeight: null, maxWeight: null, certifiedRecords: 0, homepageRecords: 0, featuredRecords: 0 };
  for (const row of list(rows)) {
    summary.records++; summary.pieces += row.quantity;
    if (!row.quantityKnown) summary.unknownQuantityRecords++;
    if (row.includedInStock && row.status === 'available') summary.availablePieces += row.quantity;
    if (row.includedInStock && row.status === 'reserved') summary.reservedPieces += row.quantity;
    if (row.includedInStock && row.status === 'sold') summary.soldPieces += row.quantity;
    if (row.weight === null) summary.unknownWeightPieces += row.quantity;
    else { summary.recordedCarats += row.weight * row.quantity; summary.minWeight = summary.minWeight === null ? row.weight : Math.min(summary.minWeight, row.weight); summary.maxWeight = summary.maxWeight === null ? row.weight : Math.max(summary.maxWeight, row.weight); }
    if (row.price === null) summary.unpricedPieces += row.quantity; else summary.recordedValue += row.price * row.quantity;
    if (row.hasCertificate) summary.certifiedRecords++;
    if (row.isTopGem) summary.homepageRecords++;
    if (row.isFeatured) summary.featuredRecords++;
  }
  return summary;
}

export function facetValues(rows, field) {
  const groups = new Map();
  for (const row of list(rows)) {
    const label = field === 'category' ? row.categoryName : text(row[field]) || 'Unspecified';
    const value = field === 'category' ? row.categoryKey : canonical(row[field]);
    if (!value) continue;
    const group = groups.get(value) || { value, label, records: 0, pieces: 0, source: row.source };
    group.records++; group.pieces += row.quantity; groups.set(value, group);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}
