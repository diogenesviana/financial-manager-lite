'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, X, Settings, Trash2, Calendar, Zap, PieChart, LogOut, Shield, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'

import MainLayout from '@/components/MainLayout'

interface Person {
  id: string
  name: string
}

interface Expense {
  id: string
  date: string
  description: string
  amount: number
  personId: string | null
  person?: Person
  isManual: boolean
  month: string
  card?: string | null
}

function PeopleDashboardContent() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'card'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, selectedPersonId, searchTerm])

  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"

  const fetchData = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const [peopleRes, expensesRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?t=${t}`)
      ])
      const peopleData = await peopleRes.json()
      const expensesData = await expensesRes.json()
      setPeople(Array.isArray(peopleData) ? peopleData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-set the selected month to the latest available or current month
  useEffect(() => {
    if (!selectedMonth && expenses.length > 0) {
      const months = Array.from(new Set(expenses.map(e => e.month).filter(Boolean))).sort().reverse()
      if (months.length > 0) {
        setSelectedMonth(months[0])
      } else {
        setSelectedMonth(currentMonthStr)
      }
    } else if (!selectedMonth) {
      setSelectedMonth(currentMonthStr)
    }
  }, [expenses])

  // Auto-set the selected person to the first one available
  useEffect(() => {
    if (people.length > 0 && !selectedPersonId) {
      setSelectedPersonId(people[0].id)
    }
  }, [people, selectedPersonId])

  const assignExpense = async (expenseId: string, personId: string | null) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId }),
      })
      if (res.ok) {
        toast.success(personId ? 'Despesa atribuída!' : 'Atribuição removida!')
        setExpenses(expenses.map(e => e.id === expenseId ? { ...e, personId } : e))
      } else {
        toast.error('Erro ao atualizar')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  const deletePerson = async (id: string) => {
    const person = people.find(p => p.id === id)
    if (!person) return
    
    setConfirmDialog({
      message: `Tem certeza que deseja excluir "${person.name}"? Os gastos associados a esta pessoa voltarão a ficar pendentes.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/people/${id}`, { method: 'DELETE' })
          if (res.ok) {
            toast.success('Pessoa excluída!')
            const remaining = people.filter(p => p.id !== id)
            if (selectedPersonId === id) {
              setSelectedPersonId(remaining.length > 0 ? remaining[0].id : '')
            }
            fetchData()
          } else {
            toast.error('Erro ao excluir pessoa')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
  }



  // Generate last 6 months to always be available for selection
  const generateRecentMonths = () => {
    const months = []
    const d = new Date()
    for (let i = 0; i < 6; i++) {
      months.push(d.toISOString().substring(0, 7))
      d.setMonth(d.getMonth() - 1)
    }
    return months
  }

  // Get available months to filter
  const availableMonths = Array.from(new Set([
    ...generateRecentMonths(),
    ...expenses.map(e => e.month).filter(Boolean)
  ])).sort().reverse()

  const activeMonth = selectedMonth || currentMonthStr

  // Filter expenses by active month
  const filteredExpenses = expenses.filter(e => e.month === activeMonth)

  const grandTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const getPreviousMonthStr = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number)
    let prevYear = year
    let prevMonth = month - 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear = year - 1
    }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  }

  const prevMonthStr = getPreviousMonthStr(activeMonth)
   const prevExpenses = expenses.filter(e => e.month === prevMonthStr)
 
   const sortExpenses = (exps: Expense[]) => {
     return [...exps].sort((a, b) => {
       // 1. Data (Date)
       const parseDate = (dStr: string) => {
         const clean = dStr.trim()
         if (clean.includes('/')) {
           const [d, m] = clean.split('/').map(Number)
           return { day: d || 0, month: m || 0 }
         } else {
           const parts = clean.split(/\s+/)
           const d = parseInt(parts[0]) || 0
           const mStr = (parts[1] || '').toUpperCase()
           const monthsPt: { [key: string]: number } = {
             'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
             'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
           }
           return { day: d, month: monthsPt[mStr.substring(0, 3)] || 0 }
         }
       }
 
       const dateA = parseDate(a.date)
       const dateB = parseDate(b.date)
 
       if (dateA.month !== dateB.month) return dateA.month - dateB.month
       if (dateA.day !== dateB.day) return dateA.day - dateB.day
 
       // 2. Final do cartão (Final digits of card)
       const getCardDigits = (desc: string) => {
         const match = desc.match(/(?:•|\*|\s)+(\d{4})/);
         return match ? match[1] : '';
       }
 
       const cardA = getCardDigits(a.description)
       const cardB = getCardDigits(b.description)
 
       if (cardA !== cardB) {
         return cardA.localeCompare(cardB)
       }
 
       // 3. Inicial da compra (Initial/Alphabetical description)
       const cleanDesc = (desc: string) => {
         return desc.replace(/(?:•|\*|\s)+\d{4}/g, '').trim().toLowerCase()
       }
 
       return cleanDesc(a.description).localeCompare(cleanDesc(b.description))
     })
   }
 
   const totals = people.map(p => {
     const personExpenses = filteredExpenses.filter(e => e.personId === p.id)
     const sortedPersonExpenses = sortExpenses(personExpenses)
     const total = sortedPersonExpenses.reduce((sum, e) => sum + e.amount, 0)
 
     const prevPersonExpenses = prevExpenses.filter(e => e.personId === p.id)
     const prevTotal = prevPersonExpenses.reduce((sum, e) => sum + e.amount, 0)
 
     const diff = total - prevTotal
 
     return { ...p, total, expenses: sortedPersonExpenses, prevTotal, diff }
   })

  const formatMonthName = (m: string) => {
    const [year, month] = m.split('-')
    const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthsPt[parseInt(month) - 1]} / ${year}`
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    } catch {
      return isoString
    }
  }

  const handleSort = (field: 'date' | 'description' | 'amount' | 'card') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (field: 'date' | 'description' | 'amount' | 'card') => {
    if (sortField !== field) return <span className="th-sort-icon">↕</span>
    return sortDirection === 'asc' ? <span className="th-sort-icon">▲</span> : <span className="th-sort-icon">▼</span>
  }

  return (
    <MainLayout>

      {/* Month Toolbar / Selector */}
      <div className="month-toolbar">
        <div className="month-toolbar-header">
          <span className="month-toolbar-title">
            <Calendar size={14} />
            Mês de Referência
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Filtrado para: <strong style={{ color: 'var(--primary)' }}>{formatMonthName(activeMonth)}</strong>
          </span>
        </div>
        <div className="month-pills">
          {availableMonths.map(m => {
            const isActive = m === activeMonth
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`month-pill ${isActive ? 'active' : ''}`}
              >
                {formatMonthName(m)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Detalhamento por Pessoa</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selecione um integrante na lista à esquerda para conferir seus respectivos gastos detalhados.</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '5rem 0', color: 'var(--text-muted)' }}>Carregando dados...</div>
      ) : people.length === 0 ? (
        <div className="card flex-col flex-center" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma pessoa cadastrada. Cadastre pessoas no Painel Geral primeiro.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>Ir para o Painel Geral</Link>
        </div>
      ) : (
        <div className="flex-row gap-6" style={{ alignItems: 'start', flexWrap: 'wrap' }}>
          
          {/* Left Column: People selector cards */}
          <div className="flex-col gap-3" style={{ flex: '1 1 300px', maxWidth: '350px' }}>
            <AnimatePresence mode="popLayout">
              {totals.map((p, index) => {
                const isActive = p.id === selectedPersonId
                return (
                  <motion.div 
                    key={p.id}
                    layout
                    onClick={() => setSelectedPersonId(p.id)}
                    className={`card card-glass card-interactive flex-col gap-2`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    style={{
                      cursor: 'pointer',
                      border: isActive ? '2px solid var(--primary)' : undefined,
                      boxShadow: isActive ? 'var(--shadow-md)' : undefined,
                      transform: isActive ? 'scale(1.02)' : undefined,
                    }}
                  >
                    <div className="flex-between">
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: isActive ? 'var(--primary)' : 'var(--foreground)' }}>
                        {p.name}
                      </span>
                      <div className="flex-row gap-2 flex-y-center">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {grandTotal > 0 ? ((p.total / grandTotal) * 100).toFixed(0) : 0}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            deletePerson(p.id)
                          }}
                          className="btn"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.6,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                          title={`Excluir ${p.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '0.1rem' }}>
                      R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{p.expenses.length} transações</span>
                      <div style={{ 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.1rem',
                        color: p.diff > 0 ? 'var(--danger)' : p.diff < 0 ? 'var(--success)' : 'var(--text-muted)'
                      }}>
                        {p.diff > 0 ? (
                          <span>▲ +R$ {p.diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        ) : p.diff < 0 ? (
                          <span>▼ -R$ {Math.abs(p.diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span>= Estável</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Right Column: Detailed expenses for the selected person */}
          <div className="flex-1" style={{ minWidth: '320px' }}>
            {(() => {
              const activePerson = totals.find(p => p.id === selectedPersonId)
              if (!activePerson) return null
              const searchedExpenses = activePerson.expenses.filter(e => 
                e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.card || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.amount.toString().includes(searchTerm) ||
                e.date.toLowerCase().includes(searchTerm.toLowerCase())
              )

              const sortedExpenses = [...searchedExpenses].sort((a, b) => {
                let comparison = 0
                if (sortField === 'date') {
                  const parseDate = (dStr: string) => {
                    const clean = dStr.trim()
                    if (clean.includes('/')) {
                      const [d, m] = clean.split('/').map(Number)
                      return { day: d || 0, month: m || 0 }
                    } else {
                      const parts = clean.split(/\s+/)
                      const d = parseInt(parts[0]) || 0
                      const mStr = (parts[1] || '').toUpperCase()
                      const monthsPt: { [key: string]: number } = {
                        'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
                        'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
                      }
                      return { day: d, month: monthsPt[mStr.substring(0, 3)] || 0 }
                    }
                  }
                  const dateA = parseDate(a.date)
                  const dateB = parseDate(b.date)
                  if (dateA.month !== dateB.month) comparison = dateA.month - dateB.month
                  else comparison = dateA.day - dateB.day
                } else if (sortField === 'description') {
                  comparison = a.description.localeCompare(b.description)
                } else if (sortField === 'amount') {
                  comparison = a.amount - b.amount
                } else if (sortField === 'card') {
                  comparison = (a.card || '').localeCompare(b.card || '')
                }
                return sortDirection === 'asc' ? comparison : -comparison
              })

              const itemsPerPage = 15
              const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage)
              const paginatedExpenses = sortedExpenses.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )

              const activeTotal = searchedExpenses.reduce((sum, e) => sum + e.amount, 0)

              return (
                <motion.div 
                  key={selectedPersonId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="card card-glass flex-col gap-4" 
                  style={{ padding: '2rem' }}
                >
                  <div className="flex-between flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div className="flex-col">
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membro Selecionado</span>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', margin: '0.2rem 0 0 0' }}>{activePerson.name}</h2>
                    </div>
                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total no Mês</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', margin: '0.2rem 0 0 0' }}>
                        R$ {activeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {sortedExpenses.length > 0 ? (
                    <>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th 
                                onClick={() => handleSort('date')}
                                className="th-sortable"
                                style={{ width: '15%' }}
                              >
                                <div className="flex-row flex-y-center">
                                  Data {renderSortIcon('date')}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort('card')}
                                className="th-sortable"
                                style={{ width: '15%' }}
                              >
                                <div className="flex-row flex-y-center">
                                  Instituição {renderSortIcon('card')}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort('description')}
                                className="th-sortable"
                                style={{ width: '40%' }}
                              >
                                <div className="flex-row flex-y-center">
                                  Descrição {renderSortIcon('description')}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleSort('amount')}
                                className="th-sortable"
                                style={{ width: '20%' }}
                              >
                                <div className="flex-row flex-y-center">
                                  Valor {renderSortIcon('amount')}
                                </div>
                              </th>
                              <th style={{ width: '10%', textAlign: 'center' }}>Remover</th>
                            </tr>
                          </thead>
                          <tbody>
                            <AnimatePresence mode="popLayout">
                              {paginatedExpenses.map(e => {
                                const isNeg = e.amount < 0
                                return (
                                  <motion.tr 
                                    key={e.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}
                                  >
                                    <td style={{ color: isNeg ? 'var(--success)' : 'inherit' }}>{formatDate(e.date)}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                      {e.card ? (
                                        <span style={{ 
                                          background: 'var(--background)', 
                                          padding: '0.2rem 0.4rem', 
                                          borderRadius: '4px', 
                                          border: '1px solid var(--border)',
                                          fontFamily: 'monospace'
                                        }}>
                                          {e.card}
                                        </span>
                                      ) : '-'}
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 500, color: isNeg ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {e.description}
                                        {isNeg && (
                                          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', textTransform: 'capitalize' }}>
                                            Estorno
                                          </span>
                                        )}
                                      </div>
                                      {e.isManual && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Manual</span>}
                                    </td>
                                    <td style={{ fontWeight: 600, color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                                      {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <button
                                        onClick={(ev) => {
                                          ev.preventDefault()
                                          ev.stopPropagation()
                                          assignExpense(e.id, null)
                                        }}
                                        className="btn"
                                        style={{ padding: '0.4rem', color: 'var(--danger)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                                        title="Remover atribuição"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </motion.tr>
                                )
                              })}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>

                      <div className="mobile-people-expenses">
                        <AnimatePresence mode="popLayout">
                          {paginatedExpenses.map(e => {
                            const isNeg = e.amount < 0
                            return (
                              <motion.div 
                                key={e.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="people-expense-mobile-card"
                                style={{ backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.04)' : undefined }}
                              >
                                <div className="people-expense-mobile-card-header">
                                  <div className="people-expense-mobile-card-title">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontWeight: 600 }}>
                                      {e.description}
                                      {isNeg && (
                                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', textTransform: 'capitalize' }}>
                                          Estorno
                                        </span>
                                      )}
                                      {e.isManual && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Manual</span>}
                                    </div>
                                  </div>
                                  <div className="people-expense-mobile-card-amount" style={{ fontWeight: 800, color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                                    {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                  </div>
                                </div>
                                <div className="people-expense-mobile-card-footer">
                                  <div className="people-expense-mobile-card-meta">
                                    <span>{formatDate(e.date)}</span>
                                    {e.card && (
                                      <span style={{ 
                                        background: 'var(--background)', 
                                        padding: '0.1rem 0.35rem', 
                                        borderRadius: '4px', 
                                        border: '1px solid var(--border)',
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem'
                                      }}>
                                        {e.card}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(ev) => {
                                      ev.preventDefault()
                                      ev.stopPropagation()
                                      assignExpense(e.id, null)
                                    }}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.75rem',
                                      color: 'var(--danger)',
                                      borderColor: 'var(--border)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                    title="Remover atribuição"
                                  >
                                    <Trash2 size={12} />
                                    Remover
                                  </button>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex-row flex-y-center" style={{ justifyContent: 'center', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Anterior
                          </button>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Página <strong style={{ color: 'var(--foreground)' }}>{currentPage}</strong> de {totalPages}
                          </span>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            Próxima
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      Nenhum gasto atribuído a {activePerson.name} em {formatMonthName(activeMonth)}.
                    </div>
                  )}
                </motion.div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Settings Modal (Left Sidebar) */}
      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card glass"
              style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', zIndex: 10000 }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Confirmação</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm()
                    setConfirmDialog(null)
                  }}
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}

export default function PeopleDashboard() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Carregando dados...</div>}>
      <PeopleDashboardContent />
    </Suspense>
  )
}
