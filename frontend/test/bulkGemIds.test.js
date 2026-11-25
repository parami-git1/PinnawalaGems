import assert from 'node:assert/strict';
import test from 'node:test';
import { bulkRemainingIds, parseBulkGemIds } from '../src/admin/bulkGemIds.js';

test('bulk IDs parse common pasted separators while preserving exact reference spelling', () => {
  assert.deepEqual(parseBulkGemIds(' Blue-Sapphire-1, ruby-2;\nstock-3\tGem4 ').ids, ['Blue-Sapphire-1', 'ruby-2', 'stock-3', 'Gem4']);
});
test('repeated references and uppercase ObjectIDs count once without case-folding reference IDs', () => {
  const result = parseBulkGemIds('ABCDEF1234567890ABCDEF12 abcdef1234567890abcdef12 Ruby-1 Ruby-1 ruby-1');
  assert.deepEqual(result.ids, ['abcdef1234567890abcdef12', 'Ruby-1', 'ruby-1']);
  assert.deepEqual(result.duplicates, ['abcdef1234567890abcdef12', 'Ruby-1']);
});
test('empty, oversized and non-text batches are rejected before a request', () => {
  assert(parseBulkGemIds('').error);
  assert(parseBulkGemIds(['gem']).error);
  assert(parseBulkGemIds('a'.repeat(161)).error);
  assert(parseBulkGemIds(Array.from({ length: 101 }, (_, index) => `Gem-${index}`).join('\n')).error);
  assert.equal(parseBulkGemIds(Array.from({ length: 100 }, (_, index) => `Gem-${index}`).join('\n')).error, '');
});
test('control characters are rejected while literal punctuation is never interpreted as a pattern', () => {
  assert(parseBulkGemIds('Gem\u0000bad').error);
  assert.deepEqual(parseBulkGemIds('gem[1] gem.*').ids, ['gem[1]', 'gem.*']);
});
test('partial retries include only changed or failed records and retain their exact identifiers', () => {
  assert.deepEqual(bulkRemainingIds({ removed: [{ stoneId: 'done' }], alreadyRemoved: [{ stoneId: 'old' }], changed: [{ stoneId: 'Changed' }], failed: [{ _id: 'record-id' }, { stoneId: 'Changed' }] }), ['Changed', 'record-id']);
});
