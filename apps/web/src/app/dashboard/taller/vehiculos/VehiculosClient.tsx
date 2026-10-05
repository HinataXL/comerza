'use client';
import { useState } from 'react';
import { Vehicle } from '@/types/taller';
import Link from 'next/link';
import { Car, Search, User, Gauge, Calendar, MoreHorizontal, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VehiculosClient({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredVehicles = initialVehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    return v.plate.toLowerCase().includes(term) ||
           v.brand.toLowerCase().includes(term) ||
           v.model.toLowerCase().includes(term) ||
           (v.customer?.name || '').toLowerCase().includes(term) ||
           (v.vin && v.vin.toLowerCase().includes(term));
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER & FILTERS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Directorio de Vehículos</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: 500 }}>Base de datos de vehículos de clientes.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', flex: 1, maxWidth: '400px', boxShadow: 'var(--shadow-xs)' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar placa, cliente, VIN o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          <Link href="/dashboard/taller/vehiculos/nuevo" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Registrar vehículo
          </Link>
        </div>
      </div>

      {initialVehicles.length === 0 ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)', padding: '4rem', marginTop: '1rem' }}>
           <Car size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
           <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>No hay vehículos registrados</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Registra el primer vehículo para comenzar a operar.</p>
           <Link href="/dashboard/taller/vehiculos/nuevo" className="btn btn-primary">
             Registrar vehículo
           </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
          
          <style>{`
            .vehicle-row { transition: all 0.2s; cursor: pointer; border-bottom: 1px solid var(--border); }
            .vehicle-row:last-child { border-bottom: none; }
            .vehicle-row:hover { background-color: var(--bg-base); }
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
                <th>Placa / Vehículo</th>
                <th>Cliente</th>
                <th>Kilometraje</th>
                <th>Año</th>
                <th>Última Visita</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => (
                <tr key={vehicle.id} className="vehicle-row" onClick={() => router.push(`/dashboard/taller/vehiculos/${vehicle.id}`)}>
                  <td>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.125rem' }}>
                      {vehicle.plate}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {vehicle.brand} {vehicle.model}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <User size={14} color="var(--text-muted)" /> {vehicle.customer?.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <Gauge size={14} color="var(--text-muted)" /> {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '--'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {vehicle.year || '--'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <Calendar size={14} color="var(--text-muted)" /> {new Date(vehicle.updatedAt || vehicle.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && initialVehicles.length > 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron vehículos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* MOBILE CARDS */}
          <div className="mobile-cards">
            {filteredVehicles.map(vehicle => (
              <div key={vehicle.id} className="mobile-card" onClick={() => router.push(`/dashboard/taller/vehiculos/${vehicle.id}`)}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{vehicle.plate}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{vehicle.brand} {vehicle.model}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                   <User size={14} color="var(--text-muted)" /> {vehicle.customer?.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                     <Gauge size={12} /> {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '--'}
                   </div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                     <Calendar size={12} /> {new Date(vehicle.updatedAt || vehicle.createdAt).toLocaleDateString()}
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
