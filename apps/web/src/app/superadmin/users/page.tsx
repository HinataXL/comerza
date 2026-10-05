'use client';
import { useEffect, useState } from 'react';
import { Users, Shield, User, Plus, X, Trash2 } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantName: string;
  tenantPlan: string;
  createdAt: string;
}

export default function SuperAdminUsersPage() {
  const { showAlert } = useDialog();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/superadmin/users', { credentials: 'include' });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSuperadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/superadmin/users/superadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail }),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear superadmin');
      }

      setSuccessMsg('Superadmin creado. Se le ha enviado un correo con sus credenciales.');
      setNewAdminName('');
      setNewAdminEmail('');
      await fetchUsers(); // Recargar lista
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
      }, 3000);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = (user: any) => {
    setUserToDelete({ id: user.id, name: user.name });
    setIsDeleteModalOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setIsDeleteModalOpen(false);
      } else {
        const data = await res.json();
        showAlert('Error', data.message || 'Error al eliminar el usuario', 'error');
      }
    } catch (err) {
      console.error('Error deleting user', err);
      showAlert('Error', 'Error de red al intentar eliminar el usuario', 'error');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return { bg: '#fef9c3', text: '#854d0e' };
      case 'ADMIN': return { bg: '#dbeafe', text: '#1e40af' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Cargando usuarios de la plataforma...</div>;
  }

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Usuarios Registrados</h1>
          <p>Directorio completo de administradores de comercios y superadmins.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '0.75rem 1.5rem', background: '#111827', color: '#FFFFFF', border: '2px solid #111827', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> NUEVO SUPERADMIN
        </button>
      </header>

      <div className="sa-content">
        <div className="sa-panel" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '2px solid #111827' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o comercio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '0.75rem 1rem', border: '2px solid #111827', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Rol</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Comercio (Tenant)</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Plan</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Fecha Registro</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No se encontraron usuarios.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>{user.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: getRoleBadgeColor(user.role).bg,
                        color: getRoleBadgeColor(user.role).text
                      }}>
                        {user.role === 'SUPERADMIN' ? <Shield size={12} /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                      {user.tenantName}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                      {user.tenantPlan}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => confirmDeleteUser(user)}
                        title="Eliminar Usuario"
                        style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem 0.5rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Modal Crear Superadmin */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>Nuevo Superadmin</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Tendrá acceso total a la configuración global de Comerza.</p>
            
            <form onSubmit={handleCreateSuperadmin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.25rem' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="ejemplo@comerza.me"
                  required
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {successMsg}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                style={{ 
                  width: '100%', 
                  backgroundColor: isSubmitting ? '#94a3b8' : '#3b82f6', 
                  color: 'white', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  border: 'none',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Creando...' : 'Crear Cuenta y Enviar Correo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 color="#ef4444" /> Eliminar Usuario
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.name}</strong>? 
              <br/><br/>
              <span style={{ color: '#b91c1c', fontWeight: 500 }}>⚠️ Esta acción es irreversible.</span> Si el usuario tiene registros asociados (como ventas), el sistema podría impedir la eliminación.
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
                onClick={deleteUser}
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
