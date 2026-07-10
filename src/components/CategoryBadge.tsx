import React from 'react'

// ─── Source of Truth: mapa de cores por categoria ───────────────────────────
// Importe este mapa (categoryColorMap) em qualquer lugar que precise das cores.
export const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
  'Alimentação':  { bg: 'rgba(239, 68,  68,  0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' },
  'Transporte':   { bg: 'rgba(59,  130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' },
  'Lazer':        { bg: 'rgba(245, 158, 11,  0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' },
  'Saúde':        { bg: 'rgba(16,  185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  'Moradia':      { bg: 'rgba(139, 92,  246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' },
  'Casa':         { bg: 'rgba(139, 92,  246, 0.12)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.25)' },
  'Assinaturas':  { bg: 'rgba(236, 72,  153, 0.12)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.25)' },
  'Educação':     { bg: 'rgba(6,   182, 212, 0.12)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.25)' },
  'Vestuário':    { bg: 'rgba(249, 115, 22,  0.12)', text: '#f97316', border: 'rgba(249, 115, 22, 0.25)' },
  'Viagem':       { bg: 'rgba(20,  184, 166, 0.12)', text: '#14b8a6', border: 'rgba(20, 184, 166, 0.25)' },
  'Outros':       { bg: 'rgba(107, 114, 128, 0.12)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.25)' },
}

const defaultCategoryColor = {
  bg: 'rgba(99, 102, 241, 0.12)',
  text: '#6366f1',
  border: 'rgba(99, 102, 241, 0.25)',
}

interface CategoryBadgeProps {
  category?: string | null
  /** 'sm' (default) = badge compacto para tabelas/listas; 'md' = ligeiramente maior */
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const cat = category || 'Outros'
  const color = categoryColorMap[cat] || defaultCategoryColor

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
        fontSize: size === 'md' ? '0.78rem' : '0.72rem',
        padding: size === 'md' ? '0.25rem 0.65rem' : '0.2rem 0.5rem',
        borderRadius: '20px',
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {cat}
    </span>
  )
}
