'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Plus, Search, MoreVertical, X, Copy, CheckCircle, Power, PowerOff, Eye, Trash2 } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';
import '../../../components/dashboard/dashboard.css'; // Reutilizar estilos de tabla

export default function SuperAdminTenants() {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', adminName: '', adminEmail: '' });
  const [successData, setSuccessData] = useState<{ email: string, password: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/superadmin/tenants', {
        credentials: 'include'
      });
      
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setTenants(data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTenants();
  }, [router]);

  const toggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        setTenants(tenants.map(t => t.id === tenantId ? { ...t, isActive: !currentStatus } : t));
      }
    } catch (err) {
      console.error('Error toggling status', err);
    }
  };

  const toggleTallerAddon = async (tenantId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/taller`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        setTenants(tenants.map(t => t.id === tenantId ? { ...t, hasTallerAddon: !currentStatus } : t));
      }
    } catch (err) {
      console.error('Error toggling taller addon', err);
    }
  };

  const impersonate = async (tenantId: string) => {
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        showAlert('Error', data.message || 'Error al iniciar Modo Dios', 'error');
      }
    } catch (err) {
      console.error('Error al iniciar Modo Dios', err);
      showAlert('Error', 'Error de red al intentar Modo Dios', 'error');
    }
  };

  const togglePlan = (tenantId: string, currentPlan: string) => {
    const newPlan = currentPlan === 'PRO' ? 'PREMIUM' : 'PRO';
    showConfirm('Cambiar Plan', `¿Estás seguro de cambiar este comercio al plan ${newPlan}?`, async () => {
      try {
        const res = await fetch(`/api/superadmin/tenants/${tenantId}/plan`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: newPlan }),
          credentials: 'include'
        });
        if (res.ok) {
          setTenants(tenants.map(t => t.id === tenantId ? { ...t, plan: newPlan } : t));
        }
      } catch (err) {
        console.error('Error toggling plan', err);
      }
    });
  };

  const confirmDeleteTenant = (tenant: any) => {
    setTenantToDelete({ id: tenant.id, name: tenant.name });
    setIsDeleteModalOpen(true);
  };

  const deleteTenant = async () => {
    if (!tenantToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setTenants(tenants.filter(t => t.id !== tenantToDelete.id));
        setIsDeleteModalOpen(false);
      } else {
        const data = await res.json();
        showAlert('Error', data.message || 'Error al eliminar el comercio', 'error');
      }
    } catch (err) {
      console.error('Error deleting tenant', err);
      showAlert('Error', 'Error de red al intentar eliminar el comercio', 'error');
    } finally {
      setIsDeleting(false);
      setTenantToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessData(data.credentials);
        fetchTenants(); // Reload the table
      } else {
        setErrorMsg(data.message || 'Error al crear el comercio');
      }
    } catch (error) {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSuccessData(null);
    setFormData({ companyName: '', adminName: '', adminEmail: '' });
    setErrorMsg('');
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Cargando comercios...</div>;

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Gestión de Comercios</h1>
          <p>Directorio de inquilinos y control de acceso maestro.</p>
        </div>
        <button 
          style={{ padding: '0.75rem 1.5rem', background: '#111827', color: '#FFFFFF', border: '2px solid #111827', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} /> NUEVO COMERCIO
        </button>
      </header>

      <div className="sa-content">
        <div className="sa-panel" style={{ padding: 0 }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <div className="search-container" style={{ width: '300px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              style={{ border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%' }}
            />
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Nombre del Comercio</th>
              <th style={{ padding: '1rem' }}>Plantilla / Addons</th>
              <th style={{ padding: '1rem' }}>Plan</th>
              <th style={{ padding: '1rem' }}>Usuarios</th>
              <th style={{ padding: '1rem' }}>Ventas Registradas</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Fecha Creación</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <Store size={16} />
                  </div>
                  {t.name}
                </td>
                <td style={{ padding: '1rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', width: 'fit-content' }}>
                      {t.receiptTemplate}
                    </span>
                    <button 
                      onClick={() => toggleTallerAddon(t.id, t.hasTallerAddon)}
                      title="Activar/Desactivar Addon Taller"
                      style={{
                        background: t.hasTallerAddon ? '#eff6ff' : '#f8fafc',
                        color: t.hasTallerAddon ? '#3b82f6' : '#94a3b8',
                        border: t.hasTallerAddon ? '1px solid #bfdbfe' : '1px dashed #cbd5e1',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: 'fit-content',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.hasTallerAddon ? '#3b82f6' : '#cbd5e1' }}></div>
                      Comerza Taller
                    </button>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => togglePlan(t.id, t.plan || 'PRO')}
                    title="Clic para cambiar plan"
                    style={{
                      background: t.plan === 'PREMIUM' ? '#fdf4ff' : '#f8fafc',
                      color: t.plan === 'PREMIUM' ? '#c026d3' : '#475569',
                      border: t.plan === 'PREMIUM' ? '1px solid #f5d0fe' : '1px solid #e2e8f0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t.plan || 'PRO'}
                  </button>
                </td>
                <td style={{ padding: '1rem', color: '#64748b' }}>{t._count.users}</td>
                <td style={{ padding: '1rem', color: '#64748b' }}>{t._count.sales}</td>
                <td style={{ padding: '1rem' }}>
                  {t.isActive ? (
                    <span style={{ padding: '0.25rem 0.5rem', background: '#d1fae5', color: '#10b981', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Activo</span>
                  ) : (
                    <span style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#ef4444', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Suspendido</span>
                  )}
                </td>
                <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {t.isActive ? (
                    <button 
                      onClick={() => toggleStatus(t.id, t.isActive)}
                      title="Suspender Comercio"
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, marginRight: '0.5rem' }}>
                      Suspender
                    </button>
                  ) : (
                    <button 
                      onClick={() => toggleStatus(t.id, t.isActive)}
                      title="Reactivar Comercio"
                      style={{ background: '#d1fae5', color: '#10b981', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, marginRight: '0.5rem' }}>
                      Activar
                    </button>
                  )}
                  <button 
                    onClick={() => impersonate(t.id)}
                    title="Modo Dios (Entrar)"
                    style={{ background: '#eff6ff', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDeleteTenant(t)}
                    title="Eliminar Comercio"
                    style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No hay comercios registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal Crear Comercio */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                {successData ? 'Comercio Creado' : 'Nuevo Comercio'}
              </h3>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            {successData ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', background: '#d1fae5', color: '#10b981', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                  <CheckCircle size={32} />
                </div>
                <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#0f172a' }}>¡Registro Exitoso!</h4>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  El nuevo cliente ya puede iniciar sesión en la plataforma. Copia estas credenciales y envíaselas de forma segura.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}><strong>Correo:</strong> {successData.email}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                      <strong>Contraseña:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#0f172a' }}>{successData.password}</span>
                    </p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`Correo: ${successData.email}\nContraseña: ${successData.password}`)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 500 }}
                    >
                      <Copy size={14} /> Copiar
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={closeModal}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Nombre de la Empresa</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Ej. Pastelería San Martín" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre del Dueño / Administrador</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.adminName}
                    onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                    placeholder="Ej. Juan Pérez" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Correo Electrónico (Acceso)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                    placeholder="admin@empresa.com" 
                    required 
                  />
                </div>

                {errorMsg && (
                  <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Comercio'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 color="#ef4444" /> Eliminar Comercio
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              ¿Estás completamente seguro que deseas eliminar el comercio <strong>{tenantToDelete?.name}</strong>? 
              <br/><br/>
              <span style={{ color: '#b91c1c', fontWeight: 500 }}>⚠️ Esta acción es irreversible</span> y eliminará en cascada todos sus usuarios, productos y ventas asociados.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={deleteTenant}
                disabled={isDeleting}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer' }}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
