import React, { ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render: (item: T) => ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  
  // Selection
  selectable?: boolean
  selectedIds?: string[]
  onSelectAll?: (checked: boolean) => void
  onSelectRow?: (id: string, checked: boolean) => void
  
  // Sorting
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string) => void
  
  // Empty State
  emptyMessage?: ReactNode
  
  // Mobile Support
  renderMobileCard?: (item: T) => ReactNode
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  sortField,
  sortDirection,
  onSort,
  emptyMessage = 'Nenhum item encontrado.',
  renderMobileCard
}: DataTableProps<T>) {

  const renderSortIcon = (field: string) => {
    if (!sortField || !sortDirection || sortField !== field) {
      return <span className="th-sort-icon">↕</span>
    }
    return sortDirection === 'asc' 
      ? <span className="th-sort-icon">▲</span> 
      : <span className="th-sort-icon">▼</span>
  }

  const allSelected = data.length > 0 && data.every(item => selectedIds.includes(keyExtractor(item)))

  return (
    <>
      <div className={`table-responsive ${renderMobileCard ? 'hide-mobile' : ''}`} style={{ margin: 0 }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              {selectable && (
                <th style={{ width: '5%', textAlign: 'center', padding: '1rem' }}>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                  />
                </th>
              )}
              {columns.map(col => (
                <th 
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={col.sortable ? 'th-sortable' : ''}
                  style={{ 
                    width: col.width, 
                    textAlign: col.align || 'left',
                    padding: '1rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <div className="flex-row flex-y-center" style={{ justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    {col.label} {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map(item => {
                const id = keyExtractor(item)
                return (
                  <tr key={id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {selectable && (
                      <td style={{ textAlign: 'center', padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(id)}
                          onChange={(e) => onSelectRow?.(id, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '1rem', textAlign: col.align || 'left' }}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {renderMobileCard && (
        <div className="mobile-users-list">
          {data.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {emptyMessage}
            </div>
          ) : (
            data.map(item => <React.Fragment key={keyExtractor(item)}>{renderMobileCard(item)}</React.Fragment>)
          )}
        </div>
      )}
    </>
  )
}
