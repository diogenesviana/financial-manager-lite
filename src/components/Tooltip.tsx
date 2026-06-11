'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Tooltip({ content, children, style }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 8, x: '-50%' }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              marginBottom: '10px',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--card, #1e293b)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--foreground, #f8fafc)',
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: '1.4',
              width: '240px',
              zIndex: 999999,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              pointerEvents: 'none',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {content}
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--border, rgba(255, 255, 255, 0.1))',
              pointerEvents: 'none',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
