import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyStore, validateStore, recordExpense, voidExpense, balance } from '../src/store.js';
const now = new Date(2026, 8, 27, 12);
const fields = { category: 'Pasajes', description: 'Traslado a la tienda', amount: 250, date: '2026-09-27' };
test('migra datos anteriores sin alterar inventario o ventas', () => {
  const old = { version: 1, currency: 'USD', products: [], sales: [] };
  const migrated = validateStore(old);
  assert.deepEqual(migrated, { ...old, expenses: [] });
  assert.equal(old.expenses, undefined);
});
test('gastos persisten en respaldos y descuentan en el día y mes correctos', () => {
  let data = recordExpense(emptyStore(), fields, now);
  data = recordExpense(data, { ...fields, amount: 1000, date: '2026-08-31' }, now);
  data = recordExpense(data, { ...fields, amount: 350, date: '2026-09-01' }, now);
  const restored = validateStore(JSON.parse(JSON.stringify(data)));
  assert.deepEqual(restored, data);
  assert.equal(balance(restored, '2026-09-27').expenses, 250);
  assert.equal(balance(restored, '2026-09').expenses, 600);
  assert.equal(balance(restored, '2026-08').expenses, 1000);
  assert.equal(balance(restored, '2026-09').net, -600);
});
test('ganancia descuenta una vez costo de ventas y gastos', () => {
  const data = recordExpense({ ...emptyStore(), sales: [{ date: '2026-09-27', quantity: 2, sell: 2000, buy: 1000 }] }, fields, now);
  assert.deepEqual(balance(data, '2026-09'), { revenue: 4000, cost: 2000, units: 2, expenses: 250, net: 1750 });
});
test('anular conserva el historial, revierte la deducción y evita doble anulación', () => {
  const data = recordExpense(emptyStore(), fields, now);
  const result = voidExpense(data, data.expenses[0].id, now);
  assert.equal(result.expenses.length, 1);
  assert.equal(balance(result, '2026-09').expenses, 0);
  assert.equal(balance(data, '2026-09').expenses, 250);
  assert.equal(result.expenses[0].voidedAt, now.toISOString());
  assert.throws(() => voidExpense(result, data.expenses[0].id));
  assert.doesNotThrow(() => validateStore(JSON.parse(JSON.stringify(result))));
});
test('rechaza montos, fechas, categorías y respaldos de gastos inválidos', () => {
  for (const amount of [0, -1, 1.5, NaN, Infinity, 10000000001]) assert.throws(() => recordExpense(emptyStore(), { ...fields, amount }, now));
  for (const date of ['2026-02-30', '2026-10-01', 'no-fecha']) assert.throws(() => recordExpense(emptyStore(), { ...fields, date }, now));
  assert.throws(() => recordExpense(emptyStore(), { ...fields, description: '  ' }, now));
  assert.throws(() => recordExpense(emptyStore(), { ...fields, category: 'Inválida' }, now));
  assert.throws(() => validateStore({ ...emptyStore(), expenses: null }));
  const data = recordExpense(emptyStore(), fields, now);
  assert.throws(() => validateStore({ ...data, expenses: [...data.expenses, ...data.expenses] }));
});
