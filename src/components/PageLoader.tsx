import React from 'react'
import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
  title?: string
  description?: string
  inline?: boolean
}

export default function PageLoader({ 
  title = 'Carregando...', 
  description = 'Buscando informações no servidor...', 
  inline = false 
}: PageLoaderProps) {
  const containerStyle: React.CSSProperties = inline
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem',
        textAlign: 'center',
        width: '100%',
        minHeight: '350px',
      }

  return (
    <div style={containerStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '3.75rem',
        height: '3.75rem',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-light)',
        color: 'var(--primary)',
        marginBottom: '1.25rem',
        boxShadow: 'var(--shadow-glow)'
      }}>
        <Loader2 size={32} className="animate-spin" />
      </div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.4rem 0' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, maxWidth: '280px' }}>
          {description}
        </p>
      )}
    </div>
  )
}
