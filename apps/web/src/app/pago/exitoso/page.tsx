'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, FileText, Download, ArrowRight, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const saleId = searchParams.get('saleId');
  
  const [saleData, setSaleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!saleId) {
      setLoading(false);
      return;
    }

    const fetchSale = async () => {
      try {
        const res = await fetch(`/api/sales/${saleId}`);
        if (res.ok) {
          const data = await res.json();
          setSaleData(data);
        } else {
          setError('No pudimos cargar los detalles de la venta.');
        }
      } catch (err) {
        setError('Error al cargar la venta.');
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [saleId]);

  const handleDownloadReceipt = () => {
    if (!saleData) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text('COMERZA', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Recibo de Compra', 105, 30, { align: 'center' });

    // Sale Info
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Referencia: ${saleId?.substring(0, 8).toUpperCase()}`, 15, 45);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 52);
    doc.text(`Método: ${saleData.paymentMethod || 'QPayPro'}`, 15, 59);

    if (saleData.customer) {
      doc.text(`Cliente: ${saleData.customer.name}`, 15, 66);
    }

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.line(15, 75, 195, 75);

    // Table Header
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Artículo', 15, 85);
    doc.text('Cant.', 120, 85);
    doc.text('Precio', 150, 85);
    doc.text('Total', 180, 85);

    doc.line(15, 90, 195, 90);

    // Table Items
    let y = 100;
    doc.setTextColor(17, 24, 39);
    if (saleData.items && saleData.items.length > 0) {
      saleData.items.forEach((item: any) => {
        const name = item.product?.name || 'Producto genérico';
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const lineTotal = qty * price;

        doc.text(name.substring(0, 40), 15, y);
        doc.text(qty.toString(), 120, y);
        doc.text(`Q${price.toFixed(2)}`, 150, y);
        doc.text(`Q${lineTotal.toFixed(2)}`, 180, y);
        y += 10;
      });
    }

    doc.line(15, y, 195, y);

    // Total
    y += 10;
    doc.setFontSize(12);
    doc.text('Total pagado:', 140, y);
    doc.setFontSize(14);
    doc.text(`Q${(saleData.total || 0).toFixed(2)}`, 180, y);

    // Footer
    y += 20;
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('Gracias por su compra.', 105, y, { align: 'center' });

    doc.save(`recibo_${saleId?.substring(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      backgroundColor: '#eef0f6',
      backgroundImage: 'radial-gradient(circle, #c7cde6 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      padding: '2rem',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      position: 'relative'
    }}>
      {/* Resplandor verde de fondo */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 65%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        background: '#ffffff',
        borderTop: '3px solid #10b981',
        borderRadius: '20px',
        padding: '3.5rem 3rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 40px -8px rgba(17, 24, 39, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        textAlign: 'center',
        animation: 'card-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1) both'
      }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          background: '#ecfdf5', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 0 8px rgba(236, 253, 245, 0.5)'
        }}>
          <CheckCircle2 size={36} color="#10b981" strokeWidth={2.5} />
        </div>
        
        <h1 style={{ 
          fontFamily: '"Outfit", sans-serif',
          fontSize: '2rem', 
          fontWeight: 800, 
          color: '#111827', 
          margin: '0 0 0.75rem 0',
          letterSpacing: '-0.03em'
        }}>
          ¡Pago Exitoso!
        </h1>
        
        <p style={{ 
          color: '#6b7280', 
          fontSize: '0.95rem', 
          lineHeight: '1.5',
          margin: '0 0 2rem 0',
          fontWeight: 400
        }}>
          Tu transacción ha sido procesada y aprobada. Descarga tu comprobante de pago a continuación.
        </p>

        {saleId && (
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem'
          }}>
            <FileText size={18} color="#9ca3af" />
            <span style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 500 }}>
              Referencia: <strong style={{ color: '#111827', fontFamily: '"Outfit", sans-serif' }}>
                {saleId.substring(0, 8).toUpperCase()}
              </strong>
            </span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
            <Loader2 size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '2rem' }}>
            {error}
          </div>
        ) : (
          <button 
            onClick={handleDownloadReceipt}
            style={{
              width: '100%',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '0.875rem 1.5rem',
              borderRadius: '10px',
              fontSize: '1rem',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              marginBottom: '1rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.35)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
            }}
          >
            <Download size={18} />
            Descargar Recibo
          </button>
        )}

        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'color 0.15s ease',
            fontFamily: '"Outfit", sans-serif'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
          onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
        >
          Volver al panel <ArrowRight size={16} />
        </button>
      </div>

      <style>{`
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit' }}>Cargando...</div>}>
      <PagoExitosoContent />
    </Suspense>
  );
}
