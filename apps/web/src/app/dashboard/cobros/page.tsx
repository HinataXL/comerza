'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Link as LinkIcon, Check, CheckCircle, MessageCircle, Clock, Copy, AlertCircle } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';
import { formatIntegrationError } from '@/lib/formatters';
import './cobros.css';

interface Sale {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentLink?: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
  };
}

function CobrosContent() {
  const router = useRouter();
  const { showAlert, showConfirm, closeDialog } = useDialog();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  
  // Quick Charge State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCharge, setGeneratedCharge] = useState<{ link: string; amount: number; description: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Pending Sales State
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [allowedFeatures, setAllowedFeatures] = useState<string[]>([]);

  const fetchPendingSales = async () => {
    try {
      const [salesRes, meRes] = await Promise.all([
        fetch('/api/sales', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);

      if (salesRes.status === 401) {
        router.push('/login');
        return;
      }
      if (salesRes.ok) {
        const data: Sale[] = await salesRes.json();
        setPendingSales(data.filter(s => s.status === 'PENDING'));
      }
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.tenant?.features) {
          setAllowedFeatures(data.tenant.features);
        }
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSales();
  }, [router]);

  const handleQuickCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedCharge(null);

    try {
      const res = await fetch('/api/sales/quick-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          customerName
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error generating link');
      }

      const newSale = await res.json();
      if (newSale.paymentLink) {
        setGeneratedCharge({ link: newSale.paymentLink, amount: parseFloat(amount), description });
        setAmount('');
        setDescription('');
        setCustomerName('');
        fetchPendingSales(); // Refresh pending list
      }
    } catch (error: any) {
      const friendlyMessage = formatIntegrationError(error.message);
      
      let messageContent: React.ReactNode = friendlyMessage;
      if (typeof friendlyMessage === 'string' && friendlyMessage.toLowerCase().includes('qpaypro')) {
        messageContent = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <span>{friendlyMessage}</span>
            <button 
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', width: '100%' }}
              onClick={() => {
                closeDialog();
                router.push('/dashboard/integraciones');
              }}
            >
              Ir a Integraciones
            </button>
          </div>
        );
      }

      showAlert('Error', messageContent, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPaid = (id: string) => {
    showConfirm('Confirmar Pago', '¿Estás seguro de marcar este cobro como PAGADO?', async () => {
      setIsUpdating(id);
      try {
        const res = await fetch(`/api/sales/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'COMPLETED' })
        });

        if (res.ok) {
          setPendingSales(prev => prev.filter(s => s.id !== id));
        } else {
          showAlert('Error', 'Error al actualizar el estado', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsUpdating(null);
      }
    });
  };

  const copyToClipboard = () => {
    if (generatedCharge) {
      navigator.clipboard.writeText(generatedCharge.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openWhatsApp = (link: string, amount: number, concept?: string) => {
    const text = `¡Hola! Te comparto el enlace de pago por el monto de Q${amount.toFixed(2)}${concept ? ` correspondiente a ${concept}` : ''}. Puedes realizar tu pago seguro aquí: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) {
    return <div className="flex-center" style={{ height: '50vh' }}><p className="text-secondary">Cargando módulo de cobros...</p></div>;
  }

  return (
    <div className="cobros-container fade-in">
      <div className="cobros-header">
        <h1 className="cobros-title">Cuentas por Cobrar</h1>
        <p className="text-secondary text-sm">Genera links rápidos y gestiona cobros pendientes</p>
      </div>

      {paymentStatus === 'success' && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} />
          <strong>¡Cobro exitoso!</strong> El pago ha sido procesado por QPayPro y actualizado automáticamente.
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <strong>El pago falló o fue cancelado.</strong>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div style={{ padding: '1rem', backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <strong>Hubo un problema de conexión</strong> al intentar verificar el estado del pago. Revisa manualmente.
        </div>
      )}

      <div className="cobros-grid">
        {/* Left Column: Quick Charge */}
        {allowedFeatures.includes('Integraciones') && (
        <div>
          <div className="quick-charge-card">
            <h2 className="card-title"><Zap className="text-primary" /> Cobro Rápido</h2>
            
            <form onSubmit={handleQuickCharge}>
              <div className="form-group">
                <label className="form-label">Monto (Q)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="form-input" 
                  placeholder="Ej. 150.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Concepto / Descripción</label>
                <input 
                  type="text" 
                  required
                  className="form-input" 
                  placeholder="Ej. Anticipo de servicio"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Cliente (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={isGenerating || !amount || !description}
              >
                {isGenerating ? 'Generando...' : <><LinkIcon size={18} /> Generar Link de Pago</>}
              </button>
            </form>

            {generatedCharge && (
              <div className="generated-link-box fade-in">
                <CheckCircle className="text-success" size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>¡Link Generado!</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', wordBreak: 'break-all' }}>
                  {generatedCharge.link}
                </p>
                
                <button className="whatsapp-button" onClick={() => openWhatsApp(generatedCharge.link, generatedCharge.amount, generatedCharge.description)}>
                  <MessageCircle size={18} /> Compartir por WhatsApp
                </button>
                
                <button className="copy-button" onClick={copyToClipboard}>
                  {copied ? <><Check size={18} /> ¡Copiado!</> : <><Copy size={18} /> Copiar Link</>}
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right Column: Pending Table */}
        <div style={!allowedFeatures.includes('Integraciones') ? { gridColumn: '1 / -1' } : {}}>
          <div className="pending-table-card">
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="card-title" style={{ marginBottom: 0 }}><Clock className="text-warning" /> Cobros Pendientes ({pendingSales.length})</h2>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Cliente / Concepto</th>
                    <th>Método</th>
                    <th className="text-right">Monto</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSales.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <CheckCircle size={48} style={{ color: 'var(--border-color)' }} />
                          <div>
                            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>¡Todo al día!</p>
                            <p style={{ fontSize: '0.875rem' }}>No tienes cobros pendientes en este momento.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingSales.map(sale => (
                      <tr key={sale.id} className="table-row">
                        <td className="font-medium text-xs">#{sale.id.slice(0, 8)}<br/><span className="text-secondary" style={{fontSize:'0.7rem'}}>{new Date(sale.createdAt).toLocaleDateString()}</span></td>
                        <td>
                          <div className="customer-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span className="customer-name font-medium">{sale.customer?.name || 'C/F'}</span>
                            {sale.paymentLink && (
                              <span className="text-secondary text-xs truncate" style={{maxWidth: '150px'}} title={sale.paymentLink}>
                                🔗 Link enviado
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="method-badge">{sale.paymentMethod || 'Desconocido'}</span>
                        </td>
                        <td className="text-right font-medium">Q{sale.total.toFixed(2)}</td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {sale.paymentLink && (
                              <button 
                                className="action-button outline"
                                onClick={() => copyToClipboard()}
                                title="Copiar Link"
                              >
                                <Copy size={14} />
                              </button>
                            )}
                            {sale.paymentMethod !== 'Link de pago' ? (
                              <button 
                                className="action-button success"
                                onClick={() => handleMarkAsPaid(sale.id)}
                                disabled={isUpdating === sale.id}
                                title="Marcar como pagado manualmente"
                              >
                                <Check size={14} />
                                {isUpdating === sale.id ? '...' : 'Marcar Pagado'}
                              </button>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#854d0e', backgroundColor: '#fef9c3', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontWeight: 500 }}>
                                <Clock size={12} /> Esperando pago
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CobrosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando cobros...</div>}>
      <CobrosContent />
    </Suspense>
  );
}
