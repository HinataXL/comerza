import { cookies } from 'next/headers';
import { getTallerVehicleById, getTallerWorkOrders } from '@/lib/server/java-api';
import VehiculoDetailClient from './VehiculoDetailClient';
import { Vehicle, WorkOrder } from '@/types/taller';

export default async function VehiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) return <div>No hay sesión activa.</div>;

  let vehicle: Vehicle | null = null;
  let workOrders: WorkOrder[] = [];
  try {
    vehicle = await getTallerVehicleById(resolvedParams.id, token);
    const allWorkOrders = await getTallerWorkOrders(token);
    workOrders = allWorkOrders.filter((wo: WorkOrder) => wo.vehicle?.id === resolvedParams.id);
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
  }

  if (!vehicle) {
    return <div>Vehículo no encontrado.</div>;
  }

  return <VehiculoDetailClient vehicle={vehicle} workOrders={workOrders} />;
}
