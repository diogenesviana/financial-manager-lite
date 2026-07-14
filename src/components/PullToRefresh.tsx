'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [status, setStatus] = useState<'idle' | 'pulling' | 'loading'>('idle')
  const startY = useRef(0)
  const currentY = useRef(0)
  const isAtTop = useRef(true)

  const pullThreshold = 70 // px required to trigger refresh
  const maxPull = 120 // max translation limit

  useEffect(() => {
    const handleScroll = () => {
      isAtTop.current = window.scrollY === 0
    }

    // Scroll listener to check if we are at the top of the viewport
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isAtTop.current || status === 'loading') return
    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    setStatus('pulling')
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (status !== 'pulling') return
    const y = e.touches[0].clientY
    currentY.current = y
    const diff = y - startY.current

    if (diff > 0) {
      // Elastic resistance factor (gets harder as you pull more)
      const resistance = 0.4
      const newDistance = Math.min(diff * resistance, maxPull)
      setPullDistance(newDistance)

      // Prevent native browser reload
      if (e.cancelable) {
        e.preventDefault()
      }
    } else {
      setPullDistance(0)
    }
  }

  const handleTouchEnd = async () => {
    if (status !== 'pulling') return

    if (pullDistance >= pullThreshold) {
      setStatus('loading')
      setPullDistance(pullThreshold) // hold spinner in place
      try {
        await onRefresh()
      } catch (err) {
        console.error('PullToRefresh error:', err)
      } finally {
        // Smooth snapback to 0
        setStatus('idle')
        setPullDistance(0)
      }
    } else {
      setStatus('idle')
      setPullDistance(0)
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        transform: `translateY(${pullDistance}px)`,
        transition: status === 'idle' ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        overscrollBehaviorY: 'contain' // Prevents mobile browser native pull-to-refresh
      }}
    >
      {/* Pull down indicator */}
      <div
        style={{
          position: 'absolute',
          top: `-${pullThreshold}px`,
          left: 0,
          right: 0,
          height: `${pullThreshold}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pullDistance > 10 ? Math.min((pullDistance - 10) / (pullThreshold - 10), 1) : 0,
          transform: `scale(${Math.min(pullDistance / pullThreshold, 1.1)})`,
          transition: status === 'idle' ? 'opacity 0.2s, transform 0.2s' : 'none',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--card, #1e293b)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            color: 'var(--primary, #ff1a77)'
          }}
        >
          <RefreshCw 
            size={16} 
            className={status === 'loading' ? 'animate-spin' : ''} 
            style={{
              transform: status !== 'loading' ? `rotate(${pullDistance * 3}deg)` : 'none',
              transition: status === 'loading' ? 'none' : 'transform 0.1s ease-out',
              color: 'var(--primary)'
            }}
          />
        </div>
      </div>
      {children}
    </div>
  )
}
