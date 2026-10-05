'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Wrench, Clock } from 'lucide-react';
import { WorkOrderStatus } from '@/types/taller';

const stepsOrder: WorkOrderStatus[] = [
  'RECEIVED',
  'DIAGNOSIS',
  'WAITING_APPROVAL',
  'APPROVED',
  'IN_REPAIR',
  'QUALITY_CONTROL',
  'READY',
  'DELIVERED'
];

export default function SeguimientoClient({ initialData }: { initialData: any }) {
  const [data] = useState(initialData);

  const renderTimeline = () => {
    // Collect steps that should be shown in tracking
    const trackingSteps: { status: WorkOrderStatus; label: string; passed: boolean; current: boolean; timestamp: any }[] = [];
    
    let reachedCurrent = false;
    
    // We only show steps up to the current status, and maybe next ones grayed out.
    // The history has exact timestamps for passed states.
    for (const step of stepsOrder) {
      if (step === 'CANCELLED') continue;
      
      const historyEvent = data.timeline.find((t: any) => t.status === step);
      
      const isCurrent = data.currentStatus === step;
      const hasPassed = !!historyEvent || (!reachedCurrent && !isCurrent);
      
      if (isCurrent) reachedCurrent = true;
      
      // Basic translation mapping for steps not in history yet
      let label = historyEvent?.label;
      if (!label) {
        switch (step) {
          case 'RECEIVED': label = 'Vehículo recibido'; break;
          case 'DIAGNOSIS': label = 'En diagnóstico'; break;
          case 'WAITING_APPROVAL': label = 'Esperando autorización'; break;
          case 'APPROVED': label = 'Trabajo autorizado'; break;
          case 'IN_REPAIR': label = 'En reparación'; break;
          case 'QUALITY_CONTROL': label = 'Control de calidad'; break;
          case 'READY': label = 'Listo para entregar'; break;
          case 'DELIVERED': label = 'Entregado'; break;
        }
      }

      trackingSteps.push({
        status: step,
        label,
        passed: hasPassed,
        current: isCurrent,
        timestamp: historyEvent?.timestamp
      });
      
      if (isCurrent && step === 'DELIVERED') break;
    }

    if (data.currentStatus === 'CANCELLED') {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--error)' }}>Esta orden ha sido cancelada</h2>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', backgroundColor: 'var(--border)', zIndex: 0 }}></div>
        
        {trackingSteps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1, opacity: step.passed || step.current ? 1 : 0.4 }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', backgroundColor: step.current ? 'var(--primary)' : 'var(--background)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: step.current ? 'none' : step.passed ? '2px solid var(--primary)' : '2px solid var(--border)'
            }}>
              {step.current ? <Wrench size={16} color="white" /> : step.passed ? <CheckCircle2 size={32} color="var(--primary)" style={{ marginLeft: '-2px', marginTop: '-2px' }} /> : <Circle size={12} color="var(--text-muted)" />}
            </div>
            <div style={{ paddingTop: '4px' }}>
              <p style={{ fontWeight: step.current ? 700 : 500, color: step.current ? 'var(--primary)' : 'var(--text)' }}>
                {step.label}
              </p>
              {step.timestamp && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Clock size={12} />
                  {new Date(step.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', marginBottom: '1rem' }}>
          <Wrench size={32} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>{data.businessName}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Seguimiento de Reparación</p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehículo</p>
            <p style={{ fontWeight: 500 }}>{data.vehicleBrand} {data.vehicleModel}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placa</p>
            <p style={{ fontWeight: 500 }}>{data.plate}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orden</p>
            <p style={{ fontWeight: 500 }}>{data.workOrderNumber}</p>
          </div>
          {data.approvedTotal && (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Autorizado</p>
              <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Q {data.approvedTotal.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Estado actual</h2>
        {renderTimeline()}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Última actualización: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
