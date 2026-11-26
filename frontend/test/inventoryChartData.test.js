import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInventoryChartData, chartMetricValue, chartRows, gemstoneChartColour } from '../src/admin/inventoryChartData.js';
import { normalizeInventory } from '../src/admin/inventoryInsights.js';

function fixture() {
  return normalizeInventory({
    categories: [{ _id: 'blue', title: 'Blue Sapphire' }, { _id: 'ruby', title: 'Ruby' }],
    stockCategories: [{ _id: 'blue', title: 'Blue Sapphire' }, { _id: 'ruby', title: 'Ruby' }],
    stockStones: [
      { _id: 'same-id', categoryId: 'blue', title: 'Blue private gem', quantity: 3, weight: 2.5, price: 12500.25, color: 'Blue', hasCertificate: true },
      { _id: 'red', categoryId: 'ruby', title: 'Red private gem', quantity: 2, weight: 1.25, price: 20000, color: 'Red' },
      { _id: 'reserved', categoryId: 'blue', title: 'Reserved gem', quantity: 4, weight: 1, price: 100, stockStatus: 'Reserved' },
      { _id: 'sold', categoryId: 'blue', title: 'Sold gem', quantity: 6, weight: 2, price: 200, stockStatus: 'Sold' },
      { _id: 'excluded', categoryId: 'blue', title: 'Excluded gem', quantity: 8, includedInStock: false },
      { _id: 'zero', categoryId: 'blue', title: 'Known zero', quantity: 0 },
      { _id: 'unknown', categoryId: 'ruby', title: 'No quantity or measurements' },
      { _id: 'archived', categoryId: 'blue', title: 'Removed gem', quantity: 50, archivedAt: '2026-11-01T00:00:00.000Z' },
    ],
    stones: [
      { _id: 'same-id', categoryId: 'blue', title: 'Independent showcase gem', quantity: 0, weight: '2 ct', price: null },
      { _id: 'web-ruby', categoryId: 'ruby', title: 'Website ruby', quantity: 7, weight: '1 ct', price: 900, includedInStock: false },
    ],
  });
}

test('stock charts use only included available positive stock by default and never merge showcase records', () => {
  const data = buildInventoryChartData(fixture());
  assert.equal(data.source, 'stock'); assert.equal(data.metric, 'pieces'); assert.equal(data.total, 5);
  assert.equal(data.totals.records, 2); assert.equal(data.totals.recordedCarats, 10);
  assert.equal(data.totals.recordedValue, 77500.75);
  assert.deepEqual(data.categories.map(value => value.key), ['stock:blue', 'stock:ruby']);
  assert.deepEqual(data.categories.map(value => value.share), [60, 40]);
  assert.deepEqual(data.categories.map(value => value.offset), [0, 60]);
});

test('all included stock mode retains reserved/sold/zero/unknown rows but excludes removed and consignment rows', () => {
  const rows = chartRows(fixture(), { source: 'stock', availability: 'all' });
  assert.deepEqual(rows.map(row => row.id), ['same-id', 'red', 'reserved', 'sold', 'zero', 'unknown']);
  const data = buildInventoryChartData(fixture(), { source: 'stock', availability: 'all', metric: 'records' });
  assert.equal(data.total, 6); assert.equal(data.totals.pieces, 15); assert.equal(data.totals.unknownQuantityRecords, 1);
});

test('website charts count every active listing including zero quantity and stock-excluded listings', () => {
  const data = buildInventoryChartData(fixture(), { source: 'showcase' });
  assert.equal(data.metric, 'records'); assert.equal(data.total, 2); assert.equal(data.totals.pieces, 7);
  assert.deepEqual(data.categories.map(group => group.key).sort(), ['showcase:blue', 'showcase:ruby']);
  assert.equal(buildInventoryChartData(fixture(), { source: 'showcase', metric: 'carats' }).total, 7);
});

