'use client'

import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import Modal from '@/components/Modal'

export interface DangerZoneItemProps {
  title: string
  description: string
  impactLevel?: 'MODERADO' | 'ALTO' | 'CRÍTICO'
  buttonText: string
  buttonIcon?: React.ReactNode
  variant?: 'danger-outline' | 'danger-solid'
  onClick: () => void
}

export function DangerZoneItem({
  title,
  description,
  impactLevel = 'ALTO',
  buttonText,
  buttonIcon,
  variant = 'danger-outline',
  onClick
}: DangerZoneItemProps) {
  const getBadgeStyle = () => {
    switch (impactLevel) {
      case 'MODERADO':
        return { backgroundColor: 'rgba(234, 179, 8, 0.12)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' }
      case 'CRÍTICO':
        return { backgroundColor: 'rgba(225, 29, 72, 0.2)', color: 'var(--danger)', border: '1px solid rgba(225, 29, 72, 0.4)' }
      case 'ALTO':
      default:
        return { backgroundColor: 'rgba(225, 29, 72, 0.12)', color: 'var(--danger)', border: '1px solid rgba(225, 29, 72, 0.25)' }
    }
  }

  return (
    <div style={{
      padding: '1.1rem 1.25rem',
      borderRadius: '12px',
      backgroundColor: 'var(--background)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--foreground)' }}>{title}</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              ...getBadgeStyle()
            }}>
              {impactLevel}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {description}
          </p>
        </div>

        <button
          onClick={onClick}
          className={variant === 'danger-solid' ? 'btn btn-danger' : 'btn btn-outline'}
          style={{
            minHeight: '44px',
            padding: '0.6rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: variant === 'danger-solid' ? '#fff' : 'var(--danger)',
            borderColor: 'var(--danger)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            borderRadius: '10px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {buttonIcon}
          {buttonText}
        </button>
      </div>
    </div>
  )
}

interface DangerZoneProps {
  title?: string
  description?: string
  modalTitle?: string
  children: React.ReactNode
}

export default function DangerZone({
  title = "Zona de Perigo & Ações Sensíveis",
  description = "Ações irreversíveis de limpeza de dados. Acesse o painel dedicado para gerenciar.",
  modalTitle = "Gerenciamento da Zona de Perigo",
  children
}: DangerZoneProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Card Gatilho na Página */}
      <div 
        className="card card-glass" 
        style={{ 
          padding: '1.5rem', 
          border: '1px solid rgba(225, 29, 72, 0.25)', 
          backgroundColor: 'rgba(225, 29, 72, 0.02)',
          borderRadius: '16px',
          width: '100%',
          flex: '1 1 100%'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 240px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              color: 'var(--danger)',
              flexShrink: 0
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 
                style={{ 
                  fontSize: '1.05rem', 
                  fontWeight: 700, 
                  margin: 0,
                  color: 'var(--danger)'
                }}
              >
                {title}
              </h3>
              <p 
                style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  margin: '0.2rem 0 0 0', 
                  lineHeight: 1.4 
                }}
              >
                {description}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="btn btn-danger"
            style={{
              padding: '0.65rem 1.25rem',
              minHeight: '44px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <AlertTriangle size={16} /> Abrir Zona de Perigo
          </button>
        </div>
      </div>

      {/* Modal Dedicado da Zona de Perigo */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="600px"
        title={(
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <ShieldAlert size={20} />
            {modalTitle}
          </span>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(225, 29, 72, 0.06)',
            border: '1px solid rgba(225, 29, 72, 0.2)',
            borderRadius: '10px',
            fontSize: '0.825rem',
            color: 'var(--foreground)',
            lineHeight: 1.45
          }}>
            <strong style={{ color: 'var(--danger)' }}>Atenção:</strong> Todas as ações abaixo operam diretamente no banco de dados. Escolha a opção desejada e confirme a execução.
          </div>

          <div className="flex-col gap-3" style={{ width: '100%' }}>
            {children}
          </div>
        </div>
      </Modal>
    </>
  )
}
