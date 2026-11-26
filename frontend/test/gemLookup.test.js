import test from 'node:test';
import assert from 'node:assert/strict';
import { gemLookupKey, lookupGems, lookupPublicUrl } from '../src/admin/gemLookup.js';

const row = (source, id, reference, more = {}) => ({ key: `${source}:${id}`, source, id, reference, title: 'Blue sapphire', categoryName: 'Sapphires', ...more });

test('exact IDs win over fuzzy titles across both record sources and keep the original record identity', () => {
  const stock = row('stock', 'stock-a', 'GEM-001', { includedInStock: false, status: 'sold', quantity: 0 });
  const showcase = row('showcase', 'web-a', 'GEM-002', { title: 'GEM-001 blue sapphire' });
  const result = lookupGems([stock, showcase], '  GEM-001  ');
  assert.equal(result.kind, 'exact'); assert.deepEqual(result.candidates, [stock]); assert.equal(result.exact[0], stock);
});

test('duplicate human references stay ambiguous across private and website sources', () => {
  const rows = [row('stock', 'same-id', 'GEM-001'), row('showcase', 'same-id', 'GEM-001')];
  const result = lookupGems(rows, 'GEM-001');
  assert.equal(result.exact.length, 2); assert.equal(result.total, 2); assert.notEqual(gemLookupKey(rows[0]), gemLookupKey(rows[1]));
});

test('human reference case is preserved while Mongo record IDs compare without case', () => {
  const original = row('showcase', '0123456789abcdefabcdefab', 'Case-Sensitive');
  assert.equal(lookupGems([original], 'case-sensitive').exact.length, 0);
  assert.equal(lookupGems([original], 'case-sensitive').kind, 'suggested');
  assert.equal(lookupGems([original], '0123456789ABCDEFABCDEFAB').exact[0], original);
  assert.equal(lookupGems([original], 'Case-Sensitive').exact[0], original);
});

test('missing and partial input never silently select a gemstone', () => {
  const original = row('stock', 'stock-a', 'GEM-001');
  assert.equal(lookupGems([original], '').kind, 'empty'); assert.equal(lookupGems([original], 'G').kind, 'incomplete');
  assert.equal(lookupGems([original], 'missing').kind, 'missing');
  assert.equal(lookupGems([original], 'blue').kind, 'suggested'); assert.equal(lookupGems([original], 'blue').exact.length, 0);
});

test('large result sets disclose their full count and repeated copies of one record count once', () => {
  const rows = Array.from({ length: 20 }, (_, index) => row('stock', `id-${index}`, `GEM-${index}`));
  const result = lookupGems([...rows, rows[0]], 'GEM-', 8);
  assert.equal(result.total, 20); assert.equal(result.candidates.length, 8); assert.equal(result.truncated, true);
});

test('literal punctuation cannot become a pattern or executable search', () => {
  const original = row('stock', 'stock-a', '(a+)+$');
  assert.equal(lookupGems([original], '(a+)+$').exact[0], original);
  assert.equal(lookupGems([original], { $ne: null }).kind, 'empty');
});

test('only safe website record IDs receive public item links', () => {
  assert.equal(lookupPublicUrl(row('showcase', 'record-a', 'ID')), '/gem/record-a');
  assert.equal(lookupPublicUrl(row('stock', 'record-a', 'ID')), '');
  for (const id of ['../admin', 'javascript:alert(1)', 'bad?id=secret', '']) assert.equal(lookupPublicUrl(row('showcase', id, 'ID')), '');
});
