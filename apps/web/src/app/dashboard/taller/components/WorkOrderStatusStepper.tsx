import { WorkOrderStatus } from '@/types/taller';
import { statusMap } from './WorkOrderStatusBadge';
import { Check, Circle, Car } from 'lucide-react';

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

export default function WorkOrderStatusStepper({ currentStatus }: { currentStatus: WorkOrderStatus }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div style={{ padding: '1rem', backgroundColor: 'var(--error-light)', color: 'var(--error)', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
        Orden Cancelada
      </div>
    );
  }

  const currentIndex = stepsOrder.indexOf(currentStatus);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      {/* Carretera de fondo */}
      <div style={{ position: 'absolute', top: '18px', left: '10px', right: '10px', height: '8px', backgroundColor: '#cbd5e1', borderRadius: '4px', zIndex: 0, overflow: 'hidden' }}>
        {/* Línea punteada de la carretera */}
        <div style={{ position: 'absolute', top: '3px', left: '0', right: '0', height: '2px', backgroundImage: 'linear-gradient(to right, #ffffff 50%, transparent 50%)', backgroundSize: '16px 100%', zIndex: 1 }} />
      </div>
      
      {/* Progreso de la carretera */}
      {currentIndex > 0 && (
        <div style={{ position: 'absolute', top: '18px', left: '10px', width: `calc(${(currentIndex / (stepsOrder.length - 1)) * 100}% - 20px)`, height: '8px', backgroundColor: 'var(--primary)', borderRadius: '4px', zIndex: 1, transition: 'width 0.5s ease-in-out' }}>
          {/* Línea punteada sobre el progreso */}
          <div style={{ position: 'absolute', top: '3px', left: '0', right: '0', height: '2px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.5) 50%, transparent 50%)', backgroundSize: '16px 100%', zIndex: 1 }} />
        </div>
      )}

      {stepsOrder.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const config = statusMap[step];

        return (
          <div key={step} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px', gap: '0.5rem' }}>
            <div 
              style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isCurrent ? 'var(--background)' : isCompleted ? 'var(--primary)' : '#f8fafc',
                border: isCurrent ? '2px solid var(--primary)' : isCompleted ? '2px solid var(--primary)' : '2px solid #cbd5e1',
                color: isCompleted ? 'white' : isCurrent ? 'var(--primary)' : '#94a3b8',
                transition: 'all 0.5s ease-in-out',
                boxShadow: isCurrent ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {isCurrent ? (
                <Car size={22} fill="var(--primary)" color="var(--primary)" />
              ) : isCompleted ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <Circle size={8} fill="#cbd5e1" strokeWidth={0} />
              )}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 600 : 500, color: (isCompleted || isCurrent) ? 'var(--text)' : 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
