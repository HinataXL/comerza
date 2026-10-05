'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Car, ClipboardList, Gauge, Search, Plus, ArrowRight } from 'lucide-react';

export default function NuevaOrdenClient({ customers, vehicles, defaultVehicleId }: { customers: any[], vehicles: any[], defaultVehicleId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (defaultVehicleId) {
      const vehicle = vehicles.find(v => v.id === defaultVehicleId);
      if (vehicle) {
        setSelectedVehicleId(vehicle.id);
        setSelectedCustomerId(vehicle.customer?.id || '');
        setStep(2); // Auto advance
      }
    }
  }, [defaultVehicleId, vehicles]);

  const filteredVehicles = selectedCustomerId ? vehicles.filter(v => v.customer?.id === selectedCustomerId) : [];
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: selectedCustomerId,
      vehicleId: selectedVehicleId,
      entryMileage: formData.get('entryMileage') ? parseInt(formData.get('entryMileage') as string) : null,
      fuelLevel: formData.get('fuelLevel') || 'UNKNOWN',
      customerComplaint: formData.get('customerComplaint'),
      initialInspection: formData.get('initialInspection'),
    };

    if (!data.customerId || !data.vehicleId) {
      setError('Debes seleccionar un cliente y un vehículo');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/taller/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al crear la orden');
      }

      const order = await res.json();
      router.push(`/dashboard/taller/ordenes/${order.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      
      <div style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <ClipboardList size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Apertura de Orden</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Registra un nuevo ingreso al taller.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* STEP 1: CLIENTE & VEHICULO */}
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</div>
              Identificación
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Cliente */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setSelectedVehicleId('');
                    }}
                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '1rem', backgroundColor: 'white', appearance: 'none', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="">Seleccione un cliente...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehículo */}
              {selectedCustomerId && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehículo de {selectedCustomer?.name}</label>
                  
                  {filteredVehicles.length === 0 ? (
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Este cliente no tiene vehículos registrados.</p>
                      <Link href={`/dashboard/taller/vehiculos/nuevo?customerId=${selectedCustomerId}`} className="btn btn-outline">
                        + Registrar Vehículo
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {filteredVehicles.map(v => (
                        <div 
                          key={v.id} 
                          onClick={() => setSelectedVehicleId(v.id)}
                          style={{ 
                            padding: '1rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: selectedVehicleId === v.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                            backgroundColor: selectedVehicleId === v.id ? 'var(--accent-light)' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedVehicleId === v.id ? 'var(--accent)' : 'var(--text-primary)' }}>{v.plate}</span>
                            {selectedVehicleId === v.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />}
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{v.brand} {v.model}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {step === 1 && selectedCustomerId && selectedVehicleId && (
               <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                 <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                   Continuar <ArrowRight size={16} />
                 </button>
               </div>
            )}
          </div>

          {/* STEP 2: DETALLES DE INGRESO */}
          {step === 2 && (
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '2rem', boxShadow: 'var(--shadow-sm)', animation: 'slideUp 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</div>
                  Detalles del Ingreso
                </h2>
                <button type="button" onClick={() => setStep(1)} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>Modificar vehículo</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Kilometraje (Opcional)</label>
                    <div style={{ position: 'relative' }}>
                      <Gauge size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="number" name="entryMileage" placeholder="Ej: 98500" style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '1rem', outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nivel Combustible (Opcional)</label>
                    <select name="fuelLevel" style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '1rem', backgroundColor: 'white', outline: 'none' }}>
                      <option value="UNKNOWN">Desconocido</option>
                      <option value="EMPTY">Vacío</option>
                      <option value="QUARTER">1/4</option>
                      <option value="HALF">1/2</option>
                      <option value="THREE_QUARTERS">3/4</option>
                      <option value="FULL">Lleno</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Motivo principal de ingreso *</label>
                  <textarea name="customerComplaint" required rows={3} placeholder="Ruido extraño al frenar, revisión general de 10k km..." style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}></textarea>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Observaciones Visuales Iniciales (Opcional)</label>
                  <textarea name="initialInspection" rows={2} placeholder="Golpe en bumper frontal derecho..." style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}></textarea>
                </div>

              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Link href="/dashboard/taller/ordenes" className="btn btn-outline">
                  Cancelar
                </Link>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                  {loading ? 'Creando...' : 'Crear Orden Oficial'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
