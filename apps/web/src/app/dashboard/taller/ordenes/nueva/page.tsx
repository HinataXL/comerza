import { cookies } from 'next/headers';
import { getCustomers, getTallerVehicles } from '@/lib/server/java-api';
import NuevaOrdenClient from './NuevaOrdenClient';

export default async function NuevaOrdenPage({ searchParams }: { searchParams: Promise<{ vehicleId?: string }> }) {
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) return <div>No hay sesión activa.</div>;

  let customers: any[] = [];
  let vehicles: any[] = [];
  try {
    customers = await getCustomers(token);
    vehicles = await getTallerVehicles(token);
  } catch (error) {
    console.error('Error fetching data for nueva orden:', error);
  }

  return <NuevaOrdenClient customers={customers} vehicles={vehicles} defaultVehicleId={resolvedParams.vehicleId} />;
}
