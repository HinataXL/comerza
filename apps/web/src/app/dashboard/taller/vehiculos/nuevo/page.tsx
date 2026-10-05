import { cookies } from 'next/headers';
import { getCustomers } from '@/lib/server/java-api';
import NuevoVehiculoClient from './NuevoVehiculoClient';

export default async function NuevoVehiculoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) return <div>No hay sesión activa.</div>;

  let customers: any[] = [];
  try {
    customers = await getCustomers(token);
  } catch (error) {
    console.error('Error fetching customers:', error);
  }

  return <NuevoVehiculoClient customers={customers} />;
}
