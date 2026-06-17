import React, { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Padrão Arquitetural do Projeto:
   * Ações secundárias (especialmente botões contendo apenas ícones) DEVEM usar variant="outline" ou "ghost".
   * Cores sólidas (como "success" ou "primary") devem ser reservadas APENAS para a ação principal (Call to Action) da tela, 
   * a fim de preservar o visual sutil e dark do sistema. Ícones internos podem receber cores (ex: color="var(--success)") 
   * se houver necessidade de indicação visual.
   */
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'xs'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  
  // Base classes handled by globals.css (btn, btn-primary, etc.)
  // We'll map variants to existing CSS classes where possible
  const variantClass = variant === 'ghost' ? '' : `btn-${variant}`
  
  // Size specific styles
  const sizeStyles: React.CSSProperties = {}
  
  if (size === 'xs') {
    sizeStyles.padding = '0.15rem 0.4rem'
    sizeStyles.fontSize = '0.65rem'
    sizeStyles.height = 'auto'
    sizeStyles.gap = '0.2rem'
  } else if (size === 'sm') {
    sizeStyles.padding = '0.35rem 0.75rem'
    sizeStyles.fontSize = '0.75rem'
  } else if (size === 'lg') {
    sizeStyles.padding = '0.85rem 1.5rem'
    sizeStyles.fontSize = '1rem'
  } else if (size === 'icon') {
    sizeStyles.padding = '0.35rem'
    sizeStyles.display = 'flex'
    sizeStyles.alignItems = 'center'
    sizeStyles.justifyContent = 'center'
    // Optional fixed width/height for square icons
  }

  if (fullWidth) {
    sizeStyles.width = '100%'
  }

  // Ghost variant needs custom logic as it might not be in globals.css
  const ghostStyles: React.CSSProperties = variant === 'ghost' ? {
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    color: 'var(--text-muted)'
  } : {}

  const finalStyle = {
    ...sizeStyles,
    ...ghostStyles,
    ...style
  }

  const isDisabled = disabled || isLoading

  return (
    <button
      className={`btn ${variant !== 'ghost' ? variantClass : ''} ${className}`}
      disabled={isDisabled}
      style={finalStyle}
      {...props}
    >
      {isLoading && <Loader2 size={14} className="animate-spin" style={{ marginRight: children ? '0.25rem' : 0 }} />}
      
      {!isLoading && leftIcon && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      )}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      )}
    </button>
  )
}
