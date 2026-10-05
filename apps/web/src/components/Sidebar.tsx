'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Wallet, 
  Calendar, 
  Package, 
  Users, 
  ClipboardList,
  BarChart2, 
  Blocks, 
  Settings,
  ChevronDown,
  Wrench,
  Car,
  Clipboard,
  Receipt,
  CreditCard
} from 'lucide-react';
import './Sidebar.css';

// Arquitectura de navegación futura
const navGroups = [
  {
    name: null, // Sin título
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    name: 'Operación',
    items: [
      { name: 'Ventas', href: '/dashboard/ventas', icon: ShoppingCart },
      { name: 'Cobros', href: '/dashboard/cobros', icon: Wallet },
      { name: 'Pagos', href: '/dashboard/pagos', icon: CreditCard },
      { name: 'Recibos', href: '/dashboard/recibos', icon: Receipt },
      { name: 'Reservaciones', href: '/dashboard/reservaciones', icon: Calendar }
    ]
  },
  {
    name: 'Gestión',
    items: [
      { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
      { name: 'Productos', href: '/dashboard/products', icon: Package },
      { name: 'Inventario', href: '#', icon: ClipboardList }
    ]
  },
  {
    name: 'Administración',
    items: [
      { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart2 },
      { name: 'Integraciones', href: '/dashboard/integraciones', icon: Blocks },
      { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings }
    ]
  },
  {
    name: 'Taller',
    items: [
      { name: 'Dashboard Taller', href: '/dashboard/taller', icon: Wrench },
      { name: 'Órdenes', href: '/dashboard/taller/ordenes', icon: Clipboard },
      { name: 'Vehículos', href: '/dashboard/taller/vehiculos', icon: Car }
    ]
  }
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState('Mi Comercio');
  const [allowedFeatures, setAllowedFeatures] = useState<string[]>([]);
  const [hasTallerAddon, setHasTallerAddon] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me?t=' + Date.now(), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          console.log("DEBUG /api/auth/me response:", data);
          if (data.tenant?.name) {
            setTenantName(data.tenant.name);
          }
          if (data.tenant?.features) {
            setAllowedFeatures(data.tenant.features);
          }
          if (data.tenant?.hasTallerAddon !== undefined) {
            setHasTallerAddon(data.tenant.hasTallerAddon);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, []);

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">COMERZA</div>
        
        <div className="sidebar-header">
          <div className="tenant-selector">
            <div className="tenant-info">
              <h2 className="tenant-name">{tenantName}</h2>
              <div className="store-selector">
                <span className="store-name">Tienda Principal</span>
                <ChevronDown size={14} className="store-chevron" />
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group, i) => {
            // Filtrar items según features (y ocultar links '#' temporales)
            const visibleItems = group.items.filter(item => {
              if (item.href === '#') return false; // Modulos futuros no implementados
              if (group.name === 'Taller') return hasTallerAddon;
              if (item.name === 'Dashboard' || item.name === 'Reservaciones') return true;
              return allowedFeatures.includes(item.name);
            });

            if (visibleItems.length === 0) return null;

            const showGroupName = group.name && visibleItems.length > 1;

            return (
              <div key={i} className="nav-group">
                {showGroupName && <h3 className="nav-group-title">{group.name}</h3>}
                <div className="nav-group-items">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        <Icon size={18} className="nav-icon" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
