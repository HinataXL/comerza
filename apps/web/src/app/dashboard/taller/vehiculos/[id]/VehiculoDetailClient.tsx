'use client';
import { Vehicle, WorkOrder } from '@/types/taller';
import Link from 'next/link';
import { ArrowLeft, Car, Calendar, Wrench, AlertCircle, Plus, User, Info, CalendarClock, CreditCard } from 'lucide-react';
import WorkOrderStatusBadge from '../../components/WorkOrderStatusBadge';
import { useRouter } from 'next/navigation';

export default function VehiculoDetailClient({ vehicle, workOrders }: { vehicle: Vehicle; workOrders: WorkOrder[] }) {
  const router = useRouter();
  
  // Sort work orders by date descending
  const sortedWorkOrders = [...workOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <Link href="/dashboard/taller/vehiculos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid var(--border)', color: 'var(--text-secondary)', transition: 'all 0.2s', marginTop: '0.25rem' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {vehicle.plate}
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontWeight: 600 }}>
              {vehicle.brand} {vehicle.model} {vehicle.year}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500, backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', width: 'fit-content' }}>
              <User size={14} color="var(--text-muted)" /> {vehicle.customer?.name}
            </div>
          </div>
        </div>
        
        <Link href={`/dashboard/taller/ordenes/nueva?vehicleId=${vehicle.id}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
          <Plus size={18} /> Nueva Orden de Trabajo
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* VEHICLE INFO CARD */}
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '8px' }}>
              <Info size={18} />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Ficha Técnica
            </h2>
          </div>
          
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>VIN</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{vehicle.vin || 'No registrado'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Color</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{vehicle.color || 'No registrado'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Kilometraje actual</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'No registrado'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Motor</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{vehicle.engine || 'No registrado'}</p>
              </div>
            </div>
            
            {vehicle.notes && (
              <div style={{ marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Notas adicionales</p>
                <div style={{ backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {vehicle.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE OF SERVICES */}
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '8px' }}>
              <CalendarClock size={18} />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Historial de Servicios
            </h2>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            {sortedWorkOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Wrench size={48} color="var(--border-strong)" style={{ marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Sin historial</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, maxWidth: '250px' }}>Este vehículo aún no ha recibido servicios en el taller.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                {/* Timeline vertical line */}
                <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'var(--border)' }}></div>
                
                {sortedWorkOrders.map((order, index) => (
                  <div key={order.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                    {/* Timeline dot */}
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: order.status === 'DELIVERED' ? 'var(--success)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '4px solid white', boxShadow: '0 0 0 1px var(--border)' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }}></div>
                    </div>
                    
                    {/* Timeline content */}
                    <div 
                      onClick={() => router.push(`/dashboard/taller/ordenes/${order.id}`)}
                      style={{ flex: 1, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      className="timeline-card-hover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{order.workOrderNumber}</div>
                        </div>
                        <WorkOrderStatusBadge status={order.status} />
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                        {order.customerComplaint || 'Servicio general'}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-strong)', paddingTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {order.entryMileage ? `${order.entryMileage.toLocaleString()} km` : 'Sin km registrado'}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CreditCard size={14} color="var(--text-muted)" /> Q{order.total?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .timeline-card-hover:hover {
          background-color: white !important;
          box-shadow: var(--shadow-sm);
          border-color: var(--accent-glow);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
