'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  targetId: string | null;
  details: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch('/api/superadmin/audit', { credentials: 'include' });
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAudit();
    const interval = setInterval(fetchAudit, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('SUSPENDED')) return '#fee2e2';
    if (action.includes('ACTIVATED') || action.includes('CREATED')) return '#dcfce7';
    if (action.includes('IMPERSONATION')) return '#fef9c3';
    return '#f1f5f9';
  };
  
  const getActionTextColor = (action: string) => {
    if (action.includes('SUSPENDED')) return '#991b1b';
    if (action.includes('ACTIVATED') || action.includes('CREATED')) return '#166534';
    if (action.includes('IMPERSONATION')) return '#854d0e';
    return '#475569';
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Cargando bitácora de auditoría...</div>;
  }

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Bitácora de Auditoría</h1>
          <p>Registro inmutable de acciones críticas del sistema (50 más recientes).</p>
        </div>
      </header>

      <div className="sa-content">
        <div className="sa-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Fecha y Hora</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Acción</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Usuario (Actor)</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No hay registros de auditoría aún.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: getActionColor(log.action),
                        color: getActionTextColor(log.action)
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1e293b' }}>
                      {log.actor ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{log.actor.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{log.actor.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>{log.actorId.slice(0, 8)}...</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#475569', maxWidth: '300px' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {log.details ? (
                          (() => {
                            try {
                              return JSON.stringify(JSON.parse(log.details), null, 2);
                            } catch {
                              return log.details;
                            }
                          })()
                        ) : '-'}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
