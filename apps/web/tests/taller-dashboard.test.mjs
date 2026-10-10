import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  chartSeries,
  periodOrders,
  stateGroups,
  sumAmounts,
} from '../src/app/dashboard/taller/dashboard-data.ts';

const now = new Date('2026-10-09T14:00:00');
const order = (changes) => ({
  id: 'order',
  workOrderNumber: 'OT-1',
  status: 'RECEIVED',
  total: 0,
  subtotal: 0,
  tax: 0,
  discount: 0,
  createdAt: '2026-10-09T09:00:00',
  updatedAt: '2026-10-09T09:00:00',
  vehicle: {},
  customer: { id: 'customer', name: 'Cliente' },
  ...changes,
});

test('totals use authorized snapshot and integer cents', () => {
  assert.equal(
    sumAmounts([
      order({ total: 0.1 }),
      order({ total: 0.2 }),
      order({ total: 200, approvedTotal: 125.5 }),
    ]),
    125.8,
  );
  assert.equal(sumAmounts([order({ total: 200, approvedTotal: 0 })]), 0);
});
test('periods exclude cancelled, future and invalid dates', () => {
  const orders = [
    order({}),
    order({ status: 'CANCELLED' }),
    order({ createdAt: '2026-10-09T18:00:00' }),
    order({ createdAt: 'invalid' }),
  ];
  assert.equal(periodOrders(orders, 'day', now).length, 1);
});
test('week includes exactly the last seven calendar days', () => {
  assert.equal(
    periodOrders(
      [
        order({ createdAt: '2026-10-03T00:00:00' }),
        order({ createdAt: '2026-10-02T23:59:59' }),
      ],
      'week',
      now,
    ).length,
    1,
  );
});
test('delivered totals use delivery date instead of order creation', () => {
  const orders = [
    order({
      status: 'DELIVERED',
      createdAt: '2026-09-01T09:00:00',
      deliveredAt: '2026-10-09T10:00:00',
      approvedTotal: 241,
    }),
    order({ status: 'READY', total: 99 }),
    order({ status: 'DELIVERED', total: 88 }),
  ];
  assert.equal(sumAmounts(periodOrders(orders, 'day', now, true)), 241);
  assert.equal(chartSeries(orders, 'day', now, true)[10].value, 241);
});
test('month chart crosses year boundaries and preserves totals', () => {
  const january = new Date('2027-01-02T14:00:00');
  const orders = [
    order({ createdAt: '2026-12-31T09:00:00', total: 300 }),
    order({ createdAt: '2027-01-01T09:00:00', total: 0.1 }),
    order({ createdAt: '2027-01-01T10:00:00', total: 0.2 }),
  ];
  const series = chartSeries(orders, 'month', january);
  assert.equal(series.length, 2);
  assert.equal(series[0].value, 0.3);
  assert.equal(series[1].value, 0);
});
test('state breakdown includes every active state exactly once', () => {
  const states = stateGroups.flatMap((group) => group.statuses);
  assert.equal(new Set(states).size, 7);
  assert.ok(states.includes('APPROVED'));
  assert.ok(!states.includes('DELIVERED'));
  assert.ok(!states.includes('CANCELLED'));
});
