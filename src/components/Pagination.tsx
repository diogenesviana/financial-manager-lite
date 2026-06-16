import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsShown?: number
  centered?: boolean
  style?: React.CSSProperties
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsShown,
  centered,
  style
}: PaginationProps) {
  if (totalPages <= 1) return null

  const showStats = totalItems !== undefined && itemsShown !== undefined

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: centered ? 'center' : (showStats ? 'space-between' : 'flex-end'), 
      alignItems: 'center', 
      ...style 
    }}>
      {showStats && !centered && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Mostrando {itemsShown} de {totalItems}
        </span>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="btn btn-outline"
          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="btn btn-outline"
          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
