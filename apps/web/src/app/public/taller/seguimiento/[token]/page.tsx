import { getPublicTrackingDetails } from '@/lib/server/java-api';
import SeguimientoClient from './SeguimientoClient';

export default async function SeguimientoPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  let data = null;
  let error = null;

  try {
    data = await getPublicTrackingDetails(resolvedParams.token);
  } catch (err: any) {
    error = err.message || 'Error al obtener el seguimiento. Es posible que el enlace haya expirado o ya no sea válido.';
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px', paddingBottom: '3rem' }}>
        {error ? (
          <div className="card fade-in" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
            <h1 style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '1.2rem' }}>Enlace no disponible</h1>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        ) : (
          <SeguimientoClient initialData={data} />
        )}
      </div>
    </div>
  );
}
