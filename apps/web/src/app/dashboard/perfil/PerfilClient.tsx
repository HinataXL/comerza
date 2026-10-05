'use client';

import React, { useState } from 'react';
import './perfil.css';

interface PerfilClientProps {
  initialProfile: any;
  token: string;
}

export default function PerfilClient({ initialProfile, token }: PerfilClientProps) {
  const [user, setUser] = useState(initialProfile?.user || {});
  const [tenant] = useState(initialProfile?.tenant || {});
  
  const [name, setName] = useState(user.name || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    try {
      const data: any = { name };
      if (password) {
        data.password = password;
      }
      
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        let errorMessage = 'Error al actualizar el perfil';
        try {
          const errData = await res.json();
          if (errData.message) errorMessage = errData.message;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      setUser({ ...user, name });
      setPassword(''); // Clear password field after save
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al actualizar el perfil' });
    } finally {
      setIsSaving(false);
      
      // Auto-hide message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>Mi Perfil</h1>
        <p>Administra tu información personal y credenciales de acceso.</p>
      </div>

      <div className="perfil-layout">
        {/* User Info Form */}
        <div className="perfil-card">
          <h2>Información Personal</h2>
          
          <form onSubmit={handleSave}>
            <div className="perfil-form-group">
              <label className="perfil-label">Correo Electrónico (No editable)</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="perfil-input"
              />
            </div>

            <div className="perfil-form-group">
              <label className="perfil-label">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="perfil-input"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div className="perfil-form-group">
              <label className="perfil-label">Nueva Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="perfil-input"
                placeholder="Dejar en blanco para mantener la actual"
              />
            </div>

            {message && (
              <div className={`perfil-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="perfil-actions">
              <button
                type="submit"
                disabled={isSaving}
                className="perfil-button"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Tenant Info Sidebar */}
        <div className="perfil-card">
          <h2>Información de la Empresa</h2>
          
          <div className="tenant-info-list">
            <div className="tenant-info-item">
              <span className="tenant-info-label">Nombre de la Empresa</span>
              <span className="tenant-info-value">{tenant.name || 'N/A'}</span>
            </div>
            
            <div className="tenant-info-item">
              <span className="tenant-info-label">Plan Actual</span>
              <div>
                <span className="tenant-badge">{tenant.plan || 'Gratis'}</span>
              </div>
            </div>

            <div className="tenant-info-item">
              <span className="tenant-info-label">Rol de Usuario</span>
              <span className="tenant-info-value capitalize">{user.role || 'Usuario'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
