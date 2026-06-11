'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, X, Settings, Trash2, Calendar, Zap, PieChart, LogOut, Shield, Search, Phone, Mail, MessageSquare, UserCheck, Clock, UserX, Edit2, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'

import MainLayout from '@/components/MainLayout'
import { WhatsAppService } from '@/lib/whatsapp'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'

interface Person {
  id: string
  name: string
  phone?: string | null
  linkedUserId?: string | null
  linkStatus?: string
  inviteEmail?: string | null
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

const parseDateToTime = (dStr: any) => {
  if (!dStr) return 0
  const d = new Date(dStr)
  if (!isNaN(d.getTime())) return d.getTime()
  const clean = String(dStr).trim()
  if (clean.includes('/')) {
    const parts = clean.split('/')
    const day = parseInt(parts[0]) || 1
    const month = (parseInt(parts[1]) || 1) - 1
    const year = parseInt(parts[2]) || new Date().getFullYear()
    return new Date(year, month, day).getTime()
  } else {
    const parts = clean.split(/\s+/)
    const day = parseInt(parts[0]) || 1
    const mStr = (parts[1] || '').toUpperCase()
    const monthsPt: { [key: string]: number } = {
      'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
      'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
    }
    const month = monthsPt[mStr.substring(0, 3)] !== undefined ? monthsPt[mStr.substring(0, 3)] : 0
    const year = new Date().getFullYear()
    return new Date(year, month, day).getTime()
  }
}

function PeopleDashboardContent() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'card'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [editPhone, setEditPhone] = useState('')
  const [editInviteEmail, setEditInviteEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editIsSystemUser, setEditIsSystemUser] = useState(false)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) {
      return numbers
    }
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    }
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

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

  const startEditPerson = (p: Person) => {
    setEditingPersonId(p.id)
    setEditName(p.name)
    setEditPhone(formatPhone(p.phone || ''))
    setEditInviteEmail(p.inviteEmail || '')
    setEditIsSystemUser(!!p.inviteEmail || (p.linkStatus !== 'NONE' && p.linkStatus !== undefined))
  }

  const cancelEdit = () => {
    setEditingPersonId(null)
    setEditName('')
    setEditPhone('')
    setEditInviteEmail('')
    setEditIsSystemUser(false)
  }

  const saveEditPerson = async (personId: string) => {
    if (!editName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    const cleanPhone = editPhone.replace(/\D/g, '')
    if (!editIsSystemUser && cleanPhone && cleanPhone.length < 10) {
      toast.error('Telefone inválido. Digite DDD + Número.')
      return
    }

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editIsSystemUser ? null : (editPhone.trim() || null),
          inviteEmail: editIsSystemUser ? (editInviteEmail.trim() || null) : null,
          isSystemUser: editIsSystemUser
        })
      })
      if (res.ok) {
        toast.success('Integrante atualizado!')
        cancelEdit()
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao atualizar')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSendWhatsApp = (person: Person, personExpenses: Expense[], total: number) => {
    if (!person.phone) {
      toast.error('Cadastre o telefone do integrante para enviar pelo WhatsApp.')
      return
    }
    WhatsAppService.sendBillSummary({
      phone: person.phone,
      personName: person.name,
      month: formatMonthName(activeMonth),
      expenses: personExpenses,
      totalAmount: total
    })
  }

  const renderLinkStatusBadge = (person: Person) => {
    if (!person.linkStatus || person.linkStatus === 'NONE') return null
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      PENDING: { label: 'Convite Pendente', color: 'var(--warning, #f59e0b)', icon: <Clock size={10} /> },
      ACCEPTED: { label: 'Vinculado', color: 'var(--success, #10b981)', icon: <UserCheck size={10} /> },
      REJECTED: { label: 'Recusado', color: 'var(--danger)', icon: <UserX size={10} /> }
    }
    const c = config[person.linkStatus] || null
    if (!c) return null
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
        borderRadius: '999px', backgroundColor: `${c.color}15`, color: c.color,
        textTransform: 'uppercase', letterSpacing: '0.03em'
      }}>
        {c.icon} {c.label}
      </span>
    )
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
        const timeA = parseDateToTime(a.date)
        const timeB = parseDateToTime(b.date)
        if (timeA !== timeB) return timeA - timeB
 
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

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Detalhamento por Pessoa</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selecione um integrante na lista à esquerda para conferir seus respectivos gastos detalhados.</p>
      </div>

      {/* Month Toolbar / Selector */}
      {showMonthDropdown && (
        <div 
          onClick={() => setShowMonthDropdown(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
        />
      )}
      <div className="month-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.5rem', position: 'relative', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="month-toolbar-title" style={{ fontSize: '0.8rem' }}>
            <Calendar size={14} />
            Mês de Referência:
          </span>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)'
              }}
            >
              <span>{formatMonthName(activeMonth)}</span>
              <ChevronDown size={14} style={{ opacity: 0.7, transform: showMonthDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            <AnimatePresence>
              {showMonthDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: 0,
                    minWidth: '220px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.35rem',
                    zIndex: 101,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem'
                  }}
                >
                  {availableMonths.map(m => {
                    const isActive = m === activeMonth
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedMonth(m)
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
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--background)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
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
        
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Filtrado para: <strong style={{ color: 'var(--primary)' }}>{formatMonthName(activeMonth)}</strong>
        </span>
      </div>

      {loading ? (
        <PageLoader title="Carregando dados..." description="Carregando integrantes e despesas vinculadas." />
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
                    {editingPersonId === p.id ? (
                      <div className="flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nome" className="input"
                          style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                        />
                        {/* Toggle de Tipo de Membro */}
                        <div className="flex-row gap-2 flex-y-center" style={{ marginBottom: '0.25rem', padding: '0.1rem 0' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Membro do sistema?</span>
                          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={editIsSystemUser} 
                              onChange={(e) => setEditIsSystemUser(e.target.checked)}
                              style={{ display: 'none' }}
                            />
                            <div style={{
                              width: '2.25rem',
                              height: '1.25rem',
                              backgroundColor: editIsSystemUser ? 'var(--primary)' : 'var(--border)',
                              borderRadius: '999px',
                              position: 'relative',
                              transition: 'background-color 0.2s'
                            }}>
                              <div style={{
                                width: '0.95rem',
                                height: '0.95rem',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '0.15rem',
                                left: editIsSystemUser ? '1.15rem' : '0.15rem',
                                transition: 'left 0.2s'
                              }} />
                            </div>
                          </label>
                        </div>

                        {!editIsSystemUser ? (
                          <div style={{ position: 'relative' }}>
                            <Phone size={12} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="tel" value={editPhone} onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                              placeholder="WhatsApp (ex: (11) 99999-9999)" className="input"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem 0.35rem 1.6rem' }}
                            />
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <Mail size={12} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="email" value={editInviteEmail} onChange={(e) => setEditInviteEmail(e.target.value)}
                              placeholder="E-mail de convite" className="input"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem 0.35rem 1.6rem' }}
                            />
                          </div>
                        )}
                        <div className="flex-row gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                            <X size={12} /> Cancelar
                          </button>
                          <button onClick={() => saveEditPerson(p.id)} disabled={savingEdit} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                            <Check size={12} /> {savingEdit ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-between">
                          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: isActive ? 'var(--primary)' : 'var(--foreground)' }}>
                            {p.name}
                          </span>
                          <div className="flex-row gap-2 flex-y-center">
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {grandTotal > 0 ? ((p.total / grandTotal) * 100).toFixed(0) : 0}%
                            </span>
                            <Tooltip content={`Editar ${p.name}`}>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditPerson(p); }}
                                className="btn"
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                              >
                                <Edit2 size={13} />
                              </button>
                            </Tooltip>
                            <Tooltip content={`Excluir ${p.name}`}>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deletePerson(p.id); }}
                                className="btn"
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                        {(p.phone || p.linkStatus !== 'NONE') && (
                          <div className="flex-row gap-2 flex-y-center" style={{ flexWrap: 'wrap' }}>
                            {p.phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                <Phone size={10} /> {formatPhone(p.phone)}
                              </span>
                            )}
                            {renderLinkStatusBadge(p)}
                          </div>
                        )}
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '0.1rem' }}>
                          R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>{p.expenses.length} transações</span>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.1rem', color: p.diff > 0 ? 'var(--danger)' : p.diff < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                            {p.diff > 0 ? (
                              <span>▲ +R$ {p.diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            ) : p.diff < 0 ? (
                              <span>▼ -R$ {Math.abs(p.diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <span>= Estável</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
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
                  comparison = parseDateToTime(a.date) - parseDateToTime(b.date)
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
                      {renderLinkStatusBadge(activePerson)}
                    </div>
                    <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                      <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total no Mês</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', margin: '0.2rem 0 0 0' }}>
                          R$ {activeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {activePerson.phone && sortedExpenses.length > 0 && (
                        <button
                          onClick={() => handleSendWhatsApp(activePerson, sortedExpenses, activeTotal)}
                          className="btn btn-outline"
                          style={{
                            padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            color: '#25D366', borderColor: '#25D36640',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#25D36615'; e.currentTarget.style.borderColor = '#25D366'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#25D36640'; }}
                          title="Enviar resumo da fatura pelo WhatsApp"
                        >
                          <MessageSquare size={14} />
                          Enviar Fatura
                        </button>
                      )}
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
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
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
    <Suspense fallback={<PageLoader title="Carregando dados..." description="Carregando painel de pessoas." />}>
      <PeopleDashboardContent />
    </Suspense>
  )
}
