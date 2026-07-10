import { Calendar, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface MonthSelectorProps {
  activeMonth: string
  availableMonths: string[]
  onMonthChange: (month: string) => void
  showLabel?: boolean
  labelNode?: React.ReactNode
  allowAll?: boolean
}

export default function MonthSelector({ activeMonth, availableMonths, onMonthChange, showLabel = true, labelNode, allowAll = false }: MonthSelectorProps) {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [selectorYear, setSelectorYear] = useState(() => {
    if (activeMonth === 'all') return new Date().getFullYear()
    const parts = activeMonth.split('-')
    return parseInt(parts[0], 10) || new Date().getFullYear()
  })

  useEffect(() => {
    if (activeMonth && activeMonth !== 'all') {
      const parts = activeMonth.split('-')
      const y = parseInt(parts[0], 10)
      if (!isNaN(y)) {
        setSelectorYear(y)
      }
    }
  }, [activeMonth])

  const formatMonthName = (m: string) => {
    if (!m) return ''
    if (m === 'all') return 'Todos os Meses'
    const [year, month] = m.split('-')
    const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthsPt[parseInt(month, 10) - 1]} / ${year}`
  }

  const formatMonthShorthand = (m: string) => {
    if (!m) return ''
    if (m === 'all') return 'Todos'
    const [year, month] = m.split('-')
    const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const shortYear = year.substring(2)
    return `${monthsPt[parseInt(month, 10) - 1]} / ${shortYear}`
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {showMonthDropdown && (
        <div 
          onClick={() => setShowMonthDropdown(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
        />
      )}
      
      {showLabel && (
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
          <Calendar size={15} />
          {labelNode || <><span className="hide-mobile">Mês de Referência:</span><span className="show-mobile" style={{ display: 'none' }}>Mês:</span></>}
        </span>
      )}

      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setShowMonthDropdown(!showMonthDropdown)}
          className="btn btn-outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)'
          }}
        >
          <span className="hide-mobile">{formatMonthName(activeMonth)}</span>
          <span className="show-mobile" style={{ display: 'none' }}>{formatMonthShorthand(activeMonth)}</span>
          <ChevronDown size={14} style={{ opacity: 0.7, transform: showMonthDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        
        <AnimatePresence>
          {showMonthDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="month-dropdown-menu"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.5rem',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.75rem',
                zIndex: 1000,
                width: '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: 'var(--background)', 
                padding: '0.35rem 0.5rem', 
                borderRadius: '8px', 
                border: '1px solid var(--border)' 
              }}>
                <button 
                  type="button" 
                  onClick={() => setSelectorYear(y => y - 1)} 
                  className="btn btn-outline" 
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                >
                  &larr;
                </button>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                  {selectorYear}
                </span>
                <button 
                  type="button" 
                  onClick={() => setSelectorYear(y => y + 1)} 
                  className="btn btn-outline" 
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                >
                  &rarr;
                </button>
              </div>

              {allowAll && (
                <button
                  type="button"
                  onClick={() => {
                    onMonthChange('all')
                    setShowMonthDropdown(false)
                  }}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '6px',
                    border: activeMonth === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: activeMonth === 'all' ? 'var(--primary-light)' : 'var(--card)',
                    color: activeMonth === 'all' ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: activeMonth === 'all' ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    transition: 'all 0.15s ease',
                    boxShadow: activeMonth === 'all' ? 'var(--shadow-sm)' : 'none',
                    width: '100%',
                    marginBottom: '0.15rem'
                  }}
                  onMouseEnter={(e) => {
                    if (activeMonth !== 'all') {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.backgroundColor = 'var(--background)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeMonth !== 'all') {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'var(--card)';
                    }
                  }}
                >
                  📅 Todos os Meses
                </button>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '0.35rem',
                backgroundColor: 'var(--background)',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mLabel, idx) => {
                  const mVal = `${selectorYear}-${String(idx + 1).padStart(2, '0')}`
                  const isSelected = activeMonth === mVal
                  return (
                    <button
                      key={mLabel}
                      type="button"
                      onClick={() => {
                        onMonthChange(mVal)
                        setShowMonthDropdown(false)
                      }}
                      style={{
                        padding: '0.5rem 0.25rem',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card)',
                        color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.backgroundColor = 'var(--background)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.backgroundColor = 'var(--card)';
                        }
                      }}
                    >
                      {mLabel}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
