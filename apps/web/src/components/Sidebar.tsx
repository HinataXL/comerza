'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

export default function Sidebar({ isOpen, onClose, compact = false }: { isOpen?: boolean, onClose?: () => void, compact?: boolean }) {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState('Mi Comercio');
  const [allowedFeatures, setAllowedFeatures] = useState<string[]>([]);
  const [hasTallerAddon, setHasTallerAddon] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const main = document.querySelector<HTMLElement>('.main-content');
    const wasInert = main?.inert ?? false;
    if (main) main.inert = true;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose?.(); }
      if (event.key !== 'Tab') return;
      const elements = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a, button') || []);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); if (main) main.inert = wasInert; document.body.style.overflow = oldOverflow; previousFocus?.focus(); };
  }, [isOpen, onClose]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me?t=' + Date.now(), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
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
      {isOpen && <button type="button" className="sidebar-overlay" onClick={onClose} aria-label="Cerrar navegación" />}
      
      <aside ref={sidebarRef} role={isOpen ? 'dialog' : undefined} aria-modal={isOpen ? true : undefined} aria-label="Navegación de Comerza" className={`sidebar ${isOpen ? 'open' : ''}`}>
        {isOpen ? <button type="button" className="btn btn-outline" onClick={onClose}>Cerrar menú</button> : null}
        <div className="sidebar-brand">{compact ? <Image src="/figma/taller/craft-logo.svg" width={30} height={30} alt="Comerza" /> : 'COMERZA'}</div>
        
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
                        title={compact ? item.name : undefined}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon size={18} className="nav-icon" />
                        <span className={compact ? 'taller-nav-label' : undefined}>{item.name}</span>
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
