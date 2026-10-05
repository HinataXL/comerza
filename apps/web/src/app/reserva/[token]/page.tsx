'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import './reserva.css';

interface ReservationData {
  id: string;
  status: string;
  title: string | null;
  notes: string | null;
  startTime: string;
  endTime: string;
  tenantName: string;
  customerName: string;
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';
type ViewMode = 'detail' | 'reschedule' | 'done';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:            { label: 'Pendiente',            color: '#d97706', bg: '#fef3c7' },
  CONFIRMED:          { label: 'Confirmada',           color: '#059669', bg: '#dcfce7' },
  CANCELLED:          { label: 'Cancelada',            color: '#dc2626', bg: '#fee2e2' },
  COMPLETED:          { label: 'Completada',           color: '#6366f1', bg: '#ede9fe' },
  PENDING_RESCHEDULE: { label: 'Reprogramación Pendiente', color: '#7c3aed', bg: '#ede9fe' },
};

export default function ReservaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = params?.token as string;
  const initialAction = searchParams?.get('action') ?? null;

  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [actionMessage, setActionMessage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/reservation/${token}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const data = await res.json();
        setReservation(data);
        setLoading(false);

        // If came from email button, auto-trigger action
        if (initialAction === 'confirm') handleAction('confirm', data);
        if (initialAction === 'reject') handleAction('reject', data);
        if (initialAction === 'reschedule') setViewMode('reschedule');
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [token]);

  const handleAction = async (action: string, res?: ReservationData, extraBody?: object) => {
    const r = res ?? reservation;
    if (!r || !token) return;
    setActionState('loading');
    try {
      const response = await fetch(`/api/public/reservation/${token}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraBody }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al procesar');
      setActionMessage(data.message);
      setActionState('success');
      setViewMode('done');
      // Refresh reservation
      const refreshed = await fetch(`/api/public/reservation/${token}`);
      if (refreshed.ok) setReservation(await refreshed.json());
    } catch (err: any) {
      setActionState('error');
      setActionMessage(err.message);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = rescheduleDate && rescheduleTime ? `${rescheduleDate} ${rescheduleTime}` : rescheduleDate;
    await handleAction('reschedule', undefined, {
      requestedDate: dateStr,
      note: rescheduleNote,
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="reserva-wrapper">
        <div className="reserva-card loading-card">
          <div className="spinner" />
          <p>Cargando tu reservación…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="reserva-wrapper">
        <div className="reserva-card error-card">
          <div className="icon-circle error-icon">🔍</div>
          <h1>Reservación no encontrada</h1>
          <p>El enlace no es válido o ya expiró. Contacta al negocio para más información.</p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[reservation?.status ?? 'PENDING'] ?? STATUS_LABELS['PENDING'];

  return (
    <div className="reserva-wrapper">
      <div className="reserva-card">
        {/* Header */}
        <div className="reserva-header">
          <div className="reserva-icon">📅</div>
          <h1>Tu Reservación</h1>
          <p className="reserva-tenant">{reservation?.tenantName}</p>
        </div>

        <div className="reserva-body">
          {/* Status badge */}
          <div className="reserva-status-row">
            <span className="reserva-badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          </div>

          {/* Detail card */}
          <div className="reserva-detail-card">
            <div className="reserva-detail-row">
              <span className="reserva-detail-label">Cliente</span>
              <span className="reserva-detail-value">{reservation?.customerName}</span>
            </div>
            {reservation?.title && (
              <div className="reserva-detail-row">
                <span className="reserva-detail-label">Motivo</span>
                <span className="reserva-detail-value">{reservation.title}</span>
              </div>
            )}
            <div className="reserva-detail-row">
              <span className="reserva-detail-label">Fecha y hora</span>
              <span className="reserva-detail-value highlight">
                {reservation?.startTime ? formatDate(reservation.startTime) : '-'}
              </span>
            </div>
            {reservation?.notes && !reservation.notes.includes('[Reprogramar]') && (
              <div className="reserva-detail-row">
                <span className="reserva-detail-label">Notas</span>
                <span className="reserva-detail-value">{reservation.notes}</span>
              </div>
            )}
          </div>

          {/* Done state */}
          {viewMode === 'done' && (
            <div className={`reserva-feedback ${actionState}`}>
              <div className="feedback-icon">
                {actionState === 'success' ? '✅' : '❌'}
              </div>
              <p>{actionMessage}</p>
            </div>
          )}

          {/* Reschedule form */}
          {viewMode === 'reschedule' && reservation?.status !== 'CANCELLED' && reservation?.status !== 'CONFIRMED' && (
            <form className="reschedule-form" onSubmit={handleRescheduleSubmit}>
              <h3>Solicitar nuevo horario</h3>
              <p className="reschedule-subtitle">
                Indica tu preferencia de fecha y hora. El negocio revisará la disponibilidad y te confirmará.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha preferida</label>
                  <input
                    type="date"
                    className="form-input"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input
                    type="time"
                    className="form-input"
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nota adicional (opcional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ej. Prefiero en la tarde, o cualquier horario disponible…"
                  value={rescheduleNote}
                  onChange={e => setRescheduleNote(e.target.value)}
                />
              </div>
              <div className="reschedule-actions">
                <button type="button" className="btn-outline" onClick={() => setViewMode('detail')}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={actionState === 'loading'}>
                  {actionState === 'loading' ? 'Enviando…' : '📤 Enviar solicitud'}
                </button>
              </div>
            </form>
          )}

          {/* Action buttons */}
          {viewMode === 'detail' && (reservation?.status === 'PENDING' || reservation?.status === 'CONFIRMED') && (
            <div className="reserva-actions">
              <p className="actions-title">¿Qué deseas hacer?</p>

              {reservation?.status === 'PENDING' && (
                <button
                  className="action-btn confirm"
                  onClick={() => handleAction('confirm')}
                  disabled={actionState === 'loading'}
                >
                  ✅ Confirmar mi cita
                </button>
              )}

              <button
                className="action-btn reschedule"
                onClick={() => setViewMode('reschedule')}
                disabled={actionState === 'loading'}
              >
                📆 Solicitar nuevo horario
              </button>

              {reservation?.status !== 'CANCELLED' && (
                <button
                  className="action-btn reject"
                  onClick={() => handleAction('reject')}
                  disabled={actionState === 'loading'}
                >
                  ❌ No podré asistir
                </button>
              )}
            </div>
          )}

          {actionState === 'error' && viewMode !== 'done' && (
            <div className="reserva-feedback error">
              <p>⚠️ {actionMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="reserva-footer">
          <p>Gestionado con <strong>Comerza</strong> · <a href="https://comerza.me" target="_blank" rel="noopener noreferrer">comerza.me</a></p>
        </div>
      </div>
    </div>
  );
}
