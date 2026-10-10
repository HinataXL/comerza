'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  CalendarDays,
  Car,
  CheckCheck,
  ClipboardList,
  Clock3,
  LayoutGrid,
  List,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import type { WorkOrder } from '@/types/taller';
import { statusMap } from './components/WorkOrderStatusBadge';
import TallerOrderBoard from './components/TallerOrderBoard';
import {
  chartSeries,
  money,
  orderAmount,
  periodLabels,
  periodOrders,
  stateGroups,
  sumAmounts,
  type DashboardPeriod,
} from './dashboard-data';

function PeriodControl({
  value,
  onChange,
  label,
}: {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
  label: string;
}) {
  return (
    <div className="taller-period" role="group" aria-label={label}>
      {(Object.keys(periodLabels) as DashboardPeriod[]).map((period) => (
        <button
          key={period}
          type="button"
          aria-pressed={value === period}
          onClick={() => onChange(period)}
        >
          {periodLabels[period]}
        </button>
      ))}
      <Link
        href="/dashboard/taller/ordenes"
        className="taller-calendar"
        aria-label="Consultar órdenes"
        title="Consultar órdenes"
      >
        <CalendarDays size={16} />
      </Link>
    </div>
  );
}

function TrendChart({
  orders,
  period,
  now,
  delivered = false,
}: {
  orders: WorkOrder[];
  period: DashboardPeriod;
  now: Date;
  delivered?: boolean;
}) {
  const series = chartSeries(orders, period, now, delivered);
  const color = delivered
    ? 'var(--taller-chart-green)'
    : 'var(--taller-chart-blue)';
  return (
    <div
      className="taller-trend"
      role="img"
      aria-label={`${delivered ? 'Trabajos entregados' : 'Cotizaciones'}: ${money(series.reduce((sum, point) => sum + point.value, 0))} en el período`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={series}
          margin={{ top: 16, right: 16, left: 16, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient
              id={delivered ? 'taller-delivered-fill' : 'taller-quotes-fill'}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0" stopColor={color} stopOpacity={0.1} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            horizontal={false}
            stroke="var(--taller-border)"
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tick={{ fill: 'var(--taller-muted)', fontSize: 12 }}
            tickMargin={16}
            height={45}
          />
          <Tooltip
            formatter={(value) => [
              money(Number(value)),
              delivered ? 'Entregado' : 'Cotizado',
            ]}
            contentStyle={{
              border: '1px solid var(--taller-border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--taller-text)',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${delivered ? 'taller-delivered-fill' : 'taller-quotes-fill'})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 5,
              fill: color,
              stroke: 'var(--taller-surface)',
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrderLink({
  order,
  compact = false,
}: {
  order: WorkOrder;
  compact?: boolean;
}) {
  return (
    <Link
      className={compact ? 'taller-update' : 'taller-event-row'}
      href={`/dashboard/taller/ordenes/${order.id}`}
    >
      <span className="taller-event-icon">
        <Wrench size={18} />
      </span>
      <span className="taller-event-copy">
        <strong>
          {order.workOrderNumber} · {order.vehicle?.plate || 'Sin placa'}
        </strong>
        <span>
          {compact
            ? statusMap[order.status]?.label
            : order.customer?.name || 'Cliente final'}
        </span>
      </span>
      <span className="taller-event-detail">
        <strong>{money(orderAmount(order))}</strong>
        {compact ? null : <span>{statusMap[order.status]?.label}</span>}
      </span>
    </Link>
  );
}

export default function TallerDashboardClient({
  initialOrders,
  initialError = false,
}: {
  initialOrders: WorkOrder[];
  initialError?: boolean;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [hasLoaded, setHasLoaded] = useState(!initialError);
  const [quotePeriod, setQuotePeriod] = useState<DashboardPeriod>('week');
  const [deliveredPeriod, setDeliveredPeriod] =
    useState<DashboardPeriod>('week');
  const [view, setView] = useState<'summary' | 'board'>('summary');
  const [now, setNow] = useState<Date | null>(null);
  const [tenantName, setTenantName] = useState('Comerza Taller');
  const [refreshing, setRefreshing] = useState(false);
  const [boardBusy, setBoardBusy] = useState(false);
  const refreshRequest = useRef<AbortController | null>(null);
  const [error, setError] = useState(
    initialError
      ? 'No se pudieron cargar las órdenes. Reintenta para consultar el resumen.'
      : '',
  );

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const timer = setInterval(updateClock, 60_000);
    const controller = new AbortController();
    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (data.tenant?.name) setTenantName(data.tenant.name);
      })
      .catch(() => {});
    return () => {
      clearInterval(timer);
      controller.abort();
      refreshRequest.current?.abort();
    };
  }, []);

  async function refresh() {
    if (refreshRequest.current || boardBusy) return;
    const controller = new AbortController();
    refreshRequest.current = controller;
    setRefreshing(true);
    setError('');
    try {
      const response = await fetch('/api/taller/work-orders', {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok)
        throw new Error(
          'No se pudieron actualizar las órdenes. Conservamos el último resumen; vuelve a intentar.',
        );
      setOrders(await response.json());
      setHasLoaded(true);
      setNow(new Date());
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : 'No se pudieron actualizar las órdenes. Revisa tu conexión y reintenta.',
        );
    } finally {
      refreshRequest.current = null;
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }

  const active = orders.filter(
    (order) => !['DELIVERED', 'CANCELLED'].includes(order.status),
  );
  const latest = [...orders].sort(
    (a, b) =>
      Date.parse(b.updatedAt || b.createdAt) -
      Date.parse(a.updatedAt || a.createdAt),
  );
  const ready = active.filter((order) => order.status === 'READY');
  const breakdown = stateGroups.map((group) => ({
    ...group,
    value: active.filter((order) => group.statuses.includes(order.status))
      .length,
  }));
  const quoted = now ? periodOrders(orders, quotePeriod, now) : [];
  const delivered = now ? periodOrders(orders, deliveredPeriod, now, true) : [];
  const deliveredValue = sumAmounts(delivered);
  const waiting = active.filter((order) => order.status === 'WAITING_APPROVAL');

  return (
    <div className="taller-dashboard">
      <aside className="taller-summary" aria-label="Resumen del taller">
        <div className="taller-welcome">
          <Image
            src="/figma/taller/craft-logo.svg"
            alt=""
            width={98}
            height={98}
            priority
          />
          <p>Bienvenido,</p>
          <h2>{tenantName}</h2>
        </div>
        <section className="taller-updates">
          <h2>Últimas actualizaciones</h2>
          {latest.slice(0, 5).map((order) => (
            <OrderLink key={order.id} order={order} compact />
          ))}
          {latest.length === 0 ? (
            <p className="taller-empty-copy">
              {!hasLoaded
                ? 'Resumen no disponible.'
                : 'Tus primeras órdenes aparecerán aquí.'}
            </p>
          ) : null}
        </section>
        <section className="taller-deliveries">
          <h2>Listas para entregar</h2>
          {ready.slice(0, 2).map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/taller/ordenes/${order.id}`}
              className="taller-delivery"
            >
              <span className="taller-delivery-status">
                <i />
                Lista para entregar
              </span>
              <strong>
                {order.vehicle?.plate} · {order.customer?.name}
              </strong>
              <span>
                {order.vehicle?.brand} {order.vehicle?.model}
              </span>
            </Link>
          ))}
          {ready.length === 0 ? (
            <p className="taller-empty-copy">
              No hay vehículos pendientes de entrega.
            </p>
          ) : null}
          <Link
            className="taller-register"
            href="/dashboard/taller/vehiculos/nuevo"
          >
            <Car size={16} /> Registrar vehículo
          </Link>
        </section>
      </aside>
      <div className="taller-dashboard-content">
        <div className="taller-view-controls">
          <div role="group" aria-label="Vista del taller">
            <button
              type="button"
              disabled={refreshing || boardBusy}
              aria-pressed={view === 'summary'}
              onClick={() => setView('summary')}
            >
              <LayoutGrid size={15} /> Resumen
            </button>
            <button
              type="button"
              disabled={refreshing || boardBusy}
              aria-pressed={view === 'board'}
              onClick={() => setView('board')}
            >
              <List size={15} /> Tablero
            </button>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing || boardBusy}
            className="taller-refresh"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'taller-refreshing' : ''}
            />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
        {error ? (
          <div className="taller-error" role="alert">
            {error}
            <button type="button" disabled={refreshing} onClick={refresh}>
              Reintentar
            </button>
          </div>
        ) : null}
        {refreshing ? (
          <p className="taller-sr-only" role="status">
            Actualizando resumen del taller.
          </p>
        ) : null}
        {!hasLoaded ? (
          <div className="taller-card taller-unavailable">
            <ClipboardList size={32} />
            <h2>Resumen no disponible</h2>
            <p>Actualiza las órdenes para volver a consultar tu taller.</p>
          </div>
        ) : view === 'board' ? (
          <TallerOrderBoard
            disabled={refreshing}
            onBusy={setBoardBusy}
            orders={orders}
            onUpdated={(updated) =>
              setOrders((current) =>
                current.map((order) =>
                  order.id === updated.id ? updated : order,
                ),
              )
            }
          />
        ) : (
          <div className="taller-widget-grid">
            <section
              className="taller-card taller-quotes"
              aria-labelledby="taller-quotes-title"
            >
              <header className="taller-card-header">
                <h2 id="taller-quotes-title">Cotizaciones</h2>
                <PeriodControl
                  value={quotePeriod}
                  onChange={setQuotePeriod}
                  label="Período de cotizaciones"
                />
              </header>
              <div className="taller-stat">
                <strong>{now ? money(sumAmounts(quoted)) : '—'}</strong>
                <span>Importe cotizado · {quoted.length} órdenes</span>
              </div>
              {now ? (
                <TrendChart orders={orders} period={quotePeriod} now={now} />
              ) : (
                <p className="taller-empty-copy" role="status">
                  Preparando gráfica…
                </p>
              )}
            </section>
            <section
              className="taller-card taller-events"
              aria-labelledby="taller-events-title"
            >
              <header className="taller-card-header">
                <h2 id="taller-events-title">Actividad reciente</h2>
                <Link
                  className="taller-small-button"
                  href="/dashboard/taller/ordenes"
                >
                  Ver todas
                </Link>
              </header>
              <div className="taller-event-heading">
                <span>Orden de trabajo</span>
                <span>Detalle</span>
              </div>
              <div className="taller-event-list">
                {latest.slice(0, 4).map((order) => (
                  <OrderLink key={order.id} order={order} />
                ))}
                {orders.length === 0 ? (
                  <div className="taller-empty-state">
                    <ClipboardList size={28} />
                    <h3>Empieza con una orden</h3>
                    <p>
                      Registra un vehículo para dar seguimiento a su reparación.
                    </p>
                    <Link
                      className="taller-small-button"
                      href="/dashboard/taller/ordenes/nueva"
                    >
                      Crear primera orden
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>
            <section
              className="taller-card taller-breakdown"
              aria-labelledby="taller-breakdown-title"
            >
              <header className="taller-card-header">
                <h2 id="taller-breakdown-title">Estado del taller</h2>
                <span className="taller-caption">Órdenes activas</span>
              </header>
              <div className="taller-donut">
                <div
                  className="taller-donut-chart"
                  role="img"
                  aria-label={breakdown
                    .map((group) => `${group.name}: ${group.value}`)
                    .join(', ')}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown}
                        dataKey="value"
                        innerRadius={82}
                        outerRadius={112}
                        paddingAngle={0}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                      >
                        {breakdown.map((group) => (
                          <Cell key={group.name} fill={group.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [Number(value), 'Órdenes']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="taller-donut-total">
                  <strong>{active.length}</strong>
                  <span>activas</span>
                </div>
              </div>
              <div className="taller-donut-legend">
                {breakdown.map((group) => (
                  <div key={group.name}>
                    <i style={{ background: group.color }} />
                    <span>{group.name}</span>
                    <strong>{group.value}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section
              className="taller-card taller-income"
              aria-labelledby="taller-income-title"
            >
              <header className="taller-card-header">
                <h2 id="taller-income-title">Trabajos entregados</h2>
                <PeriodControl
                  value={deliveredPeriod}
                  onChange={setDeliveredPeriod}
                  label="Período de entregas"
                />
              </header>
              <div className="taller-stat">
                <strong>
                  {now ? money(deliveredValue) : '—'}
                  <CheckCheck size={20} />
                </strong>
                <span>Valor autorizado de las entregas</span>
              </div>
              {now ? (
                <TrendChart
                  orders={orders}
                  period={deliveredPeriod}
                  now={now}
                  delivered
                />
              ) : null}
              <div className="taller-counters">
                <div>
                  <strong>{delivered.length}</strong>
                  <span>Entregadas en período</span>
                </div>
                <div>
                  <strong>{waiting.length}</strong>
                  <span>Por autorizar</span>
                </div>
                <div>
                  <strong>{ready.length}</strong>
                  <span>Listas para entregar</span>
                </div>
              </div>
            </section>
          </div>
        )}
        <p className="taller-data-note">
          <Clock3 size={13} />
          {now
            ? `Hora local: ${now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}.`
            : 'Preparando resumen.'}{' '}
          Los importes corresponden a órdenes; no confirman pagos recibidos.
        </p>
      </div>
    </div>
  );
}
