import assert from 'node:assert/strict';
import test from 'node:test';
import { caratNumber, facetValues, filterInventory, inventorySummary, normalizeInventory, rangeError } from '../src/admin/inventoryInsights.js';

function fixture() {
  return normalizeInventory({
    categories: [{ _id: 'shared-category', title: 'Website sapphire' }],
    stockCategories: [{ _id: 'shared-category', title: 'Private sapphire' }],
    stones: [{ _id: 'same-id', categoryId: 'shared-category', title: 'Blue display gem', stoneId: 'WEB-1', weight: '2.50 ct', quantity: 0, color: ' BLUE ', shape: 'Oval', price: '', isTopGem: true, isFeatured: true }],
    stockStones: [
      { _id: 'same-id', categoryId: 'shared-category', title: 'Blue private sapphire', stoneId: 'STK-1', weight: 2.5, quantity: 3, color: 'blue', shape: 'Oval', price: 100, hasCertificate: true, origin: 'Sri Lanka', treatment: 'Unheated' },
      { _id: 'reserved', categoryId: 'shared-category', title: 'Reserved blue sapphire', weight: 1, quantity: 2, color: 'Blue', shape: 'Round', price: 200, stockStatus: 'Reserved' },
      { _id: 'sold', categoryId: 'shared-category', title: 'Sold pink gem', weight: 3, quantity: 5, color: 'Pink', shape: 'Oval', price: 300, stockStatus: 'Sold' },
      { _id: 'excluded', categoryId: 'shared-category', title: 'Excluded blue gem', weight: 1.5, quantity: 4, color: 'blue', shape: 'Oval', includedInStock: false },
      { _id: 'unknown', title: 'Unmeasured gem', quantity: 1, weight: '', price: null },
    ],
  });
}

test('carat parsing accepts recorded units while rejecting invented numeric prefixes', () => {
  for (const [value, expected] of [[2.5, 2.5], ['2.50 ct', 2.5], [' 1.25 carats ', 1.25], ['0', 0]]) assert.equal(caratNumber(value), expected);
  for (const value of [null, undefined, '', ' ', '2.5 to 3 ct', '1.2abc', '-1', 'Infinity', Infinity]) assert.equal(caratNumber(value), null);
});

test('private and showcase records retain separate identities and category namespaces', () => {
  const rows = fixture();
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map(row => row.key)).size, 6);
  assert.equal(rows.find(row => row.key === 'stock:same-id').categoryName, 'Private sapphire');
  assert.equal(rows.find(row => row.key === 'showcase:same-id').categoryName, 'Website sapphire');
  assert.notEqual(rows[0].categoryKey, rows.at(-1).categoryKey);
});

test('zero quantity and unknown price stay zero and unknown instead of receiving defaults', () => {
  const showcase = fixture().find(row => row.source === 'showcase');
  assert.equal(showcase.quantity, 0);
  assert.equal(showcase.price, null);
  const missing = normalizeInventory({ stockStones: [{ _id: 'missing', title: 'Missing quantity' }] })[0];
  assert.equal(missing.quantityKnown, false);
  assert.equal(inventorySummary([missing]).unknownQuantityRecords, 1);
  assert.equal(filterInventory([missing], { availability: 'out' }).length, 0, 'Missing quantity is not known zero stock');
});

test('customer-call filters combine source, normalised colour, shape, carats and certificate', () => {
  const result = filterInventory(fixture(), { source: 'stock', color: ' BLUE ', shape: ' oval ', minWeight: '2', maxWeight: '3', certification: 'yes', availability: 'available', inclusion: 'included' });
  assert.deepEqual(result.map(row => row.id), ['same-id']);
  assert.deepEqual(filterInventory(fixture(), { source: 'stock', search: 'blue private STK-1' }).map(row => row.id), ['same-id']);
});

test('available pieces exclude reserved, sold and explicitly excluded stock', () => {
  const stockRows = fixture().filter(row => row.source === 'stock');
  const summary = inventorySummary(stockRows);
  assert.equal(summary.availablePieces, 4);
  assert.equal(summary.reservedPieces, 2);
  assert.equal(summary.soldPieces, 5);
  assert.deepEqual(filterInventory(stockRows, { availability: 'available' }).map(row => row.id), ['same-id', 'unknown']);
  assert.deepEqual(filterInventory(stockRows, { inclusion: 'excluded' }).map(row => row.id), ['excluded']);
});

test('recorded carats and value are quantity weighted, with missing values disclosed', () => {
  const rows = fixture().filter(row => ['same-id', 'unknown'].includes(row.id) && row.source === 'stock');
  const summary = inventorySummary(rows);
  assert.equal(summary.pieces, 4);
  assert.equal(summary.recordedCarats, 7.5);
  assert.equal(summary.recordedValue, 300);
  assert.equal(summary.unknownWeightPieces, 1);
  assert.equal(summary.unpricedPieces, 1);
});

test('unknown weights and prices never match a numeric range, including zero boundary', () => {
  const rows = fixture();
  assert.equal(filterInventory(rows, { minWeight: '0' }).some(row => row.id === 'unknown'), false);
  assert.equal(filterInventory(rows, { minPrice: '0' }).some(row => row.price === null), false);
  assert.match(rangeError({ minWeight: '3', maxWeight: '2' }), /Minimum carat/);
  assert.deepEqual(filterInventory(rows, { minWeight: '3', maxWeight: '2' }), []);
  assert.deepEqual(filterInventory(rows, { minPrice: '-1' }), []);
});

test('colour facets merge case and whitespace variants without duplicating pieces', () => {
  const blue = facetValues(fixture(), 'color').find(group => group.value === 'blue');
  assert.equal(blue.records, 4);
  assert.equal(blue.pieces, 9);
  const categories = facetValues(fixture(), 'category');
  assert.equal(categories.filter(group => group.value.includes('shared-category')).length, 2);
});

test('showcase and placement counts include listed zero-quantity gems without implying stock', () => {
  const showcase = filterInventory(fixture(), { source: 'showcase' });
  const summary = inventorySummary(showcase);
  assert.equal(summary.records, 1);
  assert.equal(summary.availablePieces, 0);
  assert.equal(summary.homepageRecords, 1);
  assert.equal(summary.featuredRecords, 1);
  assert.equal(filterInventory(fixture(), { placement: 'homepage' }).length, 1);
});
