import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyStore, recordSale, totals, validateStore, localDate } from '../src/store.js';
const fixture = () => ({ ...emptyStore(), products: [{ id: 'p1', name: 'Blusa Zara', type: 'Blusa', quantity: 3, buy: 1050, sell: 1999, created: '2026-09-01' }] });
test('una venta descuenta unidades y conserva los precios históricos', () => {
  const original = fixture(); const result = recordSale(original, 'p1', 2, new Date(2026, 8, 27, 12));
  assert.equal(result.products[0].quantity, 1); assert.equal(original.products[0].quantity, 3);
  assert.equal(result.sales[0].date, '2026-09-27');
  result.products[0].sell = 3000;
  assert.deepEqual(totals(result.sales), { revenue: 3998, cost: 2100, units: 2 });
  assert.doesNotThrow(() => validateStore(result));
});
test('rechaza cantidades inválidas y ventas sin stock', () => {
  for (const n of [0, -1, 4, 1.5, NaN]) assert.throws(() => recordSale(fixture(), 'p1', n));
  const sold = recordSale(fixture(), 'p1', 3); assert.throws(() => recordSale(sold, 'p1', 1));
});
test('los respaldos se validan y sobreviven a serialización', () => {
  const data = recordSale(fixture(), 'p1', 1); assert.deepEqual(validateStore(JSON.parse(JSON.stringify(data))), data);
  assert.throws(() => validateStore({}));
  const invalid = fixture(); invalid.products[0].quantity = -1; assert.throws(() => validateStore(invalid));
  const duplicate = fixture(); duplicate.products.push({ ...duplicate.products[0] }); assert.throws(() => validateStore(duplicate));
});
test('totales separan los días y meses, con importes enteros', () => {
  let data = recordSale(fixture(), 'p1', 1, new Date(2026, 7, 31, 12));
  data = recordSale(data, 'p1', 2, new Date(2026, 8, 1, 12));
  assert.equal(totals(data.sales.filter(s => s.date.startsWith('2026-09'))).revenue, 3998);
  assert.equal(totals(data.sales.filter(s => s.date === '2026-08-31')).revenue, 1999);
  assert.equal(localDate(new Date(2026, 0, 2, 23)), '2026-01-02');
});
