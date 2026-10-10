'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import type { WorkOrder, WorkOrderItemType } from '@/types/taller';
import { useDialog } from '@/components/providers/DialogProvider';
import './work-order-quote.css';

type Row = { key: string; itemType: WorkOrderItemType; description: string; quantity: string; unitPrice: string; discount: string; productId: string };
type Product = { id: string; name: string; price: number; stock: number };
const money = (value: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value);
const cents = (value: string) => Math.round(Number(value) * 100);
const types: Record<WorkOrderItemType, string> = { PART: 'Repuesto', SERVICE: 'Servicio', LABOR: 'Mano de obra', OTHER: 'Otro' };
const rowsFromOrder = (order: WorkOrder): Row[] => (order.items || []).map((item, index) => ({
  key: item.id || String(index), itemType: item.itemType, description: item.description || '',
  quantity: String(item.quantity), unitPrice: String(item.unitPrice), discount: String(item.discount || 0), productId: item.product?.id || '',
}));

export default function WorkOrderQuote({ order, onSaved, onDirtyChange, busy }: {
  order: WorkOrder; onSaved: (order: WorkOrder) => void; onDirtyChange: (dirty: boolean) => void; busy: boolean;
}) {
  const editable = ['RECEIVED', 'DIAGNOSIS', 'WAITING_APPROVAL'].includes(order.status) && !order.approvedAt;
  const [rows, setRows] = useState<Row[]>(() => rowsFromOrder(order));
  const [diagnosis, setDiagnosis] = useState(order.diagnosis || '');
  const [discount, setDiscount] = useState(String(order.discount || 0));
  const [tax, setTax] = useState(String(order.tax || 0));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(editable);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const { showConfirm } = useDialog();
  const confirmDiscardRef = useRef<(destination?: string) => void>(() => {});
  const pendingHref = useRef<string | null>(null);
  const disabled = saving || busy || !editable;
  const lineCents = (row: Row) => cents(row.unitPrice) * Number(row.quantity) - cents(row.discount);
  const subtotal = rows.reduce((sum, row) => sum + lineCents(row), 0);
  const total = subtotal - cents(discount) + cents(tax);

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!editable) return;
    const controller = new AbortController();
    fetch('/api/products', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error();
        setProducts(data);
      }).catch(() => { if (!controller.signal.aborted) setCatalogError(true); })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    return () => controller.abort();
  }, [editable, catalogAttempt]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const guardNavigation = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a') : null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href || anchor.getAttribute('href')?.startsWith('#')) return;
      event.preventDefault(); event.stopPropagation();
      confirmDiscardRef.current(destination.href);
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', guardNavigation, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guardNavigation, true); };
  }, [dirty]);

  const changed = () => { setDirty(true); setMessage(''); setError(''); };
  const update = (key: string, patch: Partial<Row>) => { setRows(current => current.map(row => row.key === key ? { ...row, ...patch } : row)); changed(); };
  const add = () => { setRows(current => [...current, { key: crypto.randomUUID(), itemType: 'LABOR', description: '', quantity: '1', unitPrice: '0', discount: '0', productId: '' }]); changed(); };
  const validMoney = (value: string) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 999999.99;
  const discard = () => {
    setRows(rowsFromOrder(order)); setDiagnosis(order.diagnosis || ''); setDiscount(String(order.discount || 0)); setTax(String(order.tax || 0));
    setDirty(false); onDirtyChange(false); setError(''); setMessage('Cambios descartados.');
    const destination = pendingHref.current; pendingHref.current = null;
    if (destination) window.location.assign(destination);
  };
  useEffect(() => {
    confirmDiscardRef.current = (destination?: string) => {
      pendingHref.current = destination || null;
      showConfirm('¿Descartar los cambios de la cotización?', 'Se conservará la última cotización guardada. Los cambios del borrador se perderán.', discard, 'warning', { confirmLabel: 'Descartar cambios', cancelLabel: 'Seguir editando' });
    };
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled || !dirty) return;
    setError(''); setMessage('');
    const invalid = rows.find(row => !row.description.trim() || row.description.trim().length > 500 ||
      !/^\d+$/.test(row.quantity) || Number(row.quantity) < 1 || Number(row.quantity) > 100000 ||
      !validMoney(row.unitPrice) || !validMoney(row.discount) || lineCents(row) < 0);
    if (invalid) {
      setError('Revisa los conceptos: descripción, cantidad entera mayor que cero, importes con hasta dos decimales y descuento menor o igual al importe.');
      document.getElementById(`quote-description-${invalid.key}`)?.focus();
      return;
    }
    if (!validMoney(discount) || !validMoney(tax) || cents(discount) > subtotal || (rows.length === 0 && (cents(discount) > 0 || cents(tax) > 0))) {
      setError('Revisa los ajustes: el descuento general no puede superar el subtotal. No puedes aplicar ajustes sin conceptos.');
      document.getElementById('quote-discount')?.focus(); return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/taller/work-orders/${order.id}/quote`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          items: rows.map(row => ({ itemType: row.itemType, description: row.description.trim(), quantity: Number(row.quantity),
            unitPrice: Number(row.unitPrice), discount: Number(row.discount), productId: row.productId || null })),
          diagnosis, discount: Number(discount), tax: Number(tax), expectedUpdatedAt: order.updatedAt,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || (response.status === 409 ? 'La orden cambió. Recarga antes de guardar.' : 'No se pudo guardar. Revisa los datos e intenta nuevamente.'));
      if (!data?.id) throw new Error('No se pudo confirmar el guardado. Recarga la página para revisar la cotización.');
      setDirty(false); onDirtyChange(false); setMessage('Cotización guardada.'); onSaved(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la cotización. Intenta nuevamente.');
    } finally { setSaving(false); }
  };

  return (
    <form className="work-order-quote" onSubmit={save} noValidate aria-busy={saving}>
      <div className="quote-heading"><div><h3>Cotización y conceptos</h3><p>Detalla los trabajos y repuestos que autorizará el cliente.</p></div>
        {editable && <button type="button" className="btn btn-outline" onClick={add} disabled={disabled || rows.length >= 100}><Plus size={16} /> Agregar concepto</button>}
      </div>
      {!editable && <p className="quote-notice">Esta cotización está cerrada para edición porque la orden ya avanzó o fue cancelada.</p>}
      <div className="form-group"><label htmlFor="quote-diagnosis" className="form-label">Diagnóstico para el cliente</label>
        <textarea id="quote-diagnosis" className="form-input" rows={3} maxLength={5000} value={diagnosis} disabled={disabled}
          onChange={event => { setDiagnosis(event.target.value); changed(); }} placeholder="Explica el diagnóstico y los trabajos recomendados." />
      </div>
      {catalogError && <p className="quote-notice" role="status">No se pudo cargar el inventario. Puedes agregar conceptos manuales. <button type="button" className="btn btn-outline" onClick={() => { setCatalogLoading(true); setCatalogError(false); setCatalogAttempt(value => value + 1); }}>Reintentar</button></p>}
      {rows.length === 0 && <div className="quote-empty"><FileText size={28} /><p>No hay conceptos en esta cotización.</p><span>Agrega mano de obra, servicios o repuestos para calcular el total.</span></div>}
      <div className="quote-rows">
        {rows.map((row, index) => (
          <fieldset className="quote-row" key={row.key} disabled={disabled}>
            <legend>Concepto {index + 1}</legend>
            <div className="quote-row-top">
              <div><label htmlFor={`quote-type-${row.key}`}>Tipo</label><select className="form-input" id={`quote-type-${row.key}`} value={row.itemType}
                onChange={event => update(row.key, { itemType: event.target.value as WorkOrderItemType, productId: '' })}>
                {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></div>
              <div className="quote-description"><label htmlFor={`quote-description-${row.key}`}>Descripción</label><input className="form-input" id={`quote-description-${row.key}`} value={row.description} maxLength={500} required
                onChange={event => update(row.key, { description: event.target.value })} placeholder="Ej. Cambio de aceite y filtro" aria-describedby={error ? 'quote-error' : undefined} /></div>
              {editable && <button className="btn btn-outline quote-remove" type="button" aria-label={`Quitar concepto ${index + 1}`} onClick={() => { setRows(current => current.filter(item => item.key !== row.key)); changed(); }}><Trash2 size={16} /></button>}
            </div>
            {row.itemType === 'PART' && <div className="quote-product"><label htmlFor={`quote-product-${row.key}`}>Inventario (opcional)</label>
              <select id={`quote-product-${row.key}`} className="form-input" value={row.productId} disabled={disabled || catalogLoading || catalogError}
                onChange={event => { const product = products.find(item => item.id === event.target.value); update(row.key, { productId: event.target.value, ...(product ? { description: product.name, unitPrice: String(product.price) } : {}) }); }}>
                <option value="">{catalogLoading ? 'Cargando inventario…' : 'Repuesto externo / sin inventario'}</option>
                {row.productId && !products.some(item => item.id === row.productId) && <option value={row.productId}>Repuesto vinculado</option>}
                {products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.stock} disponibles</option>)}
              </select><small>Guardar la cotización no descuenta existencias. Se descuentan al autorizar los trabajos.</small>
            </div>}
            <div className="quote-amounts">
              <div><label htmlFor={`quote-quantity-${row.key}`}>Cantidad</label><input id={`quote-quantity-${row.key}`} className="form-input" type="number" min="1" max="100000" step="1" value={row.quantity} required onChange={event => update(row.key, { quantity: event.target.value })} /></div>
              <div><label htmlFor={`quote-price-${row.key}`}>Precio unitario (Q)</label><input id={`quote-price-${row.key}`} className="form-input" type="number" min="0" step="0.01" value={row.unitPrice} required onChange={event => update(row.key, { unitPrice: event.target.value })} /></div>
              <div><label htmlFor={`quote-line-discount-${row.key}`}>Descuento (Q)</label><input id={`quote-line-discount-${row.key}`} className="form-input" type="number" min="0" step="0.01" value={row.discount} required onChange={event => update(row.key, { discount: event.target.value })} /></div>
              <div className="quote-line-total"><span>Importe</span><strong>{Number.isFinite(lineCents(row)) ? money(lineCents(row) / 100) : '—'}</strong></div>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="quote-summary">
        <div className="quote-adjustments"><div><label htmlFor="quote-discount">Descuento general (Q)</label><input id="quote-discount" className="form-input" type="number" min="0" step="0.01" value={discount} disabled={disabled} onChange={event => { setDiscount(event.target.value); changed(); }} /></div>
          <div><label htmlFor="quote-tax">Impuestos (importe en Q)</label><input id="quote-tax" className="form-input" type="number" min="0" step="0.01" value={tax} disabled={disabled} onChange={event => { setTax(event.target.value); changed(); }} /></div>
        </div>
        <dl className="quote-totals"><div><dt>Subtotal después de descuentos por concepto</dt><dd>{Number.isFinite(subtotal) ? money(subtotal / 100) : '—'}</dd></div>
          <div><dt>Descuento general</dt><dd>{money((cents(discount) || 0) / 100)}</dd></div><div><dt>Impuestos</dt><dd>{money((cents(tax) || 0) / 100)}</dd></div>
          <div className="quote-grand-total"><dt>Total cotizado</dt><dd>{Number.isFinite(total) ? money(total / 100) : '—'}</dd></div></dl>
      </div>
      <div className="quote-feedback" aria-live="polite">{error && <p id="quote-error" role="alert" className="quote-error">{error}</p>}{message && <p className="quote-success">{message}</p>}{dirty && !error && <p>Hay cambios sin guardar.</p>}</div>
      {editable && <div className="quote-footer"><p>Al guardar, los enlaces anteriores de autorización caducan. Envía uno nuevo desde «Enviar cotización».</p>
        {dirty && <button type="button" className="btn btn-outline" disabled={saving || busy} onClick={() => confirmDiscardRef.current()}>Descartar cambios</button>}
        <button className="btn btn-primary" type="submit" disabled={disabled || !dirty}><Save size={16} /> {saving ? 'Guardando…' : 'Guardar cotización'}</button></div>}
    </form>
  );
}
