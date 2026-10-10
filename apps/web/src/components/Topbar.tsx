'use client';
import { useEffect, useState } from 'react';
import { Search, Bell, Plus, X, Info, AlertTriangle, CheckCircle2, Menu, LogOut, Settings, User, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './Topbar.css';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  title: string;
  message: string;
}

export default function Topbar({ onMenuClick, tallerDashboard = false }: { onMenuClick?: () => void, tallerDashboard?: boolean }) {
  const router = useRouter();
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('Administrador');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [tenantName, setTenantName] = useState('');
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!showNotifications && !showProfileMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowNotifications(false);
      setShowProfileMenu(false);
      const label = showProfileMenu ? 'Opciones de usuario' : 'Notificaciones';
      document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showNotifications, showProfileMenu]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setUserName(data.user.name);
          }
          if (data.user?.role) {
            setUserRole(data.user.role === 'ADMIN' ? 'Administrador' : data.user.role === 'SELLER' ? 'Vendedor' : data.user.role === 'SUPERADMIN' ? 'Superadmin' : data.user.role);
            if (data.user.role === 'SUPERADMIN') {
              setIsSuperadmin(true);
            }
          }
          if (data.isImpersonating) {
            setIsImpersonating(true);
            setIsSuperadmin(true);
            setTenantName(data.tenant?.name || 'este comercio');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchMe();
    fetchNotifications();

    const eventSource = new EventSource('/api/notifications/stream', { withCredentials: true });

    eventSource.addEventListener('notification', (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
      } catch (err) {
        console.error('Error parsing real-time notification:', err);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDismissNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const handleReturnToSuperadmin = async () => {
    try {
      const res = await fetch('/api/auth/unimpersonate', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        window.location.href = '/superadmin';
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.isSuperadmin) {
          window.location.href = '/superadmin';
        } else {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {isImpersonating && (
        <div style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', padding: '0.5rem 1.5rem', textAlign: 'center', color: 'white', fontWeight: 700, fontSize: '0.8125rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <span>⚡ MODO DIOS ACTIVO: Navegando como Administrador en {tenantName}</span>
          <button onClick={handleReturnToSuperadmin} style={{ background: 'white', color: '#ea580c', border: 'none', padding: '0.25rem 0.875rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}>
            SALIR
          </button>
        </div>
      )}
      <header className="topbar">
          <div className="topbar-left">
            <button 
              className="icon-btn menu-btn" 
              onClick={onMenuClick}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            {tallerDashboard ? <h1 className="taller-topbar-title">Dashboard de Taller</h1> : null}
          </div>

          <div className="topbar-right">
            {tallerDashboard ? <Link href="/dashboard/taller/ordenes" className="icon-btn" aria-label="Buscar órdenes" title="Buscar órdenes"><Search size={18} /></Link> : <div className="search-container">
              <Search size={18} className="search-icon" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Buscar clientes, productos, facturas..." 
                className="search-input"
                aria-label="Buscar"
              />
            </div>}

            <Link href={tallerDashboard ? '/dashboard/taller/ordenes/nueva' : '/dashboard/ventas'} className="btn btn-primary new-sale-btn" aria-label={tallerDashboard ? 'Nueva orden' : 'Nueva venta'} title={tallerDashboard ? 'Nueva orden' : 'Nueva venta'}>
              <Plus size={18} />
              <span className="new-sale-text">{tallerDashboard ? 'Nueva orden' : 'Nueva venta'}</span>
            </Link>

            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn relative" 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notificaciones"
                aria-expanded={showNotifications}
                aria-controls="comerza-notifications"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div id="comerza-notifications" className="dropdown-panel notifications-panel">
                  <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notificaciones</h3>
                  </div>
                  
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        Sin notificaciones nuevas
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} style={{ 
                          padding: '0.875rem 1.25rem', 
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                        }}>
                          <div style={{ flexShrink: 0, marginTop: '2px' }}>
                            {notif.type === 'INFO' && <Info size={16} color="var(--accent)" />}
                            {notif.type === 'WARNING' && <AlertTriangle size={16} color="var(--warning)" />}
                            {notif.type === 'SUCCESS' && <CheckCircle2 size={16} color="var(--success)" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{notif.title}</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              {notif.message}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDismissNotification(notif.id)}
                            className="dismiss-btn"
                            title="Marcar como leída"
                            aria-label="Marcar notificación como leída"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button 
                className="user-profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Opciones de usuario"
                aria-expanded={showProfileMenu}
                aria-controls="comerza-profile-menu"
              >
                <div className="avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showProfileMenu && (
                <div id="comerza-profile-menu" className="dropdown-panel profile-panel">
                  <div className="profile-header">
                    <p className="profile-name">{userName}</p>
                    <p className="profile-role">{userRole}</p>
                  </div>
                  <div className="profile-menu">
                    {isSuperadmin && !isImpersonating && (
                      <Link href="/superadmin" className="profile-menu-item" style={{ color: '#6366f1', fontWeight: 600, background: '#eef2ff' }}>
                        <Shield size={16} /> Panel Superadmin
                      </Link>
                    )}
                    <Link href="/dashboard/perfil" className="profile-menu-item">
                      <User size={16} /> Perfil
                    </Link>
                    <Link href="/dashboard/configuracion" className="profile-menu-item">
                      <Settings size={16} /> Configuración de cuenta
                    </Link>
                    <div className="profile-divider"></div>
                    <button onClick={handleLogout} className="profile-menu-item logout-btn">
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </header>
    </>
  );
}
