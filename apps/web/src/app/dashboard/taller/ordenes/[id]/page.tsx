import { cookies } from 'next/headers';
import { getTallerWorkOrderById } from '@/lib/server/java-api';
import OrdenDetailClient from './OrdenDetailClient';

export default async function OrdenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) return <div>No hay sesión activa.</div>;

  let workOrder = null;
  try {
    workOrder = await getTallerWorkOrderById(resolvedParams.id, token);
  } catch (error) {
    console.error('Error fetching work order:', error);
  }

  if (!workOrder) {
    return <div>Orden no encontrada.</div>;
  }

  return <OrdenDetailClient initialOrder={workOrder} token={token} />;
}
