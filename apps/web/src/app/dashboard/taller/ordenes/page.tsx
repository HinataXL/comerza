import { cookies } from 'next/headers';
import { getTallerWorkOrders } from '@/lib/server/java-api';
import OrdenesClient from './OrdenesClient';
import { WorkOrder } from '@/types/taller';

export default async function OrdenesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) return <div>No hay sesión activa.</div>;

  let orders: WorkOrder[] = [];
  try {
    orders = await getTallerWorkOrders(token);
  } catch (error) {
    console.error('Error fetching work orders:', error);
  }

  return <OrdenesClient initialOrders={orders} />;
}
