import { cookies } from 'next/headers';
import { getTallerWorkOrders } from '@/lib/server/java-api';
import TallerDashboardClient from './TallerDashboardClient';
import { WorkOrder } from '@/types/taller';

export default async function TallerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) {
    return <div>No hay sesión activa.</div>;
  }

  let workOrders: WorkOrder[] = [];
  try {
    workOrders = await getTallerWorkOrders(token);
  } catch (error) {
    console.error('Error fetching work orders for dashboard:', error);
    // Continue with empty array to let client handle empty state
  }

  return <TallerDashboardClient initialOrders={workOrders} token={token} />;
}
