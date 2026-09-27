import React, { useState } from 'react';
import { Wallet, Plus, RotateCcw } from 'lucide-react';
import { expenseCategories, expenseTotal, balance, recordExpense, voidExpense, cents } from './store';
import './expenses.css';

export default function Expenses({ data, save, money, today, Modal, ModalActions }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [day, setDay] = useState('');
  const [category, setCategory] = useState('Todas');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const period = day || month;
  const report = balance(data, period);
  const periodExpenses = data.expenses.filter(e => e.date.startsWith(period));
  const shown = periodExpenses.filter(e => category === 'Todas' || e.category === category).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const open = () => { setError(''); setModal({ kind: 'new' }); };
  function submit(e) {
    e.preventDefault(); setError('');
    const fields = new FormData(e.target);
    try {
      const next = recordExpense(data, { category: fields.get('category'), description: fields.get('description'), amount: cents(fields.get('amount')), date: fields.get('date') });
      if (save(next, 'Gasto registrado y balance actualizado')) {
        setMonth(fields.get('date').slice(0, 7)); setDay(''); setCategory('Todas'); setModal(null);
      } else setError('No se pudo guardar el gasto. Cierra este formulario para revisar el aviso.');
    } catch (err) { setError(err.message); }
  }
  return <>
    <div className="expenses-toolbar"><div className="expense-period"><label>Mes<input type="month" value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setDay(''); } }}/></label><label>Día específico (opcional)<input type="date" value={day} onChange={e => { setDay(e.target.value); if (e.target.value) setMonth(e.target.value.slice(0, 7)); }}/></label><button className="secondary" onClick={() => setDay('')}>Todo el mes</button></div><button className="primary" onClick={open}><Plus size={18}/> Registrar gasto</button></div>
    <div className="stats three"><ExpenseStat label="Ventas del período" value={money(report.revenue)}/><ExpenseStat label="Gastos del período" value={money(report.expenses)}/><ExpenseStat label="Ganancia después de gastos" value={money(report.net)}/></div>
    <p className="expense-explanation">{day ? `Día: ${day.split('-').reverse().join('/')}` : `Mes: ${month}`} · Ventas {money(report.revenue)} − costo de prendas vendidas {money(report.cost)} − gastos {money(report.expenses)} = <strong>{money(report.net)}</strong>. Un resultado negativo indica pérdida en el período.</p>
    <div className="expense-breakdown">{expenseCategories.map(c => { const amount = expenseTotal(periodExpenses.filter(e => e.category === c)); return amount > 0 ? <div key={c}><span>{c}</span><strong>{money(amount)}</strong></div> : null; })}</div>
    <section className="panel"><div className="panel-head"><div><h2>Historial de gastos</h2><p>Pagos realizados · los gastos anulados se conservan sin descontar.</p></div></div><div className="filters expense-list-filter"><label>Categoría <select value={category} onChange={e => setCategory(e.target.value)}><option>Todas</option>{expenseCategories.map(c => <option key={c}>{c}</option>)}</select></label><span>Total de la lista: <strong>{money(expenseTotal(shown))}</strong></span></div>
      {shown.length ? <div className="expense-list">{shown.map(e => <article key={e.id} className={`expense-item ${e.voidedAt ? 'expense-voided' : ''}`}><span className="product-icon"><Wallet size={19}/></span><div className="expense-description"><strong>{e.description}</strong><small>{e.category} · {e.date.split('-').reverse().join('/')}</small>{e.voidedAt && <small>Anulado el {new Date(e.voidedAt).toLocaleDateString('es')}</small>}</div><strong className="expense-amount">{money(e.amount)}</strong>{e.voidedAt ? <span className="badge out">Anulado</span> : <button className="secondary" onClick={() => { setError(''); setModal({ kind: 'void', expense: e }); }} aria-label={`Anular gasto: ${e.description}`}><RotateCcw size={15}/><span>Anular</span></button>}</article>)}</div> : <div className="empty"><span className="empty-icon"><Wallet size={25}/></span><h3>Sin gastos en esta selección</h3><p>Registra tus pagos para conocer las deducciones de la tienda.</p><button className="text-button" onClick={open}>Registrar un gasto <Plus size={15}/></button></div>}
    </section>
    {modal && <Modal title={modal.kind === 'new' ? 'Registrar gasto' : 'Anular gasto'} onClose={() => setModal(null)}>
      {error && <div className="error" role="alert">{error}</div>}
      {modal.kind === 'new' ? <form onSubmit={submit}><p className="modal-intro">Registra un pago realizado por la tienda.</p><label>Categoría<select name="category">{expenseCategories.map(c => <option key={c}>{c}</option>)}</select></label><label>Descripción o persona que recibió el pago<input autoFocus name="description" required maxLength={200} placeholder="Ej. Pago semanal de María"/></label><div className="form-grid"><label>Monto ({data.currency})<input name="amount" required type="number" min="0.01" max="100000000" step="0.01" placeholder="0.00"/></label><label>Fecha del pago<input name="date" required type="date" defaultValue={today} max={today}/></label></div><p className="help-text">Se descontará en el día y mes de la fecha seleccionada. El costo de las prendas ya se descuenta al venderlas; no lo registres otra vez como gasto.</p><ModalActions close={() => setModal(null)} label="Guardar gasto"/></form> : <><p>¿Anular el gasto <strong>{modal.expense.description}</strong> por <strong>{money(modal.expense.amount)}</strong>?</p><p className="help-text">Dejará de descontarse del balance y permanecerá en el historial como anulado.</p><ModalActions close={() => setModal(null)} label="Anular gasto" onConfirm={() => { try { if (save(voidExpense(data, modal.expense.id), 'Gasto anulado y balance actualizado')) setModal(null); else setError('No se pudo guardar la anulación.'); } catch (err) { setError(err.message); } }}/></>}
    </Modal>}
  </>;
}
function ExpenseStat({ label, value }) { return <section className="stat"><div className="stat-title">{label}<Wallet size={18}/></div><strong className="stat-value">{value}</strong><small>Según la fecha del pago · sin gastos anulados</small></section>; }
