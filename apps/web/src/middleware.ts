import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const pathname = request.nextUrl.pathname;

  // Si estamos en mantenimiento y la ruta no es /mantenimiento, redirigir
  if (isMaintenanceMode && pathname !== '/mantenimiento') {
    // Excluir rutas de API y archivos estáticos (aunque el matcher ya los excluya, por seguridad)
    if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      const maintenanceUrl = new URL('/mantenimiento', request.url);
      return NextResponse.redirect(maintenanceUrl);
    }
  }

  // Si no estamos en mantenimiento pero tratamos de acceder a /mantenimiento, regresar al inicio
  if (!isMaintenanceMode && pathname === '/mantenimiento') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Lógica original de protección de rutas (Dashboard y Superadmin)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin')) {
    const token = request.cookies.get('comerza_token');

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Configurar el matcher para que se ejecute en todas las rutas excepto estáticos y api internos de Next
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)'],
};
