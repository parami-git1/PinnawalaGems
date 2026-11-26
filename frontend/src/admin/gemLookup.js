const text = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim().replace(/\s+/g, ' ') : '';
const mongoId = /^[a-f\d]{24}$/i;
const folded = value => text(value).toLowerCase();

export function gemLookupKey(row) {
  return row?.key || `${row?.source || ''}:${text(row?.id)}`;
}

export function lookupGems(rows, value, limit = 12) {
  const query = text(value);
  const maximum = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 12;
  if (!query) return { query, kind: 'empty', exact: [], candidates: [], total: 0, truncated: false };
  const unique = [...new Map((Array.isArray(rows) ? rows : []).filter(row => row && typeof row === 'object').map(row => [gemLookupKey(row), row])).values()];
  const exact = unique.filter(row => text(row.reference) === query || text(row.id) === query || (mongoId.test(query) && mongoId.test(text(row.id)) && folded(row.id) === folded(query)));
  if (exact.length) return { query, kind: 'exact', exact, candidates: exact.slice(0, maximum), total: exact.length, truncated: exact.length > maximum };
  if (query.length < 2) return { query, kind: 'incomplete', exact: [], candidates: [], total: 0, truncated: false };
  const needle = folded(query);
  const candidates = unique.filter(row => [row.reference, row.id, row.title, row.categoryName].some(part => folded(part).includes(needle)));
  return { query, kind: candidates.length ? 'suggested' : 'missing', exact: [], candidates: candidates.slice(0, maximum), total: candidates.length, truncated: candidates.length > maximum };
}

export function lookupPublicUrl(row) {
  const id = text(row?.id);
  return row?.source === 'showcase' && /^[a-z\d_-]{1,200}$/i.test(id) ? `/gem/${encodeURIComponent(id)}` : '';
}
