import { cookies } from 'next/headers';
import { getTallerWorkOrders } from '@/lib/server/java-api';
import TallerDashboardClient from './TallerDashboardClient';
import { WorkOrder } from '@/types/taller';
import { redirect } from 'next/navigation';
import { JavaApiError } from '@/lib/server/java-api';

export const metadata = { title: 'Dashboard de Taller' };

export default async function TallerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let workOrders: WorkOrder[] = [];
  let initialError = false;
  try {
    workOrders = await getTallerWorkOrders(token);
  } catch (error) {
    if (error instanceof JavaApiError && error.status === 401) redirect('/login');
    console.error('Error fetching work orders for dashboard:', error);
    initialError = true;
  }

  return <TallerDashboardClient initialOrders={workOrders} initialError={initialError} />;
}
