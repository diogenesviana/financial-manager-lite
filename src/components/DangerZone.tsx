'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface DangerZoneProps {
  title?: string
  description?: string
  children: React.ReactNode
}

export default function DangerZone({
  title = "Zona de Perigo",
  description = "Ações irreversíveis de limpeza de banco de dados. Use com extrema cautela.",
  children
}: DangerZoneProps) {
  return (
    <div 
      className="card card-glass" 
      style={{ 
        padding: '2rem', 
        border: '1px solid rgba(225, 29, 72, 0.25)', 
        backgroundColor: 'rgba(225, 29, 72, 0.01)',
        width: '100%',
        flex: '1 1 100%'
      }}
    >
      <h3 
        style={{ 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          marginBottom: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'var(--danger)' 
        }}
      >
        <AlertTriangle size={18} />
        {title}
      </h3>
      <p 
        style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)', 
          marginBottom: '1.5rem', 
          lineHeight: 1.4 
        }}
      >
        {description}
      </p>
      
      <div className="flex-col gap-3" style={{ width: '100%' }}>
        {children}
      </div>
    </div>
  )
}
