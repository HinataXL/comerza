'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoVehiculoClient({ customers }: { customers: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: formData.get('customerId'),
      plate: formData.get('plate'),
      brand: formData.get('brand'),
      model: formData.get('model'),
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      color: formData.get('color'),
      vin: formData.get('vin'),
      mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null,
      engine: formData.get('engine'),
      notes: formData.get('notes'),
    };

    try {
      const res = await fetch('/api/taller/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al crear el vehículo');
      }

      const vehicle = await res.json();
      router.push(`/dashboard/taller/vehiculos/${vehicle.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo Vehículo</h1>
          <p className="page-subtitle">Registrar un nuevo vehículo al taller</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div className="alert alert-error" style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Cliente *</label>
            <select name="customerId" className="form-control" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <option value="">Seleccione un cliente</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              ¿No existe? <Link href="/dashboard/clientes" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Crear nuevo cliente</Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Placa *</label>
              <input type="text" name="plate" required className="form-control" placeholder="P123ABC" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Marca *</label>
              <input type="text" name="brand" required className="form-control" placeholder="Toyota" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Modelo *</label>
              <input type="text" name="model" required className="form-control" placeholder="Corolla" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Año</label>
              <input type="number" name="year" className="form-control" placeholder="2018" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Color</label>
              <input type="text" name="color" className="form-control" placeholder="Gris" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>VIN</label>
              <input type="text" name="vin" className="form-control" placeholder="JTD123..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Kilometraje</label>
              <input type="number" name="mileage" className="form-control" placeholder="98400" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Motor</label>
              <input type="text" name="engine" className="form-control" placeholder="1.8L" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Notas</label>
            <textarea name="notes" className="form-control" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link href="/dashboard/taller/vehiculos" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
              Cancelar
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
              {loading ? 'Guardando...' : 'Guardar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
