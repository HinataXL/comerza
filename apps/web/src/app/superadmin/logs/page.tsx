'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Log {
  id: string;
  level: string;
  message: string;
  context: string | null;
  user: string | null;
  ip: string | null;
  path: string | null;
  origin: string | null;
  createdAt: string;
}

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats>({ total: 0, errors: 0, warnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/superadmin/logs');
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelStyle = (level: string) => {
    if (level === 'ERROR' || level === 'SERVER_ERROR') return 'bg-red-100 text-red-800';
    if (level === 'WARN') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Errores del sistema</h1>
          <p>Registro técnico de fallos del navegador y del servidor, URL, usuario y contexto.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/superadmin/audit" style={{ padding: '0.75rem 1.5rem', border: '2px solid #111827', background: '#FFFFFF', color: '#111827', fontWeight: 700, textDecoration: 'none' }}>
            VER AUDITORÍA
          </Link>
        </div>
      </header>

      <div className="sa-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="sa-kpi-container" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
          <div className="sa-kpi-box">
          <p className="sa-kpi-label">Registros</p>
          <p className="sa-kpi-value">{loading ? '-' : stats.total}</p>
        </div>
        <div className="sa-kpi-box">
          <p className="sa-kpi-label">Errores</p>
          <p className="sa-kpi-value">{loading ? '-' : stats.errors}</p>
        </div>
        <div className="sa-kpi-box">
          <p className="sa-kpi-label">Advertencias</p>
          <p className="sa-kpi-value">{loading ? '-' : stats.warnings}</p>
        </div>
      </div>

      <div className="sa-panel">
        <h3 className="text-lg font-bold text-[#0B152A] mb-2">Como usar este módulo</h3>
        <p className="text-gray-500 text-sm mb-1">
          Los errores del navegador y las pantallas de error del servidor se guardan aqui con contexto para revisar pantalla afectada, usuario, navegador, ruta y detalle técnico sin depender de capturas.
        </p>
        <p className="text-gray-500 text-sm">
          Para depuración local se puede activar <span className="font-bold text-[#00d0f1]">insightsDebug=true</span> en localStorage.
        </p>
      </div>

      <div className="sa-panel" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-[#00d0f1] uppercase">Fecha</th>
                <th className="py-4 px-6 text-xs font-bold text-[#00d0f1] uppercase">Nivel</th>
                <th className="py-4 px-6 text-xs font-bold text-[#00d0f1] uppercase">Usuario</th>
                <th className="py-4 px-6 text-xs font-bold text-[#00d0f1] uppercase w-1/4">Pantalla</th>
                <th className="py-4 px-6 text-xs font-bold text-[#00d0f1] uppercase w-1/4">Mensaje</th>
                <th className="py-4 px-6 text-xs font-bold text-[#00d0f1] uppercase">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">Cargando registros...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">No hay registros en el sistema</td>
                </tr>
              ) : (
                logs.map((log) => {
                  let parsedContext: any = {};
                  try {
                    parsedContext = log.context ? JSON.parse(log.context) : {};
                  } catch (e) {}

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('es-ES', { 
                          day: '2-digit', month: '2-digit', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${getLevelStyle(log.level)}`}>
                          {log.level === 'SERVER_ERROR' ? 'server.error' : log.level}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#0B152A]">{log.user || 'Usuario no identificado'}</div>
                        {log.ip && <div className="text-gray-400 text-xs mt-1">{log.ip}</div>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-300 font-mono text-xs mb-1 truncate max-w-[200px]" title={log.path || '-'}>
                          {log.path || '-'}
                        </div>
                        {parsedContext.userAgent && (
                          <div className="text-gray-500 text-xs line-clamp-2" title={parsedContext.userAgent}>
                            {parsedContext.userAgent}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#0B152A]">{log.message}</div>
                        {parsedContext.error && (
                          <div className="text-gray-500 text-xs mt-1 truncate max-w-[250px]" title={String(parsedContext.error)}>
                            {String(parsedContext.error)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-xs">
                        <div className="font-medium">{log.origin || 'Sistema'}</div>
                        {parsedContext.colno !== undefined && (
                          <div className="text-gray-400 mt-1">Columna: {parsedContext.colno}</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
}
