'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Globe, 
  Store, 
  Users, 
  Settings,
  LogOut,
  ShieldCheck,
  Layers,
  ShieldAlert,
  BellRing,
  Bug
} from 'lucide-react';

const adminNavItems = [
  { name: 'Panel Global', href: '/superadmin', icon: Globe },
  { name: 'Comercios', href: '/superadmin/tenants', icon: Store },
  { name: 'Planes', href: '/superadmin/planes', icon: Layers },
  { name: 'Usuarios', href: '/superadmin/users', icon: Users },
  { name: 'Auditoría', href: '/superadmin/audit', icon: ShieldAlert },
  { name: 'Errores (Logs)', href: '/superadmin/logs', icon: Bug },
  { name: 'Notificaciones', href: '/superadmin/notificaciones', icon: BellRing },
  { name: 'Ajustes', href: '/superadmin/settings', icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="sa-layout">
      {/* SuperAdmin Sidebar */}
      <aside className="sa-sidebar">
        <div className="sa-brand">
          <h2 className="sa-brand-title">COMERZA</h2>
          <p className="sa-brand-subtitle">Superadmin Control</p>
        </div>

        <nav className="sa-nav">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`sa-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sa-sidebar-footer">
          <button 
            onClick={handleLogout}
            className="sa-logout-btn" 
          >
            <LogOut size={18} />
            <span>CERRAR SESIÓN</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sa-main">
        {children}
      </main>
    </div>
  );
}
