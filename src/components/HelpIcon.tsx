'use client'

import React from 'react'
import { HelpCircle } from 'lucide-react'
import Tooltip from './Tooltip'

interface HelpIconProps {
  content: string
  onClick?: (e: React.MouseEvent) => void
  size?: number
  variant?: 'default' | 'button'
  position?: 'top' | 'bottom'
}

export default function HelpIcon({ 
  content, 
  onClick, 
  size = 13,
  variant = 'default',
  position = 'top'
}: HelpIconProps) {
  
  if (variant === 'button') {
    return (
      <Tooltip content={content} position={position}>
        <button
          onClick={onClick}
          style={{ 
            background: 'rgba(255, 26, 119, 0.1)', 
            border: 'none', 
            color: 'var(--primary)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseOver={(e) => { 
            e.currentTarget.style.background = 'rgba(255, 26, 119, 0.2)'; 
            e.currentTarget.style.transform = 'scale(1.05)'; 
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.background = 'rgba(255, 26, 119, 0.1)'; 
            e.currentTarget.style.transform = 'scale(1)'; 
          }}
        >
          <HelpCircle size={size} strokeWidth={2.5} />
        </button>
      </Tooltip>
    )
  }

  return (
    <Tooltip content={content} position={position}>
      <div 
        onClick={onClick}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: onClick ? 'pointer' : 'help', 
          color: 'var(--text-muted)', 
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        <HelpCircle size={size} />
      </div>
    </Tooltip>
  )
}
