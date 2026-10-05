'use client';
import { useState } from 'react';
import { BellRing, Send, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';

export default function SuperadminNotificationsPage() {
  const { showAlert } = useDialog();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      showAlert('Error', 'El título y el mensaje son requeridos.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/superadmin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, message, type }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al enviar la notificación');
      }

      const data = await res.json();
      showAlert(
        'Notificación Enviada',
        `La notificación se ha enviado a ${data.count} comercios activos exitosamente. Desaparecerá en 12 horas.`,
        'success'
      );
      setTitle('');
      setMessage('');
      setType('INFO');
    } catch (error: any) {
      console.error(error);
      showAlert('Error', error.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Enviar Notificación Global</h1>
          <p>Crea una notificación que aparecerá en la campana de todos los comercios activos. Desaparece en 12h.</p>
        </div>
      </header>
      
      <div className="sa-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="sa-panel">
        <form onSubmit={handleSendNotification}>
          <div className="form-group">
            <label className="form-label">Título de la Notificación</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Actualización de Sistema, Mantenimiento Programado..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Mensaje Detallado</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Escribe el mensaje que leerán los usuarios..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Tipo de Notificación</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
              
              <div 
                onClick={() => setType('INFO')}
                style={{
                  border: `2px solid ${type === 'INFO' ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: type === 'INFO' ? '#eff6ff' : 'white'
                }}
              >
                <Info size={24} color={type === 'INFO' ? '#3b82f6' : '#94a3b8'} />
                <span style={{ fontWeight: 500, color: type === 'INFO' ? '#1d4ed8' : '#64748b' }}>Informativa</span>
              </div>

              <div 
                onClick={() => setType('WARNING')}
                style={{
                  border: `2px solid ${type === 'WARNING' ? '#eab308' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: type === 'WARNING' ? '#fefce8' : 'white'
                }}
              >
                <AlertTriangle size={24} color={type === 'WARNING' ? '#eab308' : '#94a3b8'} />
                <span style={{ fontWeight: 500, color: type === 'WARNING' ? '#a16207' : '#64748b' }}>Advertencia</span>
              </div>

              <div 
                onClick={() => setType('SUCCESS')}
                style={{
                  border: `2px solid ${type === 'SUCCESS' ? '#22c55e' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: type === 'SUCCESS' ? '#f0fdf4' : 'white'
                }}
              >
                <CheckCircle2 size={24} color={type === 'SUCCESS' ? '#22c55e' : '#94a3b8'} />
                <span style={{ fontWeight: 500, color: type === 'SUCCESS' ? '#15803d' : '#64748b' }}>Éxito</span>
              </div>

            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSending || !title || !message}
              style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
            >
              {isSending ? 'Enviando...' : (
                <>
                  <Send size={18} />
                  Enviar a Todos
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
