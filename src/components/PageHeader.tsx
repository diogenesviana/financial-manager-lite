'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: ReactNode
  description?: string
  backHref?: string
  children?: ReactNode
}

export default function PageHeader({
  title,
  description,
  backHref,
  children
}: PageHeaderProps) {
  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '2rem', 
        flexWrap: 'wrap', 
        gap: '1.5rem',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', minWidth: 0, flex: '1' }}>
        {backHref && (
          <Link 
            href={backHref} 
            className="btn btn-outline" 
            style={{ 
              padding: '0.5rem', 
              borderRadius: '50%', 
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '0.15rem'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <div className="flex-col" style={{ minWidth: 0, flex: '1' }}>
          <h2 
            style={{ 
              fontSize: '1.75rem', 
              fontWeight: 800, 
              color: 'var(--foreground)', 
              margin: 0, 
              letterSpacing: '-0.02em', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </h2>
          {description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  )
}
