'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: string
  children: React.ReactNode
  style?: React.CSSProperties
  align?: 'center' | 'left' | 'right'
  position?: 'top' | 'bottom'
}

export default function Tooltip({ 
  content, 
  children, 
  style, 
  align = 'center',
  position = 'top'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const isRight = align === 'right'
  const isLeft = align === 'left'
  const isBottom = position === 'bottom'

  const yVal = isBottom ? -8 : 8

  const motionProps = isRight
    ? { initial: { opacity: 0, y: yVal }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: yVal } }
    : isLeft
    ? { initial: { opacity: 0, y: yVal }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: yVal } }
    : { initial: { opacity: 0, y: yVal, x: '-50%' }, animate: { opacity: 1, y: 0, x: '-50%' }, exit: { opacity: 0, y: yVal, x: '-50%' } }

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
              bottom: isBottom ? 'auto' : '100%',
              top: isBottom ? '100%' : 'auto',
              left: isRight ? 'auto' : isLeft ? '0px' : '50%',
              right: isRight ? '0px' : 'auto',
              marginBottom: isBottom ? '0px' : '10px',
              marginTop: isBottom ? '10px' : '0px',
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
              top: isBottom ? 'auto' : '100%',
              bottom: isBottom ? '100%' : 'auto',
              left: isRight ? 'auto' : isLeft ? '12px' : '50%',
              right: isRight ? '12px' : 'auto',
              transform: (isRight || isLeft) ? 'none' : 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: isBottom ? 'none' : '6px solid var(--border, rgba(255, 255, 255, 0.1))',
              borderBottom: isBottom ? '6px solid var(--border, rgba(255, 255, 255, 0.1))' : 'none',
              pointerEvents: 'none',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
