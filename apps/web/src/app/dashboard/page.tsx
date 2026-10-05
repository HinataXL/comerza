'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, TriangleAlert, Wallet, ShoppingCart, FileText, AlertCircle, XCircle } from 'lucide-react';
import '@/components/dashboard/dashboard.css';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando panel...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">No se pudo cargar la información del dashboard.</div>
      </div>
    );
  }

  // --- Formatters ---
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(val);
  };

  const translateDay = (day: string) => {
    if (!day) return '';
    // Handle ISO date strings
    if (day.includes('-') || day.includes('/')) {
      const date = new Date(day);
      if (!isNaN(date.getTime())) {
        const str = date.toLocaleDateString('es-GT', { weekday: 'short' }).replace('.', '');
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
    }
    // Robust map
    const map: Record<string, string> = {
      'mon': 'Lun', 'tue': 'Mar', 'wed': 'Mié', 'thu': 'Jue', 'fri': 'Vie', 'sat': 'Sáb', 'sun': 'Dom',
      'monday': 'Lun', 'tuesday': 'Mar', 'wednesday': 'Mié', 'thursday': 'Jue', 'friday': 'Vie', 'saturday': 'Sáb', 'sunday': 'Dom',
      'lun': 'Lun', 'mar': 'Mar', 'mié': 'Mié', 'mie': 'Mié', 'jue': 'Jue', 'vie': 'Vie', 'sáb': 'Sáb', 'sab': 'Sáb', 'dom': 'Dom'
    };
    const lower = day.toString().toLowerCase();
    return map[lower] || day;
  };

  const getActivityIcon = (type: string, status: string) => {
    if (status === 'Vencida' || status === 'Vencido') return <AlertCircle size={16} className="text-error" />;
    if (status === 'Rechazado') return <XCircle size={16} className="text-error" />;
    if (type === 'Venta') return <ShoppingCart size={16} className="text-success" />;
    if (type === 'Cobro') return <Wallet size={16} className="text-primary" />;
    return <FileText size={16} className="text-secondary" />;
  };

  // --- Computations ---
  
  // 1. Sales
  const todaySales = data.kpis?.ventasDelMes?.value || 0;
  const yesterdaySales = data.kpis?.ventasDelMes?.yesterdayValue || 0;

  let trendDisplay = null;
  if (yesterdaySales === 0) {
    trendDisplay = (
      <span className="trend-badge trend-neutral">
        <Minus size={14} /> Sin ventas ayer
      </span>
    );
  } else {
    const trendPercent = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    const isPositive = trendPercent >= 0;
    trendDisplay = (
      <span className={`trend-badge ${isPositive ? 'trend-positive' : 'trend-negative'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(trendPercent).toFixed(1)}% vs. ayer
      </span>
    );
  }

  // 2. Receivables
  const pendingCount = data.kpis?.cobrosPendientes?.count || 0;
  const pendingValue = data.kpis?.cobrosPendientes?.value || 0;
  const cobrosText = pendingCount === 1 ? '1 pendiente' : `${pendingCount} pendientes`;

  // 3. Alerts
  const vencidasCount = data.tables?.invoices?.filter((i:any) => i.status === 'Vencida' || i.status === 'Vencido').length || 0;
  const inventoryAlerts = data.gatewaysAndFel?.inventoryAlerts || [];
  const hasAlerts = vencidasCount > 0 || inventoryAlerts.length > 0;
  const isUrgent = vencidasCount > 0;

  // 4. Line Chart Context
  const lineData = data.charts?.lineData || [];
  const periodTotal = lineData.reduce((acc: number, curr: any) => acc + (curr.ventas || 0), 0);

  // 5. Activity Feed Merge
  const rawTxs = (data.tables?.transactions || []).map((t: any) => ({
    type: 'Venta',
    date: t.date,
    client: t.client,
    amount: parseFloat((t.amount || '0').toString().replace(/[^0-9.-]+/g,"")),
    status: t.status === 'COMPLETED' ? 'Aprobado' : t.status === 'PENDING' ? 'Pendiente' : t.status
  }));
  const rawInvs = (data.tables?.invoices || []).map((i: any) => ({
    type: 'Cobro',
    date: i.date,
    client: i.client,
    amount: i.total,
    status: i.status === 'PENDING' ? 'Pendiente' : i.status
  }));
  const mergedActivity = [...rawTxs, ...rawInvs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // 6. Secondary Distribution (Payment Methods)
  const pieData = data.charts?.pieData || [];
  const totalPie = pieData.reduce((acc: number, curr: any) => acc + curr.value, 0);

  return (
    <div className="dashboard-container">
      
      {/* Header Context Band */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Resumen de hoy</h1>
          <p className="page-subtitle" style={{ marginTop: '0.25rem' }}>Panel operativo para Taller Helio</p>
        </div>
        <button className="btn btn-outline action-btn" style={{ marginTop: '2px', padding: '0.375rem 0.75rem', fontSize: '0.875rem', height: 'auto', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Wallet size={14} />
          <span>Cobrar</span>
        </button>
      </div>

      {/* KPI Band (Continuous Surface) */}
      <div className="kpi-band">
        
        {/* Ventas */}
        <div className="kpi-segment" style={{ flex: hasAlerts ? 2 : 1 }}>
          <div className="kpi-header">
            <div className="kpi-label">Ventas de hoy</div>
            {trendDisplay}
          </div>
          <div className="kpi-value primary tabular-data" style={{ color: todaySales === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: todaySales === 0 ? 500 : 800 }}>
            <span className="currency">Q</span>
            {todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="kpi-separator" />

        {/* Por Cobrar */}
        <div className="kpi-segment" style={{ flex: hasAlerts ? 1.5 : 1 }}>
          <div className="kpi-header">
            <div className="kpi-label">Por cobrar</div>
            <span className="kpi-context">{cobrosText}</span>
          </div>
          <div className="kpi-value secondary tabular-data" style={{ color: pendingValue === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: pendingValue === 0 ? 500 : 800 }}>
            <span className="currency">Q</span>
            {pendingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Requiere Atención (Condicional) */}
        {hasAlerts && (
          <>
            <div className="kpi-separator" />
            <div className={`kpi-segment ${isUrgent ? 'urgent' : ''}`} style={{ flex: 1.2 }}>
              <div className="kpi-header">
                <div className="kpi-label" style={{ color: isUrgent ? 'var(--danger)' : 'var(--warning)' }}>Requiere atención</div>
              </div>
              <div className="alert-list">
                {vencidasCount > 0 && (
                  <div className="alert-item">
                    <TriangleAlert size={16} className="alert-icon" />
                    <span>{vencidasCount} cobro{vencidasCount !== 1 ? 's' : ''} vencido{vencidasCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {inventoryAlerts.map((alert: any, i: number) => (
                  <div key={i} className="alert-item">
                    <TriangleAlert size={16} className="alert-icon" />
                    <span>Stock bajo: {alert.item} ({alert.stock})</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Main Body Split (Chart & Activity) */}
      <div className="main-split">
        
        {/* Chart Band */}
        <div className="card chart-band">
          <div className="band-header">
            <h2 className="band-title">Tendencia de ventas</h2>
            <span className="band-meta tabular-data">Últimos 7 días · {formatMoney(periodTotal)}</span>
          </div>
          <div className="chart-wrapper">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748B' }} 
                    dy={10} 
                    tickFormatter={translateDay}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(value) => `Q${value >= 1000 ? (value/1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k' : value}`}
                    allowDecimals={false}
                    width={55}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatMoney(value as number), 'Ventas']}
                    labelFormatter={(label: any) => translateDay(label as string)}
                    contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', boxShadow: 'none', padding: '4px 8px', fontSize: '12px' }}
                    itemStyle={{ padding: 0 }}
                  />
                  <Area 
                    type="linear" 
                    dataKey="ventas" 
                    stroke="#0F172A" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorVentas)" 
                    dot={{ r: 3, strokeWidth: 2, fill: '#FFFFFF', stroke: '#0F172A' }}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#64748B' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No hay suficientes datos para graficar la tendencia.</div>
            )}
          </div>
        </div>

        {/* Activity Band */}
        <div className="card activity-band">
          <div className="band-header">
            <h2 className="band-title">Actividad reciente</h2>
          </div>
          <div className="activity-list">
            {mergedActivity.length > 0 ? (
              mergedActivity.map((item, idx) => {
                const isError = item.status === 'Vencida' || item.status === 'Vencido' || item.status === 'Rechazado';
                const isWarning = item.status === 'Pendiente';
                const dateObj = new Date(item.date);
                const timeStr = dateObj.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={idx} className="activity-row">
                    <div className="activity-icon-col">
                      {getActivityIcon(item.type, item.status)}
                    </div>
                    <div className="activity-info-col">
                      <div className="activity-primary">{item.type}</div>
                      <div className="activity-secondary">
                        {item.client || 'Cliente General'}
                        {item.status && item.status !== 'Aprobado' && (
                          <>
                            <span>·</span>
                            <span className={`activity-status-text ${isError ? 'text-error' : isWarning ? 'text-warning' : ''}`}>
                              {item.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="activity-meta-col">
                      <div className={`activity-amount tabular-data ${isError ? 'text-error' : ''}`}>
                        {formatMoney(item.amount)}
                      </div>
                      <div className="activity-time">{timeStr}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No hay actividad reciente para mostrar.</div>
            )}
          </div>
        </div>

      </div>

      {/* Secondary Distribution Band */}
      {pieData.length > 0 && totalPie > 0 && (
        <div className="card distribution-band">
          <div className="band-header">
            <h2 className="band-title">Métodos de pago</h2>
            <span className="band-meta tabular-data">Últimos 30 días</span>
          </div>
          
          <div className="stacked-bar-container">
            {/* The Bar */}
            <div className="stacked-bar">
              {pieData.map((slice: any, idx: number) => {
                const pct = (slice.value / totalPie) * 100;
                // Array of robust colors for financial breakdown
                const colors = ['#0F172A', '#334155', '#64748B', '#94A3B8'];
                return (
                  <div 
                    key={idx} 
                    className="stacked-bar-segment" 
                    style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                    title={`${slice.name}: ${formatMoney(slice.value)}`}
                  />
                );
              })}
            </div>
            
            {/* The Legend */}
            <div className="stacked-bar-legend">
              {pieData.map((slice: any, idx: number) => {
                const pct = (slice.value / totalPie) * 100;
                const colors = ['#0F172A', '#334155', '#64748B', '#94A3B8'];
                return (
                  <div key={idx} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <div className="legend-info">
                      <span className="legend-name">{slice.name}</span>
                      <span className="legend-pct tabular-data">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
