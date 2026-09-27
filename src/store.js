export const KEY = 'emi-shop-v1';
export const types = ['Franela', 'Blusa', 'Suéter', 'Pantalón', 'Traje de baño', 'Ropa íntima', 'Otro'];
export const expenseCategories = ['Conserje', 'Pasajes', 'Comida', 'Pago de trabajadoras', 'Servicios', 'Alquiler', 'Otros'];
export const emptyStore = () => ({ version: 1, products: [], sales: [], expenses: [], currency: 'USD' });
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const cents = value => Math.round(Number(value) * 100);
export const newId = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
const validMoney = n => Number.isSafeInteger(n) && n >= 0 && n <= 10000000000;
const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
export function validateStore(data) {
  if (!data || data.version !== 1 || !['USD', 'VES', 'EUR', 'COP', 'MXN'].includes(data.currency) || !Array.isArray(data.products) || !Array.isArray(data.sales)) throw new Error('El archivo no es un respaldo válido de EMI Shop.');
  const ids = new Set();
  for (const p of data.products) {
    if (!p || typeof p.id !== 'string' || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100 || !types.includes(p.type) || !Number.isSafeInteger(p.quantity) || p.quantity < 0 || p.quantity > 1000000 || !validMoney(p.buy) || !validMoney(p.sell) || !validDate(p.created)) throw new Error('El respaldo contiene prendas inválidas.');
    ids.add(p.id);
  }
  const saleIds = new Set();
  for (const s of data.sales) {
    if (!s || typeof s.id !== 'string' || saleIds.has(s.id) || !ids.has(s.productId) || typeof s.name !== 'string' || !s.name.trim() || !types.includes(s.type) || !Number.isSafeInteger(s.quantity) || s.quantity < 1 || s.quantity > 1000000 || !validMoney(s.buy) || !validMoney(s.sell) || !validDate(s.date) || typeof s.time !== 'string' || Number.isNaN(Date.parse(s.time))) throw new Error('El respaldo contiene ventas inválidas.');
    saleIds.add(s.id);
  }
  const expenses = data.expenses === undefined ? [] : data.expenses;
  if (!Array.isArray(expenses)) throw new Error('El respaldo contiene gastos inválidos.');
  const expenseIds = new Set();
  for (const expense of expenses) {
    validateExpense(expense);
    if (expenseIds.has(expense.id)) throw new Error('El respaldo contiene gastos duplicados.');
    expenseIds.add(expense.id);
  }
  return { ...data, expenses };
}
function validateExpense(e) {
  if (!e || typeof e.id !== 'string' || !e.id || !expenseCategories.includes(e.category) || typeof e.description !== 'string' || !e.description.trim() || e.description.length > 200 || !validMoney(e.amount) || e.amount === 0 || !validDate(e.date) || typeof e.time !== 'string' || Number.isNaN(Date.parse(e.time)) || (e.voidedAt !== undefined && (typeof e.voidedAt !== 'string' || Number.isNaN(Date.parse(e.voidedAt))))) throw new Error('Revisa el gasto: categoría, descripción, fecha y monto mayor que cero son obligatorios.');
}
export function recordExpense(data, fields, now = new Date()) {
  const expense = { id: newId(), category: fields.category, description: fields.description.trim(), amount: fields.amount, date: fields.date, time: now.toISOString() };
  validateExpense(expense);
  if (expense.date > localDate(now)) throw new Error('La fecha de un gasto pagado no puede estar en el futuro.');
  return { ...data, expenses: [...(data.expenses || []), expense] };
}
export function voidExpense(data, id, now = new Date()) {
  if (!data.expenses?.some(e => e.id === id && !e.voidedAt)) throw new Error('El gasto ya fue anulado o no existe.');
  return { ...data, expenses: data.expenses.map(e => e.id === id ? { ...e, voidedAt: now.toISOString() } : e) };
}
export const expenseTotal = expenses => expenses.reduce((sum, e) => sum + (e.voidedAt ? 0 : e.amount), 0);
export function balance(data, period) {
  const sales = totals(data.sales.filter(s => s.date.startsWith(period)));
  const expenses = expenseTotal((data.expenses || []).filter(e => e.date.startsWith(period)));
  return { ...sales, expenses, net: sales.revenue - sales.cost - expenses };
}
export function recordSale(data, productId, quantity, now = new Date()) {
  const p = data.products.find(p => p.id === productId);
  if (!p || !Number.isInteger(quantity) || quantity < 1 || quantity > p.quantity) throw new Error('La cantidad debe estar entre 1 y las unidades disponibles.');
  const sale = { id: newId(), productId, name: p.name, type: p.type, quantity, buy: p.buy, sell: p.sell, date: localDate(now), time: now.toISOString() };
  return { ...data, products: data.products.map(item => item.id === p.id ? { ...item, quantity: item.quantity - quantity } : item), sales: [...data.sales, sale] };
}
export function totals(sales) {
  return sales.reduce((a, s) => ({ revenue: a.revenue + s.sell * s.quantity, cost: a.cost + s.buy * s.quantity, units: a.units + s.quantity }), { revenue: 0, cost: 0, units: 0 });
}
