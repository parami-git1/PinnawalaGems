export const BULK_GEM_LIMIT = 100;

export function parseBulkGemIds(value) {
  const empty = { ids: [], duplicates: [], tokenCount: 0, error: '' };
  if (typeof value !== 'string') return { ...empty, error: 'Paste gemstone IDs as text.' };
  if (value.length > 30000) return { ...empty, error: 'This list is too long. Use batches of up to 100 different gemstone IDs.' };
  const tokens = value.trim().split(/[\s,;]+/u).filter(Boolean);
  if (!tokens.length) return { ...empty, error: 'Enter at least one gemstone ID.' };
  if (tokens.length > 500) return { ...empty, tokenCount: tokens.length, error: 'There are too many entries. Remove repeated IDs and use a batch of up to 100 different IDs.' };
  const ids = [], duplicateIds = new Set(), seen = new Set();
  for (const token of tokens) {
    if (token.length > 160 || [...token].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
      return { ...empty, tokenCount: tokens.length, error: 'Each ID must contain 160 characters or fewer, without control characters.' };
    }
    const id = /^[a-f\d]{24}$/i.test(token) ? token.toLowerCase() : token;
    if (seen.has(id)) duplicateIds.add(id);
    else { seen.add(id); ids.push(id); }
  }
  return { ids, duplicates: [...duplicateIds], tokenCount: tokens.length, error: ids.length > BULK_GEM_LIMIT ? `Use up to ${BULK_GEM_LIMIT} different gemstone IDs per batch.` : '' };
}

export function bulkRowReference(row) {
  return typeof row === 'string' ? row : row?.stoneId || row?._id || row?.id || '';
}

export function bulkRemainingIds(result) {
  return [...new Set([...(Array.isArray(result?.changed) ? result.changed : []), ...(Array.isArray(result?.failed) ? result.failed : [])].map(bulkRowReference).filter(Boolean))];
}
