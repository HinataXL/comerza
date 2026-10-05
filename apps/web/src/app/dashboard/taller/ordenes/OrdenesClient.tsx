'use client';
import { useState } from 'react';
import { WorkOrder } from '@/types/taller';
import Link from 'next/link';
import { ClipboardList, Search, Filter, MoreHorizontal, Car, Calendar, User, UserCircle } from 'lucide-react';
import WorkOrderStatusBadge from '../components/WorkOrderStatusBadge';
import { useRouter } from 'next/navigation';

export default function OrdenesClient({ initialOrders }: { initialOrders: WorkOrder[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const filteredOrders = initialOrders.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      o.workOrderNumber.toLowerCase().includes(term) ||
      o.vehicle?.plate.toLowerCase().includes(term) ||
      o.customer?.name.toLowerCase().includes(term) ||
      (o.vehicle?.brand || '').toLowerCase().includes(term);
      
    const matchStatus = statusFilter ? o.status === statusFilter : true;
    
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER & FILTERS BAR */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Órdenes de Trabajo</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Gestión y seguimiento de vehículos.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', flex: 1, maxWidth: '320px', boxShadow: 'var(--shadow-xs)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar OT, placa, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', boxShadow: 'var(--shadow-xs)' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="">Todos los estados</option>
              <option value="RECEIVED">Recibido</option>
              <option value="DIAGNOSIS">Diagnóstico</option>
              <option value="WAITING_APPROVAL">Pendiente aprobación</option>
              <option value="APPROVED">Aprobado</option>
              <option value="IN_REPAIR">En reparación</option>
              <option value="QUALITY_CONTROL">Control de calidad</option>
              <option value="READY">Listo</option>
              <option value="DELIVERED">Entregado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <Link href="/dashboard/taller/ordenes/nueva" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={16} /> Nueva orden
          </Link>
        </div>
      </div>

      {initialOrders.length === 0 ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)', padding: '4rem', marginTop: '1rem' }}>
           <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
           <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>No hay órdenes activas</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Crea una nueva orden de trabajo para comenzar el seguimiento.</p>
           <Link href="/dashboard/taller/ordenes/nueva" className="btn btn-primary">
             Crear Orden
           </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
          
          <style>{`
            .order-row { transition: all 0.2s; cursor: pointer; border-bottom: 1px solid var(--border); }
            .order-row:last-child { border-bottom: none; }
            .order-row:hover { background-color: var(--bg-base); }
            .mobile-cards { display: none; }
            .desktop-table { display: table; width: 100%; border-collapse: collapse; }
            .desktop-table th { text-align: left; padding: 1rem 1.25rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; background-color: var(--bg-base); border-bottom: 1px solid var(--border); }
            .desktop-table td { padding: 1rem 1.25rem; vertical-align: middle; }
            
            @media (max-width: 768px) {
              .desktop-table { display: none; }
              .mobile-cards { display: flex; flexDirection: column; padding: 1rem; gap: 1rem; background-color: var(--bg-base); }
              .mobile-card { background: white; border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border); box-shadow: var(--shadow-xs); display: flex; flex-direction: column; gap: 0.75rem; }
            }
          `}</style>

          <table className="desktop-table">
            <thead>
              <tr>
                <th>OT</th>
                <th>Placa / Vehículo</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Ingreso</th>
                <th>Responsable</th>
                <th>Total</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="order-row" onClick={() => router.push(`/dashboard/taller/ordenes/${order.id}`)}>
                  <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {order.workOrderNumber}
                  </td>
                  <td>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.125rem' }}>
                      {order.vehicle?.plate}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <User size={14} color="var(--text-muted)" /> {order.customer?.name}
                    </div>
                  </td>
                  <td><WorkOrderStatusBadge status={order.status} /></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <UserCircle size={16} color="var(--text-muted)" />
                      {order.assignedUser?.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin asignar</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Q {order.total?.toFixed(2)}
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && initialOrders.length > 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron órdenes con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* MOBILE CARDS */}
          <div className="mobile-cards">
            {filteredOrders.map(order => (
              <div key={order.id} className="mobile-card" onClick={() => router.push(`/dashboard/taller/ordenes/${order.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{order.workOrderNumber}</div>
                  <WorkOrderStatusBadge status={order.status} />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{order.vehicle?.plate}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{order.vehicle?.brand} {order.vehicle?.model}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                   <User size={14} color="var(--text-muted)" /> {order.customer?.name}
                </div>
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                     <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                   </div>
                   <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                     Q {order.total?.toFixed(2)}
                   </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
