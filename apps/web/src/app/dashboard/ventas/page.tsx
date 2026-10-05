import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VentasClient from './VentasClient';
import { getProducts, getCustomers, getCurrentUser, JavaApiError } from '@/lib/server/java-api';

export default async function PosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const [products, customers, me] = await Promise.all([
      getProducts(token),
      getCustomers(token),
      getCurrentUser(token)
    ]);

    const allowedFeatures = me?.tenant?.features || [];

    return (
      <VentasClient 
        initialProducts={products}
        initialCustomers={customers}
        initialAllowedFeatures={allowedFeatures}
      />
    );
  } catch (error) {
    if (error instanceof JavaApiError) {
      if (error.status === 401) {
        redirect('/login');
      }
      // Note: 403 or other 5xx errors will bubble up to Next.js error boundary.
      // We do not convert 403 to 401 as requested.
    }
    throw error;
  }
}
