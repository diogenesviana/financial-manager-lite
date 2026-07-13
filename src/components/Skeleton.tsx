'use client'

import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  circle?: boolean
  style?: React.CSSProperties
  className?: string
}

export default function Skeleton({
  width = '100%',
  height = '1rem',
  circle = false,
  style,
  className = ''
}: SkeletonProps) {
  const customStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style
  }

  return (
    <span 
      className={`skeleton-pulse ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={customStyle}
    />
  )
}
