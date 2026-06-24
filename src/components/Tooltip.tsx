'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: string
  children: React.ReactNode
  style?: React.CSSProperties
  align?: 'center' | 'left' | 'right'
}

export default function Tooltip({ content, children, style, align = 'center' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const isRight = align === 'right'
  const isLeft = align === 'left'

  const motionProps = isRight
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } }
    : isLeft
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } }
    : { initial: { opacity: 0, y: 8, x: '-50%' }, animate: { opacity: 1, y: 0, x: '-50%' }, exit: { opacity: 0, y: 8, x: '-50%' } }

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
            {...motionProps}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: isRight ? 'auto' : isLeft ? '0px' : '50%',
              right: isRight ? '0px' : 'auto',
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
              width: 'max-content',
              maxWidth: '200px',
              zIndex: 500,
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
              left: isRight ? 'auto' : isLeft ? '12px' : '50%',
              right: isRight ? '12px' : 'auto',
              transform: (isRight || isLeft) ? 'none' : 'translateX(-50%)',
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
