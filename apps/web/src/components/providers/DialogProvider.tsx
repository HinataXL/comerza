'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type DialogType = 'info' | 'success' | 'warning' | 'error';

interface DialogOptions {
  title: string;
  message: string | ReactNode;
  type?: DialogType;
  onConfirm?: () => void;
  isConfirm?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogContextProps {
  showAlert: (title: string, message: string | ReactNode, type?: DialogType) => void;
  showConfirm: (title: string, message: string | ReactNode, onConfirm: () => void, type?: DialogType, labels?: { confirmLabel?: string; cancelLabel?: string }) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [dialogState, setDialogState] = useState<DialogOptions>({
    title: '',
    message: '',
    type: 'info',
    isConfirm: false,
  });

  const showAlert = (title: string, message: string | ReactNode, type: DialogType = 'info') => {
    setDialogState({ title, message, type, isConfirm: false });
    setIsOpen(true);
  };

  const showConfirm = (title: string, message: string | ReactNode, onConfirm: () => void, type: DialogType = 'warning', labels?: { confirmLabel?: string; cancelLabel?: string }) => {
    setDialogState({ title, message, type, isConfirm: true, onConfirm, ...labels });
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setIsOpen(false); }
      if (event.key !== 'Tab') return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [isOpen]);

  const handleConfirm = () => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    closeDialog();
  };

  const getIcon = () => {
    switch (dialogState.type) {
      case 'success':
        return <CheckCircle size={28} className="text-success" />;
      case 'error':
        return <AlertCircle size={28} className="text-error" />;
      case 'warning':
        return <AlertTriangle size={28} className="text-warning" />;
      case 'info':
      default:
        return <Info size={28} className="text-primary" />;
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, closeDialog }}>
      {children}
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="comerza-dialog-title" aria-describedby="comerza-dialog-message" className="modal-content" style={{ maxWidth: '400px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div>{getIcon()}</div>
              <div>
                <h3 id="comerza-dialog-title" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {dialogState.title}
                </h3>
                <div id="comerza-dialog-message" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {dialogState.message}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                {dialogState.isConfirm ? (
                  <>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeDialog}>
                      {dialogState.cancelLabel || 'Cancelar'}
                    </button>
                    <button 
                      className={`btn ${dialogState.type === 'error' ? 'btn-error' : 'btn-primary'}`}
                      style={{ flex: 1 }} 
                      onClick={handleConfirm}
                    >
                      {dialogState.confirmLabel || 'Aceptar'}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={closeDialog}>
                    Aceptar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
