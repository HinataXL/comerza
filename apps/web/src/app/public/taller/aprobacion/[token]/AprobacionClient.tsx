'use client';
import { useState } from 'react';
import { CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';
import { approveOrderAction, rejectOrderAction } from '../../actions';
import { useRouter } from 'next/navigation';

export default function AprobacionClient({ initialData, token }: { initialData: any, token: string }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [rejectReason, setRejectReason] = useState('Precio');
  const [rejectComment, setRejectComment] = useState('');
  
  // Modals for confirmation
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  if (data.status !== 'WAITING_APPROVAL') {
    return (
      <div className="card fade-in" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        {data.status === 'APPROVED' ? (
          <>
            <CheckCircle2 size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Cotización autorizada</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gracias. El taller ha recibido tu autorización y está trabajando en tu vehículo.</p>
          </>
        ) : (
          <>
            <ShieldAlert size={48} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Cotización procesada</h1>
            <p style={{ color: 'var(--text-muted)' }}>Esta cotización ya fue procesada o su estado no permite autorización.</p>
          </>
        )}
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await approveOrderAction(token);
      if (res.success) {
        setData({ ...data, status: 'APPROVED' });
        setShowApproveConfirm(false);
      } else {
        setError(res.error || 'Error al aprobar la cotización');
      }
    } catch (err: any) {
      setError(err.message || 'Error al aprobar la cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rejectOrderAction(token, rejectReason, rejectComment);
      if (res.success) {
        setData({ ...data, status: 'DIAGNOSIS' });
      } else {
        setError(res.error || 'Error al rechazar la cotización');
      }
    } catch (err: any) {
      setError(err.message || 'Error al rechazar la cotización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', marginBottom: '1rem' }}>
          <Wrench size={32} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>{data.businessName}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Cotización de Reparación</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ backgroundColor: 'var(--error-light)', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Vehículo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehículo</p>
            <p style={{ fontWeight: 500 }}>{data.vehicleBrand} {data.vehicleModel} {data.vehicleYear}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placa</p>
            <p style={{ fontWeight: 500 }}>{data.plate}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orden</p>
            <p style={{ fontWeight: 500 }}>{data.workOrderNumber}</p>
          </div>
        </div>
      </div>

      {data.diagnosisSummary && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Diagnóstico</h2>
          <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{data.diagnosisSummary}</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Trabajos Propuestos</h2>
        
        {data.items && data.items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.items.map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.description}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.quantity} × Q {item.unitPrice.toFixed(2)}
                    {item.discount > 0 && ` (Desc: Q ${item.discount.toFixed(2)})`}
                  </p>
                </div>
                <p style={{ fontWeight: 600 }}>Q {item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay ítems detallados en esta cotización.</p>
        )}

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <span>Subtotal</span>
            <span>Q {data.subtotal.toFixed(2)}</span>
          </div>
          {data.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--error)' }}>
              <span>Descuento</span>
              <span>- Q {data.discount.toFixed(2)}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <span>Impuestos</span>
              <span>Q {data.tax.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>
            <span>Total a Aprobar</span>
            <span>Q {data.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {!showRejectOptions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600, justifyContent: 'center' }}
            onClick={() => setShowApproveConfirm(true)}
            disabled={loading}
          >
            APROBAR COTIZACIÓN
          </button>
          <button 
            className="btn btn-text" 
            style={{ width: '100%', color: 'var(--error)', justifyContent: 'center' }}
            onClick={() => setShowRejectOptions(true)}
            disabled={loading}
          >
            Rechazar
          </button>
        </div>
      )}

      {showRejectOptions && (
        <div className="card fade-in" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px solid var(--error-light)' }}>
          <h3 style={{ color: 'var(--error)', marginBottom: '1rem', fontWeight: 600 }}>Motivo del rechazo</h3>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">¿Deseas indicarnos el motivo?</label>
            <select className="form-control" value={rejectReason} onChange={e => setRejectReason(e.target.value)} disabled={loading}>
              <option value="Precio">Precio</option>
              <option value="Deseo cotizar otra opción">Deseo cotizar otra opción</option>
              <option value="No autorizo por ahora">No autorizo por ahora</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Comentario opcional</label>
            <textarea 
              className="form-control" 
              rows={3} 
              placeholder="Escribe más detalles..." 
              value={rejectComment} 
              onChange={e => setRejectComment(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowRejectOptions(false)} disabled={loading}>
              Cancelar
            </button>
            <button className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--error)', borderColor: 'var(--error)', justifyContent: 'center' }} onClick={handleReject} disabled={loading}>
              Confirmar Rechazo
            </button>
          </div>
        </div>
      )}

      {/* Modal Aprobación */}
      {showApproveConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confirmar Autorización</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                ¿Confirmas que autorizas los trabajos indicados por un total de <strong>Q {data.total.toFixed(2)}</strong>?
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 600 }}
                onClick={handleApprove}
                disabled={loading}
              >
                Sí, Autorizar Trabajos
              </button>
              <button 
                className="btn btn-outline" 
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                onClick={() => setShowApproveConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
