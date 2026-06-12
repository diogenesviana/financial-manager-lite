'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, X, Settings, Trash2, Calendar, Zap, PieChart, LogOut, Shield, Search, Phone, Mail, MessageSquare, UserCheck, Clock, UserX, Edit2, Check, ChevronDown, UserPlus, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'

import MainLayout from '@/components/MainLayout'
import { WhatsAppService } from '@/lib/whatsapp'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'
import BulkActionsBar from '@/components/BulkActionsBar'

interface Person {
  id: string
  name: string
  userId: string
  phone?: string | null
  linkedUserId?: string | null
  linkStatus?: string
  inviteEmail?: string | null
  avatar?: string | null
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
  const [dbMonths, setDbMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7))
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
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
 
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonIsSystemUser, setNewPersonIsSystemUser] = useState(false)
  const [newPersonPhone, setNewPersonPhone] = useState('')
  const [newPersonInviteEmail, setNewPersonInviteEmail] = useState('')
  const [showAddPersonForm, setShowAddPersonForm] = useState(false)
  const [addFlowStep, setAddFlowStep] = useState<null | 'email' | 'whatsapp'>(null)

  // Email lookup state (add form)
  type LookupResult = { found: boolean; user?: { id: string; name: string; avatar: string | null; email: string }; alreadyLinked?: boolean } | null
  const [newEmailLookup, setNewEmailLookup] = useState<LookupResult>(null)
  const [newEmailLookupLoading, setNewEmailLookupLoading] = useState(false)
  const newLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Email lookup state (edit form)
  const [editEmailLookup, setEditEmailLookup] = useState<LookupResult>(null)
  const [editEmailLookupLoading, setEditEmailLookupLoading] = useState(false)
  const editLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
 
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

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const triggerEmailLookup = (
    email: string,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    setLoading: (v: boolean) => void,
    setResult: (v: LookupResult) => void
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!isValidEmail(email)) {
      setResult(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setResult(null)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/lookup?email=${encodeURIComponent(email.trim())}`)
        const data = await res.json()
        if (res.ok) {
          setResult(data)
        } else {
          setResult({ found: false })
        }
      } catch {
        setResult({ found: false })
      } finally {
        setLoading(false)
      }
    }, 500)
  }
 
  const searchParams = useSearchParams()
 
  useEffect(() => {
    if (searchParams && searchParams.get('add') === 'true') {
      setShowAddPersonForm(true)
    }
  }, [searchParams])
 
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, selectedPersonId, searchTerm])

  // Auto-fill name from system user when found via email lookup (only if name field is empty)
  useEffect(() => {
    if (newEmailLookup?.found && newEmailLookup.user) {
      if (!newPersonName.trim()) {
        setNewPersonName(newEmailLookup.user.name)
      }
    }
  }, [newEmailLookup])
 
  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"
 
  const fetchData = async (monthToFetch?: string) => {
    setLoading(true)
    try {
      const t = Date.now()
      const targetMonth = monthToFetch || selectedMonth || currentMonthStr
      const [peopleRes, expensesRes, monthsRes, userRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?month=${targetMonth}&t=${t}`),
        fetch(`/api/expenses/months?t=${t}`),
        fetch(`/api/auth/me?t=${t}`)
      ])
      const peopleData = await peopleRes.json()
      const expensesData = await expensesRes.json()
      const monthsData = monthsRes.ok ? await monthsRes.json() : []
      if (userRes.ok) {
        const userData = await userRes.json()
        setCurrentUser(userData.user)
      }
      setPeople(Array.isArray(peopleData) ? peopleData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setDbMonths(Array.isArray(monthsData) ? monthsData : [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }
 
  useEffect(() => {
    fetchData(selectedMonth)
  }, [selectedMonth])

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

  const handleBulkUnassign = async () => {
    if (selectedExpenseIds.length === 0) return
    const toastId = toast.loading(`Desatribuindo ${selectedExpenseIds.length} despesas...`)
    try {
      const promises = selectedExpenseIds.map(id =>
        fetch(`/api/expenses/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId: null }),
        })
      )
      const results = await Promise.all(promises)
      if (results.every(res => res.ok)) {
        toast.success('Desatribuição concluída!', { id: toastId })
        setSelectedExpenseIds([])
        fetchData()
      } else {
        toast.error('Erro em algumas despesas.', { id: toastId })
      }
    } catch {
      toast.error('Erro de conexão.', { id: toastId })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedExpenseIds.length === 0) return
    setConfirmDialog({
      message: `Tem certeza que deseja excluir permanentemente ${selectedExpenseIds.length} despesas do sistema?`,
      onConfirm: async () => {
        const toastId = toast.loading(`Excluindo ${selectedExpenseIds.length} despesas...`)
        try {
          const promises = selectedExpenseIds.map(id =>
            fetch(`/api/expenses/${id}`, { method: 'DELETE' })
          )
          const results = await Promise.all(promises)
          if (results.every(res => res.ok)) {
            toast.success('Despesas excluídas com sucesso!', { id: toastId })
            setSelectedExpenseIds([])
            fetchData()
          } else {
            toast.error('Erro ao excluir algumas despesas.', { id: toastId })
          }
        } catch {
          toast.error('Erro de conexão.', { id: toastId })
        }
      }
    })
  }

  const deleteExpense = async (id: string) => {
    setConfirmDialog({
      message: 'Tem certeza que deseja excluir esta despesa permanentemente?',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
          if (res.ok) {
            toast.success('Despesa excluída!')
            setExpenses(prev => prev.filter(e => e.id !== id))
          } else {
            toast.error('Erro ao excluir')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
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

  const addPerson = async () => {
    const isEmail = addFlowStep === 'email'
    const trimmedName = newPersonName.trim()
    if (!trimmedName && !(isEmail && newEmailLookup?.found && newEmailLookup.user)) {
      toast.error('Informe o nome do integrante.')
      return
    }
    const finalName = trimmedName || (newEmailLookup?.user?.name ?? '')

    const exists = people.some(p => p.name.toLowerCase() === finalName.toLowerCase())
    if (exists) {
      toast.error('Uma pessoa com este nome já está cadastrada.')
      return
    }

    const cleanPhone = newPersonPhone.replace(/\D/g, '')
    // Validate phone for WhatsApp flow OR email flow where user wasn't found (phone is optional but must be valid if filled)
    if (cleanPhone && cleanPhone.length < 10) {
      toast.error('Telefone inválido. Digite DDD + Número.')
      return
    }

    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          // Save phone if: WhatsApp flow, or email flow where user was not found
          phone: (isEmail && newEmailLookup?.found) ? null : (newPersonPhone.trim() || null),
          inviteEmail: isEmail ? (newPersonInviteEmail.trim() || null) : null,
          isSystemUser: isEmail
        }),
      })
      if (res.ok) {
        const person = await res.json()
        setPeople([...people, person])
        setNewPersonName('')
        setNewPersonPhone('')
        setNewPersonInviteEmail('')
        setNewPersonIsSystemUser(false)
        setNewEmailLookup(null)
        setAddFlowStep(null)
        setShowAddPersonForm(false)
        toast.success(`Pessoa "${finalName}" adicionada com sucesso!`)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Erro ao adicionar pessoa')
      }
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error)
      toast.error('Erro de conexão ao adicionar pessoa')
    }
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
    ...dbMonths
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
      ) : (
        <div className="flex-col gap-4" style={{ width: '100%' }}>
          
          {/* Horizontal members bar */}
          <div className="members-horizontal-bar">
            {/* Add member button */}
            <div 
              className="member-avatar-add-card"
              onClick={() => setShowAddPersonForm(true)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                backgroundColor: 'var(--background)',
                color: 'var(--primary)',
                marginBottom: '0.4rem',
                border: '1px dashed var(--border)'
              }}>
                <Plus size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Adicionar</span>
            </div>

            {/* List of members */}
            {totals.map((p) => {
              const isActive = p.id === selectedPersonId
              return (
                <div
                  key={p.id}
                  className={`member-avatar-card ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedPersonId(p.id)}
                >
                  <div className="avatar-wrapper">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="avatar-image" />
                    ) : (
                      <div className="avatar-placeholder">
                        {p.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <span className="member-name">{p.name}</span>
                  <span className="member-total">
                    R$ {p.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Detailed expenses for the selected person */}
          <div style={{ width: '100%' }}>
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
                  <div className="people-details-header">
                    <div className="flex-row flex-y-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                      {activePerson.avatar ? (
                        <img 
                          src={activePerson.avatar} 
                          alt={activePerson.name}
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--primary)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '3.5rem',
                          height: '3.5rem',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 800,
                          fontSize: '1.4rem',
                          border: '2px solid var(--primary)',
                          flexShrink: 0
                        }}>
                          {activePerson.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-col" style={{ minWidth: 0 }}>
                        <div className="flex-row flex-y-center gap-2" style={{ flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activePerson.name}
                          </h2>
                          {activePerson.linkedUserId === activePerson.userId && (
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>
                              Você
                            </span>
                          )}
                          <div className="flex-row gap-1">
                            <Tooltip content={`Editar ${activePerson.name}`}>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditPerson(activePerson); }}
                                className="btn btn-outline"
                                style={{ padding: '4px', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                              >
                                <Edit2 size={13} style={{ color: 'var(--text-muted)' }} />
                              </button>
                            </Tooltip>
                            {activePerson.linkedUserId === currentUser?.id ? (
                              <Tooltip content="Não é possível excluir você mesmo">
                                <button
                                  className="btn btn-outline"
                                  disabled
                                  style={{ padding: '4px', display: 'flex', alignItems: 'center', borderColor: 'var(--border)', opacity: 0.5, cursor: 'not-allowed' }}
                                >
                                  <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip content={`Excluir ${activePerson.name}`}>
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); deletePerson(activePerson.id); }}
                                  className="btn btn-outline"
                                  style={{ padding: '4px', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                                >
                                  <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="flex-row gap-2 flex-y-center" style={{ flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          {activePerson.phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              <Phone size={11} /> {formatPhone(activePerson.phone)}
                            </span>
                          )}
                          {renderLinkStatusBadge(activePerson)}
                        </div>
                      </div>
                    </div>

                    <div className="flex-col gap-2" style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total no Mês</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', margin: '0.2rem 0 0 0' }}>
                          R$ {activeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex-row gap-2 flex-y-center">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {activePerson.expenses.length} transações | {grandTotal > 0 ? ((activePerson.total / grandTotal) * 100).toFixed(0) : 0}% do total
                        </span>
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
                  </div>

                  {sortedExpenses.length > 0 ? (
                    <>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th style={{ width: '5%', textAlign: 'center' }}>
                                <input 
                                  type="checkbox"
                                  checked={paginatedExpenses.length > 0 && paginatedExpenses.every(e => selectedExpenseIds.includes(e.id))}
                                  onChange={(ev) => {
                                    if (ev.target.checked) {
                                      const newIds = Array.from(new Set([...selectedExpenseIds, ...paginatedExpenses.map(e => e.id)]))
                                      setSelectedExpenseIds(newIds)
                                    } else {
                                      const pIds = paginatedExpenses.map(e => e.id)
                                      setSelectedExpenseIds(selectedExpenseIds.filter(id => !pIds.includes(id)))
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                              </th>
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
                                style={{ width: '35%' }}
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
                              <th style={{ width: '15%', textAlign: 'center' }}>Ações</th>
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
                                    <td style={{ textAlign: 'center' }}>
                                      <input 
                                        type="checkbox"
                                        checked={selectedExpenseIds.includes(e.id)}
                                        onChange={() => {
                                          setSelectedExpenseIds(prev => 
                                            prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id]
                                          )
                                        }}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </td>
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
                                      <div className="flex-row flex-center gap-2">
                                        <Tooltip content="Desatribuir gasto">
                                          <button
                                            onClick={(ev) => {
                                              ev.preventDefault()
                                              ev.stopPropagation()
                                              assignExpense(e.id, null)
                                            }}
                                            className="btn btn-outline"
                                            style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                                          >
                                            <UserX size={14} style={{ color: 'var(--text-muted)' }} />
                                          </button>
                                        </Tooltip>
                                        <Tooltip content="Excluir permanentemente">
                                          <button
                                            onClick={(ev) => {
                                              ev.preventDefault()
                                              ev.stopPropagation()
                                              deleteExpense(e.id)
                                            }}
                                            className="btn btn-outline"
                                            style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                                          >
                                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                          </button>
                                        </Tooltip>
                                      </div>
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
                                style={{ backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.04)' : undefined, position: 'relative', paddingLeft: '2.5rem' }}
                              >
                                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>
                                  <input 
                                    type="checkbox"
                                    checked={selectedExpenseIds.includes(e.id)}
                                    onChange={() => {
                                      setSelectedExpenseIds(prev => 
                                        prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id]
                                      )
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </div>
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
                                  <div className="flex-row gap-2" style={{ width: '100%', justifyContent: 'flex-end' }}>
                                    <button
                                      onClick={(ev) => {
                                        ev.preventDefault()
                                        ev.stopPropagation()
                                        assignExpense(e.id, null)
                                      }}
                                      className="btn btn-outline"
                                      style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                                    >
                                      <UserX size={14} style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                    <button
                                      onClick={(ev) => {
                                        ev.preventDefault()
                                        ev.stopPropagation()
                                        deleteExpense(e.id)
                                      }}
                                      className="btn btn-outline"
                                      style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                                    >
                                      <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                    </button>
                                  </div>
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

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddPersonForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddPersonForm(false)
                setAddFlowStep(null)
                setNewPersonName('')
                setNewPersonPhone('')
                setNewPersonInviteEmail('')
                setNewEmailLookup(null)
              }}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="card modal-card card-glass"
              style={{ position: 'relative', width: '90%', maxWidth: '450px', padding: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div className="flex-between" style={{ alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {addFlowStep !== null && (
                    <button
                      onClick={() => {
                        setAddFlowStep(null)
                        setNewPersonName('')
                        setNewPersonPhone('')
                        setNewPersonInviteEmail('')
                        setNewEmailLookup(null)
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Adicionar Novo Integrante</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddPersonForm(false)
                    setAddFlowStep(null)
                    setNewPersonName('')
                    setNewPersonPhone('')
                    setNewPersonInviteEmail('')
                    setNewEmailLookup(null)
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* STEP 0: Ask if person has email */}
              {addFlowStep === null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)' }}>Esta pessoa tem e-mail?</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Isso define como vou conectar vocês no sistema.
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => { setAddFlowStep('email'); setNewPersonIsSystemUser(true) }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', padding: '1.25rem 0.75rem',
                        border: '1px solid var(--border)', borderRadius: '12px',
                        backgroundColor: 'var(--background)', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-light)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.backgroundColor = 'var(--background)' }}
                    >
                      <Mail size={24} strokeWidth={1.5} />
                      <span>Sim, tem e-mail</span>
                    </button>
                    <button
                      onClick={() => { setAddFlowStep('whatsapp'); setNewPersonIsSystemUser(false) }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', padding: '1.25rem 0.75rem',
                        border: '1px solid var(--border)', borderRadius: '12px',
                        backgroundColor: 'var(--background)', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--primary-light)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.backgroundColor = 'var(--background)' }}
                    >
                      <Phone size={24} strokeWidth={1.5} />
                      <span>Não, só WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1A: Email flow */}
              {addFlowStep === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>E-mail do integrante</span>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="input"
                      placeholder="nome@exemplo.com"
                      value={newPersonInviteEmail}
                      autoFocus
                      onChange={(e) => {
                        setNewPersonInviteEmail(e.target.value)
                        triggerEmailLookup(e.target.value, newLookupTimerRef, setNewEmailLookupLoading, setNewEmailLookup)
                      }}
                      style={{
                        padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.9rem', width: '100%',
                        borderColor: newEmailLookup?.found ? '#22c55e' : undefined,
                        transition: 'border-color 0.2s'
                      }}
                    />
                  </div>

                  {/* Lookup feedback */}
                  <AnimatePresence>
                    {newEmailLookupLoading && (
                      <motion.div key="lookup-loading" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.65rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                        Buscando usuário...
                      </motion.div>
                    )}

                    {!newEmailLookupLoading && newEmailLookup?.found && newEmailLookup.user && (
                      <motion.div key="lookup-found" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.65rem', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px' }}>
                        {newEmailLookup.user.avatar ? (
                          <img src={newEmailLookup.user.avatar} alt={newEmailLookup.user.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(34,197,94,0.4)' }} />
                        ) : (
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, color: '#22c55e' }}>
                            {newEmailLookup.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>{newEmailLookup.user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                            {newEmailLookup.alreadyLinked ? '⚠️ Já vinculado' : '✓ Usuário encontrado — convite será enviado'}
                          </div>
                        </div>
                        <UserCheck size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                      </motion.div>
                    )}

                    {!newEmailLookupLoading && newEmailLookup?.found === false && isValidEmail(newPersonInviteEmail) && (
                      <motion.div key="lookup-notfound" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.65rem', backgroundColor: 'rgba(234,179,8,0.07)', border: '1px dashed rgba(234,179,8,0.4)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          <Clock size={12} style={{ color: '#eab308', flexShrink: 0, marginTop: '1px' }} />
                          <span>Este e-mail ainda não tem conta no sistema. Preencha os dados abaixo — o convite será enviado quando a pessoa se cadastrar.</span>
                        </div>
                        <input
                          className="input"
                          placeholder="Nome ou apelido"
                          value={newPersonName}
                          autoFocus
                          onChange={(e) => setNewPersonName(e.target.value)}
                          style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem', width: '100%' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ position: 'relative' }}>
                            <Phone size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="tel"
                              className="input"
                              placeholder="WhatsApp com DDD (Opcional)"
                              value={newPersonPhone}
                              onChange={(e) => setNewPersonPhone(formatPhone(e.target.value))}
                              style={{ padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.9rem', width: '100%' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.3', paddingLeft: '0.25rem' }}>
                            📱 Opcional. Se informar, você poderá enviar os gastos por WhatsApp enquanto a pessoa não criar a conta.
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {(newEmailLookup?.found || (newEmailLookup?.found === false && isValidEmail(newPersonInviteEmail) && newPersonName.trim())) && !newEmailLookup?.alreadyLinked && (
                    <button className="btn btn-primary" onClick={addPerson} style={{ padding: '0.6rem', fontWeight: 700, fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}>
                      {newEmailLookup?.found ? `Convidar ${newEmailLookup.user?.name}` : 'Salvar Integrante'}
                    </button>
                  )}
                </div>
              )}

              {/* STEP 1B: WhatsApp flow */}
              {addFlowStep === 'whatsapp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    className="input"
                    placeholder="Nome ou apelido"
                    value={newPersonName}
                    autoFocus
                    onChange={(e) => setNewPersonName(e.target.value)}
                    style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem', width: '100%' }}
                  />
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      className="input"
                      placeholder="WhatsApp com DDD (Opcional)"
                      value={newPersonPhone}
                      onChange={(e) => setNewPersonPhone(formatPhone(e.target.value))}
                      style={{ padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.9rem', width: '100%' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', padding: '0.5rem 0.6rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                    📱 Você gerencia os gastos por ele. Poderá enviar relatórios pelo WhatsApp quando quiser.
                  </div>
                  <button className="btn btn-primary" onClick={addPerson} disabled={!newPersonName.trim()} style={{ padding: '0.6rem', fontWeight: 700, fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}>
                    Salvar Integrante
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingPersonId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={cancelEdit}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="card modal-card card-glass"
              style={{ position: 'relative', width: '90%', maxWidth: '450px', padding: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div className="flex-between" style={{ alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Editar Integrante</h3>
                <button
                  onClick={cancelEdit}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-col gap-3">
                <input
                  type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome" className="input"
                  style={{ fontSize: '0.9rem', padding: '0.55rem 0.75rem', width: '100%' }}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Este integrante já usa o app?</span>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.2rem',
                    gap: '0.2rem'
                  }}>
                    <button
                      onClick={() => setEditIsSystemUser(false)}
                      style={{
                        border: 'none',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: !editIsSystemUser ? 700 : 500,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: !editIsSystemUser ? 'var(--card)' : 'transparent',
                        color: !editIsSystemUser ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: !editIsSystemUser ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        height: 'auto'
                      }}
                    >
                      <Phone size={12} />
                      Não usa o app
                    </button>
                    <button
                      onClick={() => setEditIsSystemUser(true)}
                      style={{
                        border: 'none',
                        padding: '0.45rem',
                        fontSize: '0.8rem',
                        fontWeight: editIsSystemUser ? 700 : 500,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: editIsSystemUser ? 'var(--card)' : 'transparent',
                        color: editIsSystemUser ? 'var(--primary)' : 'var(--text-muted)',
                        boxShadow: editIsSystemUser ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        height: 'auto'
                      }}
                    >
                      <Mail size={12} />
                      Já usa o app
                    </button>
                  </div>
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px',
                  padding: '0.65rem',
                  lineHeight: '1.4'
                }}>
                  {!editIsSystemUser ? (
                    <>
                      <strong>📱 Não usa o app:</strong> Apenas salvo o número de celular. Você poderá enviar os gastos para esta pessoa pelo WhatsApp quando quiser.
                    </>
                  ) : (
                    <>
                      <strong>✉️ Já usa o app:</strong> Enviarei um convite por e-mail para vincular as contas e compartilhar os gastos automaticamente.
                    </>
                  )}
                </div>

                {!editIsSystemUser ? (
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="tel" value={editPhone} onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                      placeholder="WhatsApp com DDD (Opcional)" className="input"
                      style={{ fontSize: '0.9rem', padding: '0.55rem 0.75rem 0.55rem 2.2rem', width: '100%' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="email"
                        value={editInviteEmail}
                        onChange={(e) => {
                          setEditInviteEmail(e.target.value)
                          triggerEmailLookup(e.target.value, editLookupTimerRef, setEditEmailLookupLoading, setEditEmailLookup)
                        }}
                        placeholder="E-mail do integrante" className="input"
                        style={{
                          fontSize: '0.9rem', padding: '0.55rem 0.75rem 0.55rem 2.2rem', width: '100%',
                          borderColor: editEmailLookup?.found ? 'var(--success, #22c55e)' : undefined,
                          transition: 'border-color 0.2s'
                        }}
                      />
                    </div>
                    <AnimatePresence>
                      {editEmailLookupLoading && (
                        <motion.div key="edit-loading" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.65rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                          Buscando usuário...
                        </motion.div>
                      )}
                      {!editEmailLookupLoading && editEmailLookup?.found && editEmailLookup.user && (
                        <motion.div key="edit-found" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.65rem', backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px' }}>
                          {editEmailLookup.user.avatar ? (
                            <img src={editEmailLookup.user.avatar} alt={editEmailLookup.user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(34,197,94,0.4)' }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>
                              {editEmailLookup.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editEmailLookup.user.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>{editEmailLookup.alreadyLinked ? '⚠️ Já vinculado' : '✓ Usuário encontrado no sistema'}</div>
                          </div>
                          <UserCheck size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                        </motion.div>
                      )}
                      {!editEmailLookupLoading && editEmailLookup?.found === false && isValidEmail(editInviteEmail) && (
                        <motion.div key="edit-notfound" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.65rem', backgroundColor: 'rgba(234, 179, 8, 0.07)', border: '1px dashed rgba(234, 179, 8, 0.4)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          <Clock size={12} style={{ color: '#eab308', flexShrink: 0, marginTop: '1px' }} />
                          <span>Este e-mail ainda não tem conta. O convite será enviado assim que a pessoa se cadastrar.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <div className="flex-row gap-2" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Cancelar
                  </button>
                  <button onClick={() => saveEditPerson(editingPersonId)} disabled={savingEdit} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    {savingEdit ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BulkActionsBar
        selectedCount={selectedExpenseIds.length}
        subtitle="Ações em lote para este integrante"
        isVisible={selectedExpenseIds.length > 0}
      >
        <button
          onClick={handleBulkUnassign}
          className="btn btn-outline"
        >
          <UserX size={14} style={{ color: 'var(--text-muted)' }} />
          Desatribuir
        </button>
        <button
          onClick={handleBulkDelete}
          className="btn btn-danger"
        >
          <Trash2 size={14} />
          Excluir
        </button>
      </BulkActionsBar>
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
