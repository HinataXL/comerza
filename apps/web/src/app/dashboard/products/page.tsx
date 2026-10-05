import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProductsClient from './ProductsClient';
import { getProducts, JavaApiError } from '@/lib/server/java-api';

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const products = await getProducts(token);

    return (
      <ProductsClient initialProducts={products} />
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
