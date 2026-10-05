'use client';

import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  id?: string;
  itemCode: string;
  labelSnapshot: string;
  status: 'OK' | 'DAMAGED' | 'MISSING' | 'NOT_APPLICABLE';
  notes?: string;
}

interface Props {
  workOrderId: string;
  token: string;
  initialItems: ChecklistItem[];
  canEdit: boolean;
  onUpdate: () => void;
}

const DEFAULT_TEMPLATE = [
  { itemCode: 'LUCES', labelSnapshot: 'Luces' },
  { itemCode: 'RETROVISORES', labelSnapshot: 'Retrovisores' },
  { itemCode: 'PARABRISAS', labelSnapshot: 'Parabrisas' },
  { itemCode: 'VIDRIOS', labelSnapshot: 'Vidrios' },
  { itemCode: 'LLANTAS', labelSnapshot: 'Llantas' },
  { itemCode: 'AROS', labelSnapshot: 'Aros' },
  { itemCode: 'RADIO', labelSnapshot: 'Radio' },
  { itemCode: 'ANTENA', labelSnapshot: 'Antena' },
  { itemCode: 'HERRAMIENTAS', labelSnapshot: 'Herramientas' },
  { itemCode: 'LLANTA_REPUESTO', labelSnapshot: 'Llanta de repuesto' },
  { itemCode: 'TRIANGULOS', labelSnapshot: 'Triángulos' },
  { itemCode: 'EXTINTOR', labelSnapshot: 'Extintor' },
  { itemCode: 'DOCUMENTOS', labelSnapshot: 'Documentos' },
  { itemCode: 'PLACAS', labelSnapshot: 'Placas' },
  { itemCode: 'TAPICERIA', labelSnapshot: 'Tapicería' },
  { itemCode: 'CARROCERIA', labelSnapshot: 'Carrocería' }
];

export default function WorkOrderChecklist({ workOrderId, token, initialItems, canEdit, onUpdate }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    } else {
      // populate from template if empty
      setItems(DEFAULT_TEMPLATE.map(t => ({
        ...t,
        status: 'OK'
      })));
    }
  }, [initialItems]);

  const handleStatusChange = (index: number, status: ChecklistItem['status']) => {
    const newItems = [...items];
    newItems[index].status = status;
    setItems(newItems);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newItems = [...items];
    newItems[index].notes = notes;
    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/taller/work-orders/${workOrderId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (!res.ok) throw new Error('Error al guardar checklist');
      alert('Checklist guardado');
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="checklist-container">
      <div style={{ display: 'grid', gap: '1rem' }}>
        {items.map((item, i) => (
          <div key={item.itemCode} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <strong style={{ minWidth: '150px' }}>{item.labelSnapshot}</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${item.status === 'OK' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => canEdit && handleStatusChange(i, 'OK')}
                  disabled={!canEdit}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                >
                  ✓ OK
                </button>
                <button 
                  className={`btn ${item.status === 'DAMAGED' ? 'btn-danger' : 'btn-outline'}`}
                  onClick={() => canEdit && handleStatusChange(i, 'DAMAGED')}
                  disabled={!canEdit}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                >
                  ⚠ Dañado
                </button>
                <button 
                  className={`btn ${item.status === 'MISSING' ? 'btn-danger' : 'btn-outline'}`}
                  onClick={() => canEdit && handleStatusChange(i, 'MISSING')}
                  disabled={!canEdit}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                >
                  — Falta
                </button>
                <button 
                  className={`btn ${item.status === 'NOT_APPLICABLE' ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => canEdit && handleStatusChange(i, 'NOT_APPLICABLE')}
                  disabled={!canEdit}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                >
                  N/A
                </button>
              </div>
            </div>
            
            {(item.status === 'DAMAGED' || item.status === 'MISSING') && (
              <div style={{ marginTop: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Observaciones..." 
                  value={item.notes || ''}
                  onChange={(e) => handleNotesChange(i, e.target.value)}
                  disabled={!canEdit}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {canEdit && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Checklist'}
          </button>
        </div>
      )}
    </div>
  );
}
