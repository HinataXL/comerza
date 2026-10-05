'use client';
import { useEffect, useState } from 'react';
import { ShieldCheck, Server, Database, Activity, Clock, RefreshCw, Mail } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';

interface HealthData {
  status: string;
  uptime: number;
  dbStatus: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

interface GatewaysStatus {
  qpaypro: string;
  recurrente: string;
}

export default function SuperAdminSettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [gateways, setGateways] = useState<GatewaysStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingService, setTestingService] = useState<string | null>(null);
  const { showAlert } = useDialog();

  const fetchData = async () => {
    try {
      const [healthRes, gatewaysRes] = await Promise.all([
        fetch('/api/superadmin/health', { credentials: 'include' }),
        fetch('/api/superadmin/gateways/status', { credentials: 'include' })
      ]);

      if (healthRes.ok) setHealth(await healthRes.json());
      if (gatewaysRes.ok) setGateways(await gatewaysRes.json());
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hrs = Math.floor(seconds % (3600 * 24) / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    return `${days}d ${hrs}h ${mins}m`;
  };

  const testConnection = async (type: 'db' | 'qpaypro' | 'recurrente' | 'resend') => {
    setTestingService(type);
    try {
      const endpoint = type === 'db' ? '/api/superadmin/health/test-db' : `/api/superadmin/health/test-gateway/${type}`;
      const res = await fetch(endpoint, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        showAlert('Prueba Exitosa', data.message, 'success');
        fetchData(); // Refresh statuses
      } else {
        showAlert('Error de Conexión', data.message || 'Error desconocido', 'error');
      }
    } catch (error: any) {
      showAlert('Error Crítico', error.message, 'error');
    } finally {
      setTestingService(null);
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Cargando métricas del sistema...</div>;
  }

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Salud del Sistema</h1>
          <p>Monitoreo en tiempo real del servidor y pasarelas de pago.</p>
        </div>
      </header>

      <div className="sa-content">
        <h2 className="sa-panel-title">Estado del Servidor</h2>
        <div className="sa-kpi-container" style={{ marginBottom: '3rem' }}>
          
          {/* API Server */}
          <div className="sa-kpi-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                  <Server size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>API Status</p>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: health?.status === 'ok' ? '#10b981' : '#ef4444', marginRight: '0.5rem' }}></span>
                    {health?.status === 'ok' ? 'Operativo' : 'Problemas'}
                  </h3>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Proceso principal respondiendo</p>
          </div>

          {/* Database */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#10b981' }}>
                    <Database size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Base de Datos</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: health?.dbStatus === 'ok' ? '#10b981' : '#ef4444', marginRight: '0.5rem' }}></span>
                      {health?.dbStatus === 'ok' ? 'Conectada' : 'Error'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => testConnection('db')}
                  disabled={testingService === 'db'}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                >
                  <RefreshCw size={12} className={testingService === 'db' ? 'spin' : ''} />
                  Probar
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Conexión a Supabase PostgreSQL</p>
            </div>
          </div>

          {/* Memory */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#ef4444' }}>
                <Activity size={24} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Memoria RAM (Heap)</p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                  {health ? formatBytes(health.memory.heapUsed) : '0 MB'}
                </h3>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>De {health ? formatBytes(health.memory.heapTotal) : '0 MB'} asignados</p>
          </div>

          {/* Uptime */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#fdf4ff', borderRadius: '8px', color: '#d946ef' }}>
                <Clock size={24} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Tiempo en Línea</p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                  {health ? formatUptime(health.uptime) : '0d 0h 0m'}
                </h3>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Desde el último inicio</p>
          </div>
        </div>
        
        {/* External Services Section */}
        <h2 className="sa-panel-title">Pasarelas de Pago Externas</h2>
        <div className="sa-kpi-container">
          
          {/* QPayPro */}
          <div className="sa-kpi-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: gateways?.qpaypro === 'ok' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', color: gateways?.qpaypro === 'ok' ? '#10b981' : '#ef4444' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>QPayPro</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: gateways?.qpaypro === 'ok' ? '#10b981' : (gateways ? '#ef4444' : '#cbd5e1'), marginRight: '0.5rem' }}></span>
                      {gateways ? (gateways.qpaypro === 'ok' ? 'En Línea' : 'Caído') : 'Verificando...'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => testConnection('qpaypro')}
                  disabled={testingService === 'qpaypro'}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                >
                  <RefreshCw size={12} className={testingService === 'qpaypro' ? 'spin' : ''} />
                  Probar
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>qpaypro.com (API REST)</p>
            </div>
          </div>

          {/* Recurrente */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: gateways?.recurrente === 'ok' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', color: gateways?.recurrente === 'ok' ? '#10b981' : '#ef4444' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Recurrente</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: gateways?.recurrente === 'ok' ? '#10b981' : (gateways ? '#ef4444' : '#cbd5e1'), marginRight: '0.5rem' }}></span>
                      {gateways ? (gateways.recurrente === 'ok' ? 'En Línea' : 'Caído') : 'Verificando...'}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => testConnection('recurrente')}
                  disabled={testingService === 'recurrente'}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                >
                  <RefreshCw size={12} className={testingService === 'recurrente' ? 'spin' : ''} />
                  Probar
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>app.recurrente.com (API REST)</p>
            </div>
          </div>

          {/* Resend */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                    <Mail size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Resend (Mails)</p>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginRight: '0.5rem' }}></span>
                      Configurado
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => testConnection('resend')}
                  disabled={testingService === 'resend'}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '0.25rem' }}
                >
                  <RefreshCw size={12} className={testingService === 'resend' ? 'spin' : ''} />
                  Test Email
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>api.resend.com (Envío Transaccional)</p>
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}} />
    </>
  );
}
