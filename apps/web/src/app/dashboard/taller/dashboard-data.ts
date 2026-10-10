import type { WorkOrder } from '@/types/taller';

export type DashboardPeriod = 'day' | 'week' | 'month';
export const periodLabels: Record<DashboardPeriod, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
};
export const money = (value: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(
    value,
  );
export const orderAmount = (order: WorkOrder) =>
  order.approvedTotal ?? order.total ?? 0;
const cents = (value: number) => Math.round(value * 100);
export const sumAmounts = (orders: WorkOrder[]) =>
  orders.reduce((sum, order) => sum + cents(orderAmount(order)), 0) / 100;

export function periodStart(period: DashboardPeriod, now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(start.getDate() - 6);
  if (period === 'month') start.setDate(1);
  return start;
}

export function periodOrders(
  orders: WorkOrder[],
  period: DashboardPeriod,
  now: Date,
  delivered = false,
) {
  const start = periodStart(period, now).getTime();
  return orders.filter((order) => {
    if (
      order.status === 'CANCELLED' ||
      (delivered && order.status !== 'DELIVERED')
    )
      return false;
    const timestamp = Date.parse(
      delivered ? order.deliveredAt || '' : order.createdAt,
    );
    return timestamp >= start && timestamp <= now.getTime();
  });
}

export function chartSeries(
  orders: WorkOrder[],
  period: DashboardPeriod,
  now: Date,
  delivered = false,
) {
  const selected = periodOrders(orders, period, now, delivered);
  const start = periodStart(period, now);
  const buckets = Array.from(
    { length: period === 'day' ? 24 : period === 'week' ? 7 : now.getDate() },
    (_, index) => {
      const date = new Date(start);
      if (period === 'day') date.setHours(index);
      else date.setDate(start.getDate() + index);
      return {
        date,
        name:
          period === 'day'
            ? `${index}:00`
            : date.toLocaleDateString('es-GT', {
                day: 'numeric',
                month: 'short',
              }),
        value: 0,
      };
    },
  );
  for (const order of selected) {
    const date = new Date(delivered ? order.deliveredAt! : order.createdAt);
    const index =
      period === 'day'
        ? date.getHours()
        : period === 'week'
          ? buckets.findIndex(
              (bucket) => bucket.date.toDateString() === date.toDateString(),
            )
          : date.getDate() - 1;
    if (index >= 0 && index < buckets.length)
      buckets[index].value += cents(orderAmount(order));
  }
  return buckets.map((bucket) => ({
    name: bucket.name,
    value: bucket.value / 100,
  }));
}

export const stateGroups = [
  {
    name: 'Recepción y diagnóstico',
    statuses: ['RECEIVED', 'DIAGNOSIS'],
    color: 'var(--taller-chart-blue)',
  },
  {
    name: 'Por autorizar',
    statuses: ['WAITING_APPROVAL'],
    color: 'var(--taller-chart-amber)',
  },
  {
    name: 'En proceso',
    statuses: ['APPROVED', 'IN_REPAIR', 'QUALITY_CONTROL'],
    color: 'var(--taller-chart-green)',
  },
  {
    name: 'Listas para entregar',
    statuses: ['READY'],
    color: 'var(--taller-chart-rose)',
  },
];
