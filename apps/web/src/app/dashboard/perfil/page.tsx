import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/server/java-api';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('comerza_token')?.value;

  if (!token) {
    return <div>No hay sesión activa.</div>;
  }

  let userProfile = null;
  try {
    userProfile = await getCurrentUser(token);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return <div>Error al cargar el perfil.</div>;
  }

  return <PerfilClient initialProfile={userProfile} token={token} />;
}
