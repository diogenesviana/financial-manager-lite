import { Calendar, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface MonthSelectorProps {
  activeMonth: string
  availableMonths: string[]
  onMonthChange: (month: string) => void
  showLabel?: boolean
  labelNode?: React.ReactNode
}

export default function MonthSelector({ activeMonth, availableMonths, onMonthChange, showLabel = true, labelNode }: MonthSelectorProps) {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)

  const formatMonthName = (m: string) => {
    if (!m) return ''
    const [year, month] = m.split('-')
    const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthsPt[parseInt(month, 10) - 1]} / ${year}`
  }

  const formatMonthShorthand = (m: string) => {
    if (!m) return ''
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
            >
              {availableMonths.map(m => {
                const isActive = m === activeMonth
                return (
                  <button
                    key={m}
                    onClick={() => {
                      onMonthChange(m)
                      setShowMonthDropdown(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--primary)' : 'var(--foreground)',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                  >
                    <span>{formatMonthName(m)}</span>
                    {isActive && <Check size={14} style={{ color: 'var(--primary)' }} />}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
