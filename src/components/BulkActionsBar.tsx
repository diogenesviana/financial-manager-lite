'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BulkActionsBarProps {
  selectedCount: number
  title?: string
  subtitle?: string
  isVisible: boolean
  children: ReactNode
}

export default function BulkActionsBar({
  selectedCount,
  title,
  subtitle,
  isVisible,
  children
}: BulkActionsBarProps) {
  const defaultTitle = selectedCount > 0
    ? `${selectedCount} despesa${selectedCount > 1 ? 's' : ''} selecionada${selectedCount > 1 ? 's' : ''}`
    : ''

  return (
    <AnimatePresence>
      {isVisible && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="floating-actions-bar"
        >
          <div className="flex-col" style={{ alignItems: 'flex-start', minWidth: 0, flexShrink: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>
              {title || defaultTitle}
            </span>
            {subtitle && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</span>
            )}
          </div>
          
          <div className="actions-group flex-row gap-2" style={{ alignItems: 'center' }}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
