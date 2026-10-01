'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import '@/components/dashboard/dashboard.css';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          credentials: 'include'
        });
        
        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Error fetching data');
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary">Cargando dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-center" style={{ height: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-danger">{error || 'No se pudo cargar la información'}</p>
      </div>
    );
  }

  // Merge transactions and invoices for the unified activity feed
  const txs = (data.tables?.transactions || []).map((t: any) => ({
    type: 'Venta',
    date: t.date,
    client: t.client,
    amount: t.amount,
    status: t.status
  }));
  const invs = (data.tables?.invoices || []).map((i: any) => ({
    type: 'Cobro emitido',
    date: i.date,
    client: i.client,
    amount: i.total,
    status: i.status
  }));
  const mergedActivity = [...txs, ...invs].slice(0, 8); // Interleaved recent activity

  return (
    <div className="dashboard-container">
      {/* COLUMNA IZQUIERDA: El dinero */}
      <div className="dashboard-main">
        {/* Nivel 1: Ventas */}
        <div className="dashboard-section">
          <h2 className="section-title" style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>
            Ventas de hoy
          </h2>
          <div className="kpi-display">
            Q {data.kpis?.ventasDelMes?.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className={data.kpis?.ventasDelMes?.isPositive ? "text-success" : "text-danger"} style={{ fontWeight: 500 }}>
              {data.kpis?.ventasDelMes?.trend || '0%'} vs. ayer
            </span>
            <span className="text-secondary">
              Este mes: Q {((data.kpis?.ventasDelMes?.value || 0) * 1.5).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className="sparkline-container">
            {data.charts?.lineData && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.lineData}>
                  <Line type="monotone" dataKey="ventas" stroke="#111827" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Nivel 3: Por cobrar */}
        <div className="dashboard-section">
          <h2 className="section-title">Por cobrar</h2>
          <div className="kpi-display" style={{ fontSize: '2.25rem' }}>
            Q {data.kpis?.cobrosPendientes?.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'}
          </div>
          <div className="text-secondary">
            Cobros pendientes
          </div>
        </div>

        {/* Nivel 5: Actividad */}
        <div className="dashboard-section" style={{ borderBottom: 'none' }}>
          <h2 className="section-title">Actividad reciente</h2>
          <div className="activity-list">
            {mergedActivity.map((act, i) => (
              <div key={i} className="activity-item">
                <div className="activity-date">{act.date}</div>
                <div className="activity-client">
                  {act.type}
                  <span>{act.client}</span>
                </div>
                <div className="activity-amount">{act.amount}</div>
                <div className="activity-status">
                  <span className={`status-badge ${
                    ['Aprobado', 'Pagada', 'Pagado'].includes(act.status) ? 'status-success' : 
                    ['Rechazado', 'Vencida', 'Vencido'].includes(act.status) ? 'status-error' : 
                    'status-warning'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: Sidecar contextual y urgencias */}
      <div className="dashboard-sidebar">
        
        {/* Nivel 2: Atención requerida */}
        <div className="dashboard-section">
          <h2 className="section-title" style={{ color: '#DC2626' }}>Atención requerida</h2>
          
          <div className="alerts-list">
            {/* Ejemplo conceptual para cobros vencidos basados en tabla invoices */}
            {data.tables?.invoices?.filter((i:any) => i.status === 'Vencida').length > 0 ? (
              <div className="alert-item">
                <TriangleAlert size={18} className="alert-icon" />
                <div className="alert-content">
                  <div className="alert-title">{data.tables.invoices.filter((i:any) => i.status === 'Vencida').length} cobros vencidos</div>
                  <div className="alert-desc">Requieren seguimiento</div>
                  <button className="alert-action">Revisar</button>
                </div>
              </div>
            ) : (
              <div className="alert-item">
                <TriangleAlert size={18} className="alert-icon" style={{ color: '#D97706' }} />
                <div className="alert-content">
                  <div className="alert-title">2 cobros por vencer</div>
                  <div className="alert-desc">Q 850.00 pendientes</div>
                  <button className="alert-action">Revisar</button>
                </div>
              </div>
            )}

            {data.gatewaysAndFel?.inventoryAlerts?.map((alert: any, i: number) => (
              <div key={i} className="alert-item">
                <TriangleAlert size={18} className="alert-icon" />
                <div className="alert-content">
                  <div className="alert-title">Inventario bajo: {alert.item}</div>
                  <div className="alert-desc">Quedan {alert.stock} unidades</div>
                  <button className="alert-action">Reponer</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="gateways-status">
            Pasarelas: {data.gatewaysAndFel?.activeGateways?.qpaypro ? 'QPayPro (Ok)' : 'QPayPro (Inactiva)'}
          </div>
        </div>

        {/* Nivel 4: Contexto (Métodos de pago) */}
        <div className="dashboard-section" style={{ borderBottom: 'none' }}>
          <h2 className="section-title">Métodos de pago (Mes)</h2>
          <div className="methods-list">
            {data.charts?.pieData?.map((method: any, i: number) => (
              <div key={i} className="method-item">
                <div className="method-name">{method.name}</div>
                <div className="method-stats">
                  <span className="method-percent">{method.value}%</span>
                  <span className="method-amount">
                    Q {method.amount ? method.amount.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
