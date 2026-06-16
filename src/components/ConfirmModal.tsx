'use client'

import Modal from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmação Necessária", 
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'danger'
}: ConfirmModalProps) {
  
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            style={{ flex: 1 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
