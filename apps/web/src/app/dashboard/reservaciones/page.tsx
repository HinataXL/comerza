import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReservacionesClient from './ReservacionesClient';
import { getReservations, getCustomers, JavaApiError } from '@/lib/server/java-api';

export default async function ReservationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const [reservations, customers] = await Promise.all([
      getReservations(token),
      getCustomers(token)
    ]);

    return (
      <ReservacionesClient 
        initialReservations={reservations} 
        initialCustomers={customers} 
      />
    );
  } catch (error) {
    if (error instanceof JavaApiError) {
      if (error.status === 401) {
        redirect('/login');
      }
    }
    throw error;
  }
}
