'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, X, Settings, Trash2, Calendar, Zap, PieChart, LogOut, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

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
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: 'USER' | 'ADMIN' } | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [rulesCount, setRulesCount] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)

  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"

  const fetchData = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const [peopleRes, expensesRes, rulesRes, userRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?t=${t}`),
        fetch(`/api/rules?t=${t}`),
        fetch(`/api/auth/me?t=${t}`)
      ])
      const peopleData = await peopleRes.json()
      const expensesData = await expensesRes.json()
      const rulesData = await rulesRes.json()
      const userData = await userRes.json()
      setPeople(Array.isArray(peopleData) ? peopleData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setRulesCount(Array.isArray(rulesData) ? rulesData.length : 0)
      setUser(userData.user)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-open settings if redirected with ?settings=true
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('settings') === 'true') {
      setShowSettings(true)
    }
  }, [searchParams])

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

  const handleClearData = async (type: string) => {
    let confirmMsg = 'Tem certeza que deseja prosseguir?'
    if (type === 'unassigned') {
      confirmMsg = 'Tem certeza que deseja deletar todas as despesas pendentes (não atribuídas)?'
    } else if (type === 'assigned') {
      confirmMsg = 'Tem certeza que deseja deletar todas as despesas atribuídas a algum integrante?'
    } else if (type === 'all_expenses') {
      confirmMsg = 'Tem certeza que deseja deletar todas as despesas do sistema?'
    } else if (type === 'reset_all') {
      confirmMsg = 'ATENÇÃO: Isso deletará todas as despesas e todas as pessoas cadastradas. Deseja redefinir todo o sistema?'
    }

    setConfirmDialog({
      message: confirmMsg,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
          })
          if (res.ok) {
            toast.success('Dados apagados com sucesso!')
            fetchData()
            setShowSettings(false)
          } else {
            toast.error('Erro ao limpar dados')
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

  return (
    <main className="container">
      <header className="header">
        <div>
          <div className="flex-row gap-3 flex-y-center" style={{ marginBottom: '0.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <PieChart size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-row gap-1" style={{ alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--foreground)' }}>
                Financial <span style={{ color: 'var(--primary)' }}>Manager</span>
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--border)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>v2.0.0</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', marginLeft: '0.1rem', fontSize: '0.9rem' }}>Controle de gastos compartilhados</p>
        </div>
        <div className="flex-row gap-3 flex-y-center">
          {user && (
            <div className="flex-row gap-3 flex-y-center" style={{ marginRight: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Olá, <strong style={{ color: 'var(--foreground)' }}>{user.name}</strong>
              </span>
              <button
                className="btn btn-outline"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--danger)',
                }}
                onClick={async () => {
                  const res = await fetch('/api/logout', { method: 'POST' })
                  if (res.ok) {
                    router.push('/login')
                    router.refresh()
                  }
                }}
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="flex-row gap-2" style={{ borderBottom: '1px solid var(--border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <Link href="/" style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Painel Geral
        </Link>
        <Link href="/people" style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Gastos por Pessoa
        </Link>
        <Link href="/rules" style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Regras Automáticas
        </Link>
      </div>

      {/* Month Toolbar / Selector */}
      <div className="card card-glass" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} style={{ color: 'var(--primary)' }} />
            Mês de Referência
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Filtrado para: <strong style={{ color: 'var(--foreground)' }}>{formatMonthName(activeMonth)}</strong>
          </span>
        </div>
        <div className="flex-row gap-2 flex-wrap">
          {availableMonths.map(m => {
            const isActive = m === activeMonth
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={isActive ? "btn btn-primary" : "btn btn-outline"}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500
                }}
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
            {totals.map(p => {
              const isActive = p.id === selectedPersonId
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPersonId(p.id)}
                  className={`card card-glass card-interactive flex-col gap-2`}
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
                </div>
              )
            })}
          </div>

          {/* Right Column: Detailed expenses for the selected person */}
          <div className="flex-1" style={{ minWidth: '320px' }}>
            {(() => {
              const activePerson = totals.find(p => p.id === selectedPersonId)
              if (!activePerson) return null

              return (
                <div className="card card-glass flex-col gap-4" style={{ padding: '2rem' }}>
                  <div className="flex-between flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                        Gastos de {activePerson.name}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                        Fatura de {formatMonthName(activeMonth)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total do Integrante</span>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                        R$ {activePerson.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {activePerson.expenses.length > 0 ? (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: '15%' }}>Data</th>
                            <th style={{ width: '15%' }}>Instituição</th>
                            <th style={{ width: '40%' }}>Descrição</th>
                            <th style={{ width: '20%' }}>Valor</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>Remover</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activePerson.expenses.map(e => {
                            const isNeg = e.amount < 0
                            return (
                              <tr key={e.id} style={{ backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.04)' : 'transparent' }}>
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
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      Nenhum gasto atribuído a {activePerson.name} em {formatMonthName(activeMonth)}.
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

        </div>
      )}

      {/* Settings Modal (Left Sidebar) */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="sidebar-overlay"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="sidebar-container"
            >
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Settings size={20} />
                  Configurações
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-col gap-6" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
                <div>
                  <h4 className="sidebar-section-title">Gerenciamento de Dados</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                    Escolha uma das ações abaixo para limpar as informações cadastradas.
                  </p>
                  
                  <div className="flex-col gap-2">
                    <button 
                      onClick={() => handleClearData('unassigned')}
                      className="sidebar-btn-danger"
                    >
                      <Trash2 size={16} />
                      Deletar Gastos Pendentes
                    </button>
                    
                    <button 
                      onClick={() => handleClearData('assigned')}
                      className="sidebar-btn-danger"
                    >
                      <Trash2 size={16} />
                      Deletar Gastos Atribuídos
                    </button>
                    
                    <button 
                      onClick={() => handleClearData('all_expenses')}
                      className="sidebar-btn-danger"
                    >
                      <Trash2 size={16} />
                      Limpar Todas as Despesas
                    </button>

                    <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border)' }} />

                    <button 
                      onClick={() => handleClearData('reset_all')}
                      className="sidebar-btn-danger-solid"
                    >
                      <Trash2 size={16} />
                      Resetar Todo o Sistema
                    </button>
                  </div>
                </div>

                {/* Link to Rules Page */}
                <div>
                  <h4 className="sidebar-section-title">Automação</h4>
                  <Link
                    href="/rules"
                    className="card card-interactive flex-between"
                    style={{ padding: '1rem', textDecoration: 'none', border: '1px solid var(--border)' }}
                    onClick={() => setShowSettings(false)}
                  >
                    <div className="flex-row gap-3 flex-y-center">
                      <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                        <Zap size={16} />
                      </div>
                      <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Gerenciar Regras</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automação de faturas</span>
                      </div>
                    </div>
                    <span className="badge badge-blue">
                      {rulesCount} regra{rulesCount !== 1 ? 's' : ''}
                    </span>
                  </Link>
                </div>

                {/* Link to Admin Panel */}
                {user && user.role === 'ADMIN' && (
                  <div>
                    <h4 className="sidebar-section-title">Administração</h4>
                    <Link
                      href="/admin"
                      className="card card-interactive flex-between"
                      style={{ padding: '1rem', textDecoration: 'none', border: '1px solid var(--border)' }}
                      onClick={() => setShowSettings(false)}
                    >
                      <div className="flex-row gap-3 flex-y-center">
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                          <Shield size={16} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Painel Admin</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gerenciar usuários</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                Financial Manager v2.0.0
              </div>
              {user && (
                <div className="flex-row gap-3" style={{ 
                  alignItems: 'center',
                  marginTop: '1.25rem', 
                  borderTop: '1px solid var(--border)', 
                  paddingTop: '1.25rem' 
                }}>
                  <div style={{
                    display: 'flex',
                    height: '2.2rem',
                    width: '2.2rem',
                    minWidth: '2.2rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-col" style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.email}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster position="bottom-right" />

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
      <footer style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>© {new Date().getFullYear()} Financial Manager v2.0.0. Todos os direitos reservados.</p>
        <p style={{ marginTop: '0.25rem' }}>Desenvolvido por <strong>Diógenes Viana</strong></p>
      </footer>
    </main>
  )
}

export default function PeopleDashboard() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Carregando dados...</div>}>
      <PeopleDashboardContent />
    </Suspense>
  )
}
