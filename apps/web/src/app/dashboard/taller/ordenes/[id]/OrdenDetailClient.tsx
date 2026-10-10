'use client';
import { useState, useEffect } from 'react';
import { WorkOrder, WorkOrderStatus } from '@/types/taller';
import Link from 'next/link';
import { ArrowLeft, Car, User, Calendar, MapPin, Gauge, MoreVertical, Search, MessageCircle, Share, CheckCircle2 } from 'lucide-react';
import WorkOrderStatusBadge from '../../components/WorkOrderStatusBadge';
import { createWhatsAppLink } from '@/lib/utils/phone';
import WorkOrderStatusStepper from '../../components/WorkOrderStatusStepper';
import WorkOrderChecklist from '../../components/WorkOrderChecklist';
import WorkOrderPhotoGallery from '../../components/WorkOrderPhotoGallery';
import WorkOrderQuote from '../../components/WorkOrderQuote';
import { useRouter } from 'next/navigation';

export default function OrdenDetailClient({ initialOrder, token }: { initialOrder: WorkOrder, token: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrder>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteDirty, setQuoteDirty] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState('');
  
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<WorkOrderStatus | null>(null);
  const [showQCModal, setShowQCModal] = useState(false);
  const [qcNotes, setQcNotes] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [exitMileage, setExitMileage] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);

  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'RECEPCION' | 'DIAGNOSTICO' | 'COTIZACION' | 'EVIDENCIA' | 'ACTIVIDAD'>('RESUMEN');

  // FASE 5 states
  const [checklist, setChecklist] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  const fetchExtraData = async () => {
    try {
      const checklistRes = await fetch(`/api/taller/work-orders/${order.id}/checklist`);
      const photosRes = await fetch(`/api/taller/work-orders/${order.id}/photos`);
      if (checklistRes.ok) setChecklist(await checklistRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
    } catch (err) {
      console.error('Error fetching extra data', err);
    }
  };

  useEffect(() => {
    fetchExtraData();
  }, [order.id]);

  const availableTransitions = (): WorkOrderStatus[] => {
    switch (order.status) {
      case 'RECEIVED': return ['DIAGNOSIS', 'WAITING_APPROVAL', 'IN_REPAIR'];
      case 'DIAGNOSIS': return ['WAITING_APPROVAL', 'IN_REPAIR'];
      case 'WAITING_APPROVAL': return ['APPROVED', 'IN_REPAIR'];
      case 'APPROVED': return ['IN_REPAIR'];
      case 'IN_REPAIR': return ['QUALITY_CONTROL', 'READY'];
      case 'QUALITY_CONTROL': return ['READY', 'IN_REPAIR'];
      case 'READY': return ['DELIVERED'];
      default: return [];
    }
  };

  const transitions = availableTransitions();

  const handleStatusClick = (status: WorkOrderStatus) => {
    if (quoteDirty || loading) {
      setError('Guarda la cotización antes de cambiar el estado.');
      return;
    }
    if (order.status === 'QUALITY_CONTROL' && status === 'READY') {
      setShowQCModal(true);
      return;
    }
    if (order.status === 'READY' && status === 'DELIVERED') {
      setShowDeliveryModal(true);
      return;
    }
    setTargetStatus(status);
    setShowConfirmModal(true);
    setShowActionMenu(false);
  };

  const executeStatusChange = async () => {
    if (!targetStatus) return;
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/taller/work-orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: targetStatus })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al actualizar el estado');
      }
      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    handleStatusClick('CANCELLED');
  };

  const handleSendWhatsApp = () => {
    let text = `Hola ${order.customer?.name},\nTe escribimos del Taller por tu vehículo ${order.vehicle?.brand} ${order.vehicle?.plate}.`;
    
    if (order.status === 'READY') {
      text = `Hola ${order.customer?.name},\n¡Buenas noticias! Tu ${order.vehicle?.brand} ${order.vehicle?.plate} ya está listo y puede ser retirado del taller.`;
    }
    
    const waLink = createWhatsAppLink(order.customer?.phone || '', text);
    window.open(waLink, '_blank');
    setShowActionMenu(false);
  };

  const handleSendQuote = async () => {
    if (loading || quoteDirty) {
      setError('Guarda los cambios de la cotización antes de enviarla.');
      setActiveTab('COTIZACION');
      return;
    }
    if (!order.items?.length || !['RECEIVED', 'DIAGNOSIS', 'WAITING_APPROVAL'].includes(order.status)) {
      setError('Agrega y guarda los conceptos de una cotización pendiente de autorización antes de enviarla.');
      setActiveTab('COTIZACION');
      return;
    }
    const whatsappWindow = window.open('', '_blank');
    if (!whatsappWindow) { setError('Permite las ventanas emergentes para abrir WhatsApp.'); return; }
    whatsappWindow.opener = null;
    setLoading(true);
    setError(null);
    try {
      if (order.status !== 'WAITING_APPROVAL') {
        const statusRes = await fetch(`/api/taller/work-orders/${order.id}/status`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newStatus: 'WAITING_APPROVAL' }),
        });
        if (!statusRes.ok) throw new Error('No se pudo poner la orden en espera de autorización.');
        setOrder(await statusRes.json());
        router.refresh();
      }
      const res = await fetch(`/api/taller/work-orders/${order.id}/approval-link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al generar enlace de cotización');
      if (typeof data.url !== 'string' || !data.url) throw new Error('No se recibió el enlace de autorización.');
      const link = `${window.location.origin}/public/taller/aprobacion/${data.url}`;
      const text = `Hola ${order.customer?.name},\nTe enviamos la cotización de los trabajos para tu ${order.vehicle?.brand} ${order.vehicle?.model}.\nRevísala y autorízala ingresando a este enlace seguro:\n${link}`;
      whatsappWindow.location.replace(createWhatsAppLink(order.customer?.phone || '', text));
    } catch (err: unknown) {
      whatsappWindow.close();
      setError(err instanceof Error ? err.message : 'No se pudo enviar la cotización.');
    } finally {
      setLoading(false);
      setShowActionMenu(false);
    }
  };

  const handleSendTracking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/taller/work-orders/${order.id}/tracking-link`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al generar enlace de seguimiento');
      const data = await res.json();
      const link = `${window.location.origin}/public/taller/seguimiento/${data.url}`;
      const text = `Hola ${order.customer?.name},\nPuedes seguir el estado de reparación de tu ${order.vehicle?.brand} en tiempo real ingresando aquí:\n${link}`;
      window.open(createWhatsAppLink(order.customer?.phone || '', text), '_blank');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      setShowActionMenu(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Semi-Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/dashboard/taller/ordenes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', transition: 'all var(--transition-fast)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{order.workOrderNumber}</h1>
              <WorkOrderStatusBadge status={order.status} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              {order.vehicle?.brand} {order.vehicle?.model} <span style={{ margin: '0 0.5rem', color: 'var(--border-strong)' }}>|</span> {order.vehicle?.plate} <span style={{ margin: '0 0.5rem', color: 'var(--border-strong)' }}>|</span> {order.customer?.name}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <button className="btn btn-outline" onClick={handleSendWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <MessageCircle size={16} /> WhatsApp
          </button>
          
          <button className="btn btn-primary" onClick={() => setShowActionMenu(!showActionMenu)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Cambiar estado <MoreVertical size={16} />
          </button>
          
          {showActionMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', width: '220px', boxShadow: 'var(--shadow-lg)', zIndex: 40, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mover a</div>
              {transitions.map(status => (
                <button key={status} onClick={() => handleStatusClick(status)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }} className="menu-item-hover">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status === 'READY' ? 'var(--success)' : 'var(--accent)' }} />
                  {status}
                </button>
              ))}
              
              {transitions.length === 0 && (
                <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin transiciones disponibles</div>
              )}
              
              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />
              <button onClick={handleSendQuote} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <Share size={14} /> Enviar cotización
              </button>
              <button onClick={handleSendTracking} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <Search size={14} /> Enviar seguimiento
              </button>
              
              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <>
                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />
                  <button onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, borderRadius: '4px', cursor: 'pointer', color: 'var(--danger)' }}>
                    Cancelar Orden
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '2rem', flex: 1 }}>
        {quoteSuccess && !quoteDirty && <p role="status" style={{ padding: '1rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{quoteSuccess}</p>}
        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <style>{`
          .menu-item-hover:hover { background-color: var(--bg-base); }
          .layout-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 2rem; }
          @media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }
          .tab-btn { background: none; border: none; padding: 0.75rem 1rem; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
          .tab-btn:hover { color: var(--text-primary); }
          .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
        `}</style>

        <div className="layout-grid">
          {/* Main Content Area (70%) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
            
            {/* Horizontal Compact Stepper */}
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
               <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Estado de Reparación</h3>
               <WorkOrderStatusStepper currentStatus={order.status} />
            </div>

            {/* Tabs Component */}
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)', padding: '0 0.5rem' }} className="hide-scrollbar">
                {['RESUMEN', 'RECEPCION', 'DIAGNOSTICO', 'COTIZACION', 'EVIDENCIA', 'ACTIVIDAD'].map(tab => (
                  <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as any)}>
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div style={{ padding: '1.5rem' }}>
                {activeTab === 'RESUMEN' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo de Ingreso</h4>
                      <div style={{ backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        {order.customerComplaint || <span style={{ color: 'var(--text-muted)' }}>No se ha registrado el motivo.</span>}
                      </div>
                    </div>

                    {order.initialInspection && (
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inspección Inicial</h4>
                        <div style={{ backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {order.initialInspection}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Tiempo en taller</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{Math.max(1, Math.ceil((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 3600 * 24)))} días</div>
                      </div>
                      <div style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Combustible reportado</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{order.fuelLevel || 'No registrado'}</div>
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'RECEPCION' && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Checklist Vehicular</h3>
                    <WorkOrderChecklist workOrderId={order.id} token={token} initialItems={checklist} canEdit={order.status === 'RECEIVED'} onUpdate={fetchExtraData} />
                  </div>
                )}

                {activeTab === 'DIAGNOSTICO' && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Diagnóstico Técnico</h3>
                    <div style={{ backgroundColor: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {order.diagnosis || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>El equipo técnico aún no ha documentado el diagnóstico...</span>}
                      </div>
                    </div>
                  </div>
                )}

                <div hidden={activeTab !== 'COTIZACION'}>
                  <WorkOrderQuote key={order.updatedAt} order={order} busy={loading} onDirtyChange={setQuoteDirty}
                    onSaved={updated => { setOrder(updated); setError(null); setQuoteSuccess('Cotización guardada. Ya puedes enviarla al cliente.'); router.refresh(); }} />
                </div>

                {activeTab === 'EVIDENCIA' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Recepción</h4>
                      <WorkOrderPhotoGallery workOrderId={order.id} token={token} photos={photos} category="RECEPTION" canUpload={order.status === 'RECEIVED'} onUpdate={fetchExtraData} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Diagnóstico</h4>
                      <WorkOrderPhotoGallery workOrderId={order.id} token={token} photos={photos} category="DIAGNOSIS" canUpload={order.status === 'DIAGNOSIS'} onUpdate={fetchExtraData} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Reparación</h4>
                      <WorkOrderPhotoGallery workOrderId={order.id} token={token} photos={photos} category="REPAIR" canUpload={order.status === 'IN_REPAIR'} onUpdate={fetchExtraData} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Control de Calidad</h4>
                      <WorkOrderPhotoGallery workOrderId={order.id} token={token} photos={photos} category="QUALITY_CONTROL" canUpload={order.status === 'QUALITY_CONTROL'} onUpdate={fetchExtraData} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Entrega</h4>
                      <WorkOrderPhotoGallery workOrderId={order.id} token={token} photos={photos} category="DELIVERY" canUpload={order.status === 'READY'} onUpdate={fetchExtraData} />
                    </div>
                  </div>
                )}

                {activeTab === 'ACTIVIDAD' && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Historial de Actividad</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      El registro detallado de eventos será implementado en breve.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Area (30%) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '280px' }}>
            
            {/* Total Card */}
            <div style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Cotizado</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 600, verticalAlign: 'top', marginRight: '0.25rem' }}>Q</span>
                {order.total.toFixed(2)}
              </div>
              {order.approvalMethod && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', backgroundColor: 'var(--success-bg)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  <CheckCircle2 size={12} /> {order.approvalMethod === 'IN_PERSON' ? 'Aprobado en Taller' : 'Aprobado Online'}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={14} /> Cliente
              </h3>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{order.customer?.name}</div>
              {order.customer?.phone && (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{order.customer.phone}</div>
              )}
            </div>

            {/* Vehicle Info */}
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={14} /> Vehículo
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Placa</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.vehicle?.plate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Marca / Modelo</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.vehicle?.brand} {order.vehicle?.model}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Año</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.vehicle?.year || '--'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kilometraje</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.entryMileage ? `${order.entryMileage.toLocaleString()} km` : '--'}</span>
                </div>
                {order.vehicle?.vin && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>VIN</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: 'monospace' }}>{order.vehicle.vin}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Responsible */}
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '1.25rem', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Fecha de Ingreso</h3>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(order.createdAt).toLocaleDateString()} a las {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                {order.assignedUser && (
                  <div>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Técnico Responsable</h3>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                        {order.assignedUser.name.charAt(0)}
                      </div>
                      {order.assignedUser.name}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}
      
      {/* Confirm Status Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cambiar estado</h3>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              ¿Mover la orden a <strong style={{ color: 'var(--text-primary)' }}>{targetStatus}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary" onClick={executeStatusChange} disabled={loading}>Sí, mover</button>
            </div>
          </div>
        </div>
      )}

      {/* QC Modal */}
      {showQCModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Control de Calidad</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Notas de inspección final</label>
              <textarea className="form-input" placeholder="Detalla si el vehículo pasó correctamente las pruebas..." value={qcNotes} onChange={e => setQcNotes(e.target.value)} rows={4} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowQCModal(false)} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary" onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch(`/api/taller/work-orders/${order.id}/quality-control`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qualityControlNotes: qcNotes }) });
                  if (!res.ok) throw new Error('Error al guardar QC');
                  const resStatus = await fetch(`/api/taller/work-orders/${order.id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newStatus: 'READY' }) });
                  if (!resStatus.ok) throw new Error('Error al cambiar a READY');
                  setOrder(await resStatus.json());
                  setShowQCModal(false);
                  router.refresh();
                } catch (err: any) { alert(err.message); } finally { setLoading(false); }
              }} disabled={loading}>Aprobar y Listo</button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Entregar Vehículo</h3>
            </div>
            <div style={{ backgroundColor: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Estás a punto de entregar el <strong>{order.vehicle?.plate}</strong>. Asegúrate de registrar el kilometraje final si aplica.
            </div>
            <div className="form-group">
              <label className="form-label">Kilometraje de salida</label>
              <input type="number" className="form-input" placeholder={order.entryMileage ? `Entró con ${order.entryMileage}` : 'Ej: 95500'} value={exitMileage} onChange={e => setExitMileage(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones</label>
              <textarea className="form-input" placeholder="Condiciones en las que se entrega..." value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} rows={3} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowDeliveryModal(false)} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary" onClick={async () => {
                setLoading(true);
                try {
                  const parsedMileage = exitMileage ? parseInt(exitMileage) : null;
                  const res = await fetch(`/api/taller/work-orders/${order.id}/deliver`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exitMileage: parsedMileage, deliveryNotes }) });
                  if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Error'); }
                  setOrder(await res.json());
                  setShowDeliveryModal(false);
                  router.refresh();
                } catch (err: any) { alert(err.message); } finally { setLoading(false); }
              }} disabled={loading}>Confirmar Entrega</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
