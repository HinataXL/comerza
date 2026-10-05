import React from 'react';
import { WorkOrderStatus } from '@/types/taller';

export const statusMap: Record<WorkOrderStatus, { label: string; color: string }> = {
  RECEIVED: { label: 'Recibido', color: 'var(--blue)' },
  DIAGNOSIS: { label: 'Diagnóstico', color: 'var(--purple)' },
  WAITING_APPROVAL: { label: 'Pendiente aprobación', color: 'var(--warning)' },
  APPROVED: { label: 'Aprobado', color: 'var(--cyan)' },
  IN_REPAIR: { label: 'En reparación', color: 'var(--orange)' },
  QUALITY_CONTROL: { label: 'Control de calidad', color: 'var(--indigo)' },
  READY: { label: 'Listo', color: 'var(--success)' },
  DELIVERED: { label: 'Entregado', color: 'var(--text-muted)' },
  CANCELLED: { label: 'Cancelado', color: 'var(--error)' },
};

export default function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const config = statusMap[status] || { label: status, color: 'var(--text-muted)' };
  return (
    <span 
      className="badge" 
      style={{ 
        backgroundColor: `${config.color}20`, 
        color: config.color,
        border: `1px solid ${config.color}40`,
        padding: '0.25rem 0.5rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {config.label}
    </span>
  );
}
