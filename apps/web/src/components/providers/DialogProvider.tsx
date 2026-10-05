'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type DialogType = 'info' | 'success' | 'warning' | 'error';

interface DialogOptions {
  title: string;
  message: string | ReactNode;
  type?: DialogType;
  onConfirm?: () => void;
  isConfirm?: boolean;
}

interface DialogContextProps {
  showAlert: (title: string, message: string | ReactNode, type?: DialogType) => void;
  showConfirm: (title: string, message: string | ReactNode, onConfirm: () => void, type?: DialogType) => void;
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

  const showConfirm = (title: string, message: string | ReactNode, onConfirm: () => void, type: DialogType = 'warning') => {
    setDialogState({ title, message, type, isConfirm: true, onConfirm });
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setTimeout(() => {
      setDialogState({ title: '', message: '', type: 'info', isConfirm: false });
    }, 200); // Wait for transition
  };

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
          <div className="modal-content" style={{ maxWidth: '400px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div>{getIcon()}</div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {dialogState.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {dialogState.message}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                {dialogState.isConfirm ? (
                  <>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeDialog}>
                      Cancelar
                    </button>
                    <button 
                      className={`btn ${dialogState.type === 'error' ? 'btn-error' : 'btn-primary'}`}
                      style={{ flex: 1 }} 
                      onClick={handleConfirm}
                    >
                      Aceptar
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
