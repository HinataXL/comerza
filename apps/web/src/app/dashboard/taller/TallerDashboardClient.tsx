'use client';
import { useState } from 'react';
import { WorkOrder } from '@/types/taller';
import WorkOrderStatusBadge, { statusMap } from './components/WorkOrderStatusBadge';
import { Car, ClipboardList, CheckCircle2, AlertCircle, Wrench, Clock, Search, User } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TallerDashboardClient({ initialOrders, token }: { initialOrders: WorkOrder[], token: string }) {
  const [orders, setOrders] = useState<WorkOrder[]>(initialOrders);
  
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const readyOrders = orders.filter(o => o.status === 'READY');
  const inRepairOrders = orders.filter(o => o.status === 'IN_REPAIR');
  const waitingOrders = orders.filter(o => o.status === 'WAITING_APPROVAL');
  
  const columns = ['RECEIVED', 'DIAGNOSIS', 'WAITING_APPROVAL', 'IN_REPAIR', 'QUALITY_CONTROL', 'READY'] as const;

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    if (!orderId) return;

    const orderToMove = orders.find(o => o.id === orderId);
    if (!orderToMove || orderToMove.status === newStatus) return;

    // Optional: Add simple transition rules (e.g., cannot skip directly to READY from RECEIVED without QC, etc.)
    // For now, allow any move that's available on Kanban to match the prompt's flexibility.

    // Optimistic Update
    const prevOrders = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));

    try {
      const res = await fetch(`/api/taller/work-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newStatus })
      });
      if (!res.ok) {
        throw new Error('Error al actualizar el estado de la orden');
      }
      // Replace with backend response to get correct timestamps/snapshots
      const updatedOrder = await res.json();
      setOrders(current => current.map(o => o.id === orderId ? updatedOrder : o));
    } catch (err: any) {
      alert(err.message);
      // Revert optimistic update
      setOrders(prevOrders);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Taller</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Resumen operativo del día.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard/taller/vehiculos/nuevo" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={16} /> Registrar vehículo
          </Link>
          <Link href="/dashboard/taller/ordenes/nueva" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={16} /> Nueva orden
          </Link>
        </div>
      </div>

      {/* METRICS ROW (COMPACT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', padding: '0.75rem', borderRadius: '50%' }}>
            <ClipboardList size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{activeOrders.length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>órdenes activas</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: '50%' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{waitingOrders.length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>pendientes de aprobación</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', padding: '0.75rem', borderRadius: '50%' }}>
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{inRepairOrders.length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>en reparación</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem', borderRadius: '50%' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{readyOrders.length}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>listas para entregar</div>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div style={{ flex: 1, display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', minHeight: '500px' }} className="hide-scrollbar">
        {activeOrders.length === 0 ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)', padding: '4rem' }}>
             <Car size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>No hay órdenes activas</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Cuando recibas un vehículo, aparecerá aquí.</p>
             <Link href="/dashboard/taller/ordenes/nueva" className="btn btn-primary">
               Crear primera orden
             </Link>
          </div>
        ) : (
          columns.map(col => {
            const columnOrders = activeOrders.filter(o => o.status === col);
            const config = statusMap[col] || { label: col, color: 'var(--text-muted)', bg: 'var(--bg-base)' };
            
            return (
              <div 
                key={col} 
                style={{ width: '300px', minWidth: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.25rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: config.color }}>
                    {config.label}
                  </h3>
                  <div style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                    {columnOrders.length}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {columnOrders.map(order => (
                    <div 
                      key={order.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      style={{ cursor: 'grab' }}
                    >
                      <Link href={`/dashboard/taller/ordenes/${order.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                        <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-xs)', borderLeft: `3px solid ${config.color}`, transition: 'all 0.2s' }} className="kanban-card">
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{order.workOrderNumber}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hace {formatDistanceToNow(new Date(order.updatedAt || order.createdAt), { locale: es })}</span>
                          </div>
                          
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
                            {order.vehicle?.plate}
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 500 }}>
                            {order.vehicle?.brand} {order.vehicle?.model}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                             <User size={14} />
                             {order.customer?.name}
                          </div>
                          
                          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                               <Clock size={12} /> {order.entryMileage ? `${order.entryMileage.toLocaleString()} km` : 'Sin km'}
                             </div>
                             
                             {order.assignedUser && (
                               <div style={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                 {order.assignedUser.name.split(' ')[0]}
                               </div>
                             )}
                          </div>

                        </div>
                      </Link>
                    </div>
                  ))}
                  
                  {columnOrders.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .kanban-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-strong); }
        .dragging { opacity: 0.5; cursor: grabbing !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
