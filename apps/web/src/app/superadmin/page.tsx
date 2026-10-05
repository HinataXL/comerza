'use client';
import { useEffect, useState } from 'react';
import { Store, Users, DollarSign, FileText, TrendingUp, LayoutDashboard } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import '../../components/dashboard/dashboard.css'; // Para reutilizar algunos estilos genéricos

interface TopTenant {
  id: string;
  name: string;
  volume: number;
}

interface VolumeHistory {
  name: string;
  amount: number;
}

interface Metrics {
  totalTenants: number;
  totalUsers: number;
  totalVolume: number;
  totalInvoices: number;
  volumeHistory: VolumeHistory[];
  topTenants: TopTenant[];
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/superadmin/metrics', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error('Error fetching metrics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
        <p>Cargando métricas maestras...</p>
      </div>
    );
  }

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Global Metrics</h1>
          <p>System-wide overview and volume tracking</p>
        </div>
      </header>
      
      <div className="sa-content">
        <div className="sa-kpi-container">
          <div className="sa-kpi-box">
            <div className="sa-kpi-label">Active Tenants</div>
            <div className="sa-kpi-value">{metrics?.totalTenants || 0}</div>
          </div>
          <div className="sa-kpi-box">
            <div className="sa-kpi-label">Total Users</div>
            <div className="sa-kpi-value">{metrics?.totalUsers || 0}</div>
          </div>
          <div className="sa-kpi-box">
            <div className="sa-kpi-label">Processed Volume</div>
            <div className="sa-kpi-value">Q {metrics?.totalVolume.toFixed(2) || '0.00'}</div>
          </div>
          <div className="sa-kpi-box">
            <div className="sa-kpi-label">Invoices Issued</div>
            <div className="sa-kpi-value">{metrics?.totalInvoices || 0}</div>
          </div>
        </div>

        <div className="sa-data-grid">
          <div className="sa-panel">
            <h3 className="sa-panel-title">Volume Growth (6 Months)</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.volumeHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'monospace' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'monospace' }}
                    tickFormatter={(val) => `Q${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '0', border: '2px solid #111827', boxShadow: '4px 4px 0px #111827', fontWeight: 'bold' }}
                    formatter={(value) => [`Q ${Number(value).toFixed(2)}`, 'VOLUME']}
                  />
                  <Bar dataKey="amount" fill="#111827" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-panel">
            <h3 className="sa-panel-title">Top Tenants</h3>
            <div>
              {(!metrics?.topTenants || metrics.topTenants.length === 0) ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', fontFamily: 'monospace' }}>Insufficient data.</p>
              ) : (
                metrics.topTenants.map((t, i) => (
                  <div key={t.id} className="sa-list-item">
                    <div className="sa-list-rank">{(i + 1).toString().padStart(2, '0')}</div>
                    <div className="sa-list-name">{t.name}</div>
                    <div className="sa-list-value">Q {t.volume.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