test('recorded carat and value charts are quantity weighted and do not round stored amounts', () => {
  assert.equal(buildInventoryChartData(fixture(), { metric: 'carats' }).total, 10);
  assert.equal(buildInventoryChartData(fixture(), { metric: 'value' }).total, 77500.75);
  assert.equal(buildInventoryChartData(fixture(), { metric: 'records' }).total, 2);
});

test('unknown measurements remain null when nothing is usable, while partial totals disclose omissions', () => {
  const rows = normalizeInventory({ stockStones: [{ _id: 'missing-measurements', quantity: 2 }, { _id: 'unknown-quantity', weight: 2, price: 400 }] });
  const data = buildInventoryChartData(rows, { metric: 'carats', availability: 'all' });
  assert.equal(data.total, null); assert.equal(data.categories[0].value, null);
  assert.equal(data.totals.unweighedPieces, 2); assert.equal(data.totals.unpricedPieces, 2); assert.equal(data.totals.unknownQuantityRecords, 1);
  assert.equal(data.categories[0].share, 0);
  const partial = buildInventoryChartData([...rows, ...fixture()], { metric: 'carats', availability: 'all' });
  assert.equal(partial.total, 26); assert.equal(partial.totals.unweighedPieces, 2); assert.equal(partial.totals.unknownQuantityRecords, 2);
});

test('a valid zero is not missing and a genuinely empty loaded dataset has zero totals', () => {
  const data = buildInventoryChartData(normalizeInventory({ stockStones: [{ _id: 'zero-weight-and-price', quantity: 1, weight: 0, price: 0 }] }), { metric: 'value' });
  assert.equal(data.total, 0); assert.equal(data.totals.unpricedPieces, 0);
  assert.equal(chartMetricValue(data.totals, 'carats'), 0);
  for (const metric of ['pieces', 'records', 'carats', 'value']) assert.equal(buildInventoryChartData([], { metric }).total, 0);
});

test('category colours follow gemstone hues and reject CSS payloads with deterministic safe fallback', () => {
  const blue = gemstoneChartColour('Blue Sapphire');
  assert.equal(blue, '#416ac4'); assert.equal(gemstoneChartColour('Ruby'), '#b83f5e');
  assert.equal(gemstoneChartColour('Pink Sapphire'), '#ca7198'); assert.equal(gemstoneChartColour('Yellow Sapphire'), '#c6a23e');
  assert.equal(gemstoneChartColour('Emerald'), '#359576');
  assert.equal(gemstoneChartColour('Sapphire', ['Pink']), '#ca7198');
  assert.equal(gemstoneChartColour('Custom category', ['#ABC']), '#aabbcc');
  const fallback = gemstoneChartColour('Custom category', ['url(javascript:alert(1))']);
  assert.match(fallback, /^#[a-f\d]{6}$/); assert.equal(fallback, gemstoneChartColour('Custom category'));
  assert.equal(gemstoneChartColour('Blue Sapphire', ['Red']), blue);
  assert.equal(gemstoneChartColour('Featured gemstones', ['Blue']), blue);
  assert.equal(gemstoneChartColour('Green Garnet'), '#359576');
  assert.equal(gemstoneChartColour('Orange Sapphire'), '#d28b48');
  assert.equal(gemstoneChartColour('BlueSapphire'), blue);
});

test('every category is retained and metric switching never mutates the input rows', () => {
  const rows = normalizeInventory({ stockStones: Array.from({ length: 15 }, (_, index) => ({ _id: `stone-${index}`, categoryId: `category-${index}`, quantity: index + 1, weight: 1, price: 10 })), stockCategories: Array.from({ length: 15 }, (_, index) => ({ _id: `category-${index}`, title: `Category ${index}` })) });
  const original = JSON.stringify(rows);
  const data = buildInventoryChartData(rows, { metric: 'pieces' });
  assert.equal(data.categories.length, 15); assert.equal(data.total, 120);
  assert(Math.abs(data.categories.reduce((sum, group) => sum + group.share, 0) - 100) < .000001);
  buildInventoryChartData(rows, { metric: 'value' }); assert.equal(JSON.stringify(rows), original);
});
