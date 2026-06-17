'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import Tooltip from '@/components/Tooltip'

interface ThemeToggleProps {
  variant?: 'circle' | 'pill'
  style?: React.CSSProperties
  className?: string
  iconSize?: number
}

export default function ThemeToggle({ variant = 'circle', style, className = '', iconSize = 18 }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Detect theme on mount
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light'
    setTheme(currentTheme)

    // Setup mutation observer to react to theme changes made on other components
    const observer = new MutationObserver(() => {
      const updatedTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light'
      setTheme(updatedTheme)
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', nextTheme)
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="btn btn-outline"
        style={{
          fontSize: '0.8rem',
          padding: '0.45rem 1rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
      >
        {theme === 'light' ? (
          <>
            <Moon size={14} />
            Ativar Modo Escuro
          </>
        ) : (
          <>
            <Sun size={14} />
            Ativar Modo Claro
          </>
        )}
      </button>
    )
  }

  // Circle variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-outline ${className}`}
      style={{
        padding: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        flexShrink: 0,
        backgroundColor: 'transparent',
        ...style
      }}
    >
      {theme === 'light' ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
    </button>
  )
}
