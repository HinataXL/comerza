'use client';

import { useState, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar as CalendarIcon, X, Edit, Trash2, Search, Clock, AlignLeft } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';
import dynamic from 'next/dynamic';

const CalendarComponent = dynamic(() => import('./CalendarComponent'), {
  ssr: false,
  loading: () => <div className="flex-center" style={{ height: '75vh' }}><p className="text-secondary">Cargando calendario interactivo...</p></div>
});

interface Customer {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  title: string | null;
  customerId: string;
  customer: Customer;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'PENDING_RESCHEDULE';
  notes: string | null;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706', label: 'Pendiente' },
  CONFIRMED: { bg: '#dcfce7', text: '#15803d', label: 'Confirmada' },
  COMPLETED: { bg: '#e0e7ff', text: '#4338ca', label: 'Completada' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelada' },
  PENDING_RESCHEDULE: { bg: '#ede9fe', text: '#7c3aed', label: 'Reprogramar' },
};

interface ReservacionesClientProps {
  initialReservations: Reservation[];
  initialCustomers: Customer[];
}

export default function ReservacionesClient({ 
  initialReservations, 
  initialCustomers 
}: ReservacionesClientProps) {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Partial<Reservation>>({ 
    title: '', customerId: '', status: 'PENDING', notes: '' 
  });
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });

  const refreshReservations = async () => {
    try {
      const res = await fetch('/api/reservations', { 
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) setReservations(await res.json());
    } catch (err) {
      console.error('Error fetching reservations', err);
    }
  };

  const refreshCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { credentials: 'include' });
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error('Error fetching customers', err);
    }
  };

  const filteredReservations = reservations.filter(r => 
    r.customer.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
    (r.title && r.title.toLowerCase().includes(deferredSearch.toLowerCase()))
  );

  const handleOpenModal = (reservation?: Reservation) => {
    setIsCreatingCustomer(false);
    setNewCustomer({ name: '', email: '', phone: '' });
    
    if (reservation) {
      setIsEditing(true);
      const d = new Date(reservation.startTime);
      const offset = d.getTimezoneOffset() * 60000;
      const localStr = new Date(d.getTime() - offset).toISOString();
      setResDate(localStr.slice(0, 10));
      setResTime(localStr.slice(11, 16));
      
      setCurrentReservation({ 
        ...reservation, 
        title: reservation.title || '', 
        notes: reservation.notes || '',
      });
    } else {
      setIsEditing(false);
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localStr = new Date(now.getTime() - offset).toISOString();
      setResDate(localStr.slice(0, 10));
      setResTime(localStr.slice(11, 16));

      setCurrentReservation({ 
        title: '', 
        customerId: customers.length > 0 ? customers[0].id : '', 
        status: 'PENDING', 
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCreatingCustomer && !currentReservation.customerId) {
      showAlert('Advertencia', 'Debes seleccionar o crear un cliente.', 'warning');
      return;
    }
    
    if (isCreatingCustomer && !newCustomer.name) {
      showAlert('Advertencia', 'El nombre del cliente es requerido.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      let finalCustomerId = currentReservation.customerId;

      if (isCreatingCustomer) {
        const custRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newCustomer)
        });
        if (!custRes.ok) throw new Error('Error al crear el nuevo cliente');
        const custData = await custRes.json();
        finalCustomerId = custData.id;
      }

      const url = isEditing 
        ? `/api/reservations/${currentReservation.id}`
        : '/api/reservations';
      
      const method = isEditing ? 'PUT' : 'POST';

      const startDateTime = new Date(`${resDate}T${resTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      const dataToSave = {
        ...currentReservation,
        customerId: finalCustomerId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: isEditing ? currentReservation.status : 'PENDING'
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSave)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar reservación');
      }
      
      handleCloseModal();
      refreshReservations();
      if (isCreatingCustomer) refreshCustomers();
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReservation = (id: string) => {
    showConfirm('Eliminar Reservación', '¿Estás seguro de cancelar y eliminar esta reservación?', async () => {
      try {
        const res = await fetch(`/api/reservations/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Error al eliminar reservación');
        }
        refreshReservations();
      } catch (err: any) {
        showAlert('Error', err.message, 'error');
      }
    });
  };

  const formatDisplayDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Reservaciones</h1>
          <p className="text-secondary text-sm">Gestiona citas y reservas de tus clientes</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ backgroundColor: 'var(--surface-hover)', padding: '0.25rem', borderRadius: '8px', display: 'flex', gap: '0.25rem' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'list' ? 500 : 400
              }}
            >
              <AlignLeft size={16} /> Lista
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                backgroundColor: viewMode === 'calendar' ? 'var(--bg-card)' : 'transparent',
                boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'calendar' ? 500 : 400
              }}
            >
              <CalendarIcon size={16} /> Calendario
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Nueva Reservación
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="card" style={{ height: '75vh', padding: '1.5rem' }}>
          <CalendarComponent
            events={reservations.map(r => ({
              id: r.id,
              title: `${r.customer.name}${r.title ? ` - ${r.title}` : ''}`,
              start: new Date(r.startTime),
              end: new Date(r.endTime),
              resource: r
            }))}
            onSelectEvent={(event: any) => handleOpenModal(event.resource)}
            eventPropGetter={(event: any) => {
              const status = event.resource.status;
              const info = statusColors[status as keyof typeof statusColors] || { bg: '#f1f5f9', text: '#64748b' };
              return { 
                style: { 
                  backgroundColor: info.bg, 
                  color: info.text, 
                  border: `1px solid ${info.text}40`, 
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                } 
              };
            }}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar por cliente o motivo..." 
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '50%' }}>
                <CalendarIcon size={32} className="text-muted" />
              </div>
              <p className="text-secondary">No hay reservaciones agendadas para esta búsqueda.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Fecha y Hora</th>
                    <th>Cliente</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(res => {
                    const statusInfo = statusColors[res.status] || { bg: '#f1f5f9', text: '#64748b', label: res.status || 'Desconocido' };
                    return (
                      <tr key={res.id}>
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} className="text-muted" />
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                              {formatDisplayDate(res.startTime)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{res.customer.name}</span>
                        </td>
                        <td>{res.title || <span className="text-muted">Sin motivo</span>}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.text
                          }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                          <div className="flex-row" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} onClick={() => handleOpenModal(res)}>
                              <Edit size={16} className="text-secondary" />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', borderColor: 'transparent' }} onClick={() => handleDeleteReservation(res.id)}>
                              <Trash2 size={16} className="text-error" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.125rem' }}>{isEditing ? 'Editar Reservación' : 'Nueva Reservación'}</h3>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveReservation}>
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                
                {!isCreatingCustomer ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      className="form-input"
                      required
                      value={currentReservation.customerId}
                      onChange={(e) => setCurrentReservation({...currentReservation, customerId: e.target.value})}
                      style={{ flex: 1 }}
                    >
                      <option value="" disabled>Seleccione un cliente...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {!isEditing && (
                      <button type="button" className="btn btn-outline" onClick={() => setIsCreatingCustomer(true)}>
                        + Nuevo
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nuevo Cliente</span>
                      <button type="button" onClick={() => setIsCreatingCustomer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Cancelar
                      </button>
                    </div>
                    <div className="form-group">
                      <input type="text" className="form-input" placeholder="Nombre completo *" required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                      <input type="email" className="form-input" placeholder="Correo (Opcional)" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                      <input type="tel" className="form-input" placeholder="Teléfono (Opcional)" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Motivo de la reservación (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. Consulta de revisión"
                  value={currentReservation.title || ''}
                  onChange={(e) => setCurrentReservation({...currentReservation, title: e.target.value})}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Reservación *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Hora *</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="form-group">
                  <label className="form-label">Estado *</label>
                  <select 
                    className="form-input"
                    required
                    value={currentReservation.status}
                    onChange={(e) => setCurrentReservation({...currentReservation, status: e.target.value as any})}
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="COMPLETED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                    <option value="PENDING_RESCHEDULE">Reprogramación Pendiente</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notas Adicionales</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  placeholder="Detalles adicionales..."
                  value={currentReservation.notes || ''}
                  onChange={(e) => setCurrentReservation({...currentReservation, notes: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                  {isProcessing ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Agendar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
