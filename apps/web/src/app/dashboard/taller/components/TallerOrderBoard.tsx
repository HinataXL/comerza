'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkOrder, WorkOrderStatus } from '@/types/taller';
import { useDialog } from '@/components/providers/DialogProvider';
import { statusMap } from './WorkOrderStatusBadge';

const columns: WorkOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSIS',
  'WAITING_APPROVAL',
  'APPROVED',
  'IN_REPAIR',
  'QUALITY_CONTROL',
  'READY',
];
const transitions: Partial<Record<WorkOrderStatus, WorkOrderStatus[]>> = {
  RECEIVED: ['DIAGNOSIS', 'WAITING_APPROVAL', 'IN_REPAIR'],
  DIAGNOSIS: ['WAITING_APPROVAL', 'IN_REPAIR'],
  WAITING_APPROVAL: ['APPROVED', 'IN_REPAIR'],
  APPROVED: ['IN_REPAIR'],
  IN_REPAIR: ['QUALITY_CONTROL', 'READY'],
  QUALITY_CONTROL: ['IN_REPAIR', 'READY'],
  READY: ['DELIVERED'],
};

export default function TallerOrderBoard({
  orders,
  onUpdated,
  onBusy,
  disabled,
}: {
  orders: WorkOrder[];
  onUpdated: (order: WorkOrder) => void;
  onBusy: (busy: boolean) => void;
  disabled: boolean;
}) {
  const router = useRouter();
  const { showConfirm } = useDialog();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function move(
    order: WorkOrder,
    next: WorkOrderStatus,
    confirmed = false,
  ) {
    if (pending.current || disabled || next === order.status) return;
    if (!transitions[order.status]?.includes(next)) {
      setError(
        'Ese cambio no está disponible. Elige una de las etapas indicadas en la orden.',
      );
      return;
    }
    if (
      !confirmed &&
      ((order.status === 'WAITING_APPROVAL' && next === 'IN_REPAIR') ||
        next === 'DELIVERED')
    ) {
      showConfirm(
        'Confirmar cambio de etapa',
        next === 'DELIVERED'
          ? `Marcar ${order.workOrderNumber} como entregada cerrará la orden.`
          : `Iniciar la reparación de ${order.workOrderNumber} registra la autorización presencial y genera la venta con sus movimientos de inventario.`,
        () => void move(order, next, true),
        'warning',
        {
          confirmLabel:
            next === 'DELIVERED' ? 'Marcar entregada' : 'Autorizar e iniciar',
          cancelLabel: 'Seguir en tablero',
        },
      );
      return;
    }
    pending.current = true;
    onBusy(true);
    setPendingId(order.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch(
        `/api/taller/work-orders/${order.id}/status`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStatus: next }),
        },
      );
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok)
        throw new Error(
          'No se pudo cambiar la etapa. Actualiza el resumen y vuelve a intentar.',
        );
      onUpdated(await response.json());
      setMessage(`${order.workOrderNumber}: ${statusMap[next].label}.`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'No se pudo cambiar la etapa. Revisa tu conexión.',
      );
    } finally {
      setPendingId(null);
      pending.current = false;
      onBusy(false);
    }
  }

  return (
    <section className="taller-board-section" aria-label="Tablero de órdenes">
      <p className="taller-board-help">
        Arrastra una orden a su siguiente etapa o usa «Mover a» en su tarjeta.
      </p>
      {error ? (
        <p role="alert" className="taller-error">
          {error}
        </p>
      ) : null}
      <p
        role="status"
        className={message ? 'taller-board-feedback' : 'taller-sr-only'}
      >
        {message}
      </p>
      <div className="taller-board" aria-busy={pendingId !== null}>
        {columns.map((status) => (
          <section
            key={status}
            className="taller-board-column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const order = orders.find(
                (item) => item.id === event.dataTransfer.getData('text/plain'),
              );
              if (order) void move(order, status);
            }}
          >
            <h2>
              {statusMap[status].label}
              <span>
                {orders.filter((order) => order.status === status).length}
              </span>
            </h2>
            {orders
              .filter((order) => order.status === status)
              .map((order) => (
                <article
                  key={order.id}
                  className="taller-board-order"
                  draggable={!pendingId && !disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', order.id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <Link href={`/dashboard/taller/ordenes/${order.id}`}>
                    <span>{order.workOrderNumber}</span>
                    <strong>{order.vehicle?.plate}</strong>
                    <span>
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </span>
                    <span>{order.customer?.name}</span>
                  </Link>
                  <label htmlFor={`move-${order.id}`}>Mover a</label>
                  <select
                    id={`move-${order.id}`}
                    value=""
                    disabled={pendingId !== null || disabled}
                    onChange={(event) =>
                      void move(order, event.target.value as WorkOrderStatus)
                    }
                  >
                    <option value="">
                      {pendingId === order.id
                        ? 'Guardando…'
                        : 'Selecciona etapa'}
                    </option>
                    {transitions[status]?.map((next) => (
                      <option key={next} value={next}>
                        {statusMap[next].label}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            {orders.some((order) => order.status === status) ? null : (
              <p className="taller-board-empty">Sin órdenes</p>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
