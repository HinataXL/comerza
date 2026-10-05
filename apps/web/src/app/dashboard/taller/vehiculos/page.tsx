import { cookies } from 'next/headers';
import { getTallerVehicles } from '@/lib/server/java-api';
import VehiculosClient from './VehiculosClient';
import { Vehicle } from '@/types/taller';

export default async function VehiculosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) return <div>No hay sesión activa.</div>;

  let vehicles: Vehicle[] = [];
  try {
    vehicles = await getTallerVehicles(token);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
  }

  return <VehiculosClient initialVehicles={vehicles} />;
}
