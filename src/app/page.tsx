'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Upload, Trash2, UserPlus, Check, ChevronRight, PieChart, CreditCard, Users, Settings, X, Calendar, Zap, LogOut, Shield, Loader2, Search, Bell, UserCheck, UserX as UserXIcon, ExternalLink } from 'lucide-react'
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

interface Invite {
  id: string
  name: string
  ownerName?: string
  ownerEmail?: string
  linkStatus: string
}

interface SharedExpenseSummary {
  personName: string
  ownerName: string
  totalAmount: number
  expenseCount: number
  month: string
  expenses: any[]
}

function HomeContent() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonIsSystemUser, setNewPersonIsSystemUser] = useState(false)
  const [newPersonPhone, setNewPersonPhone] = useState('')
  const [newPersonInviteEmail, setNewPersonInviteEmail] = useState('')
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showAddManual, setShowAddManual] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [manualExpense, setManualExpense] = useState({ date: '', description: '', amount: '', personId: '', card: '' })
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'card'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpenseSummary[]>([])
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null)
  const [selectedSharedGroup, setSelectedSharedGroup] = useState<SharedExpenseSummary | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, searchTerm])

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

      // Fetch invites and shared expenses in parallel (non-blocking)
      try {
        const [invitesRes, sharedRes] = await Promise.all([
          fetch(`/api/invites?t=${t}`),
          fetch(`/api/shared-expenses?t=${t}`)
        ])
        if (invitesRes.ok) {
          const invData = await invitesRes.json()
          setPendingInvites(Array.isArray(invData) ? invData.filter((i: Invite) => i.linkStatus === 'PENDING') : [])
        }
        if (sharedRes.ok) {
          const sharedData = await sharedRes.json()
          setSharedExpenses(Array.isArray(sharedData) ? sharedData : [])
        }
      } catch (e) {
        console.warn('Erro ao buscar convites/gastos compartilhados:', e)
      }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('month', selectedMonth || currentMonthStr)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'PDF importado com sucesso!')
        fetchData()
      } else {
        toast.error(data.error || 'Erro ao processar PDF')
      }
    } catch (error) {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      // Resetar o input
      e.target.value = ''
    }
  }

  const toggleSelectExpense = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const unassignedIds = unassignedExpenses.map(e => e.id)
    const allSelected = unassignedIds.length > 0 && unassignedIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !unassignedIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...unassignedIds])))
    }
  }

  const assignExpense = async (expenseId: string, personId: string | null) => {
    let idsToUpdate = [expenseId]
    if (selectedIds.length > 0) {
      idsToUpdate = Array.from(new Set([...selectedIds, expenseId]))
    }

    const toastId = toast.loading(
      idsToUpdate.length > 1 
        ? `Atribuindo ${idsToUpdate.length} despesas...` 
        : 'Atribuindo despesa...'
    )

    try {
      const promises = idsToUpdate.map(id =>
        fetch(`/api/expenses/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId }),
        })
      )

      const results = await Promise.all(promises)
      const allOk = results.every(res => res.ok)

      if (allOk) {
        toast.success(
          idsToUpdate.length > 1 
            ? `${idsToUpdate.length} despesas atribuídas com sucesso!` 
            : 'Despesa atribuída com sucesso!',
          { id: toastId }
        )
        setExpenses(prev => 
          prev.map(e => idsToUpdate.includes(e.id) ? { ...e, personId } : e)
        )
        setSelectedIds([])
      } else {
        toast.error('Erro ao atribuir algumas despesas.', { id: toastId })
        fetchData()
      }
    } catch (error) {
      console.error('Erro ao atribuir despesas:', error)
      toast.error('Erro de conexão ao atribuir despesas.', { id: toastId })
    }
  }

  const deleteExpense = async (id: string) => {
    setConfirmDialog({
      message: 'Tem certeza que deseja excluir esta despesa?',
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

  const addPerson = async () => {
    const trimmedName = newPersonName.trim()
    if (!trimmedName) return

    // Validação de duplicidade no frontend
    const exists = people.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
      toast.error('Uma pessoa com este nome já está cadastrada.')
      return
    }

    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: newPersonIsSystemUser ? null : (newPersonPhone.trim() || null),
          inviteEmail: newPersonIsSystemUser ? (newPersonInviteEmail.trim() || null) : null,
          isSystemUser: newPersonIsSystemUser
        }),
      })
      if (res.ok) {
        const person = await res.json()
        setPeople([...people, person])
        setNewPersonName('')
        setNewPersonPhone('')
        setNewPersonInviteEmail('')
        setNewPersonIsSystemUser(false)
        setShowAddPerson(false)
        toast.success(`Pessoa "${trimmedName}" adicionada com sucesso!`)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Erro ao adicionar pessoa')
      }
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error)
      toast.error('Erro de conexão ao adicionar pessoa')
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

  const respondToInvite = async (inviteId: string, action: 'accept' | 'reject') => {
    setRespondingInviteId(inviteId)
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: inviteId, action })
      })
      if (res.ok) {
        toast.success(action === 'accept' ? 'Convite aceito!' : 'Convite recusado.')
        setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao responder convite')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setRespondingInviteId(null)
    }
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

  const sortExpensesHelper = (exps: Expense[]) => {
    return [...exps].sort((a, b) => {
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
        if (dateA.month !== dateB.month) {
          comparison = dateA.month - dateB.month
        } else {
          comparison = dateA.day - dateB.day
        }
      } else if (sortField === 'description') {
        comparison = a.description.localeCompare(b.description)
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount
      } else if (sortField === 'card') {
        comparison = (a.card || '').localeCompare(b.card || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const unassignedExpensesAll = filteredExpenses.filter(e => !e.personId)
  const unassignedTotal = unassignedExpensesAll.reduce((sum, e) => sum + e.amount, 0)

  const searchedUnassignedExpenses = unassignedExpensesAll.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.card || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.amount.toString().includes(searchTerm) ||
    e.date.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unassignedExpenses = sortExpensesHelper(searchedUnassignedExpenses)
  const itemsPerPage = 15
  const totalPages = Math.ceil(unassignedExpenses.length / itemsPerPage)
  const paginatedUnassignedExpenses = unassignedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
  const prevGrandTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0)
  const grandTotalDiff = prevGrandTotal > 0 ? ((grandTotal - prevGrandTotal) / prevGrandTotal) * 100 : 0

  const totals = people.map(p => {
    const total = filteredExpenses
      .filter(e => e.personId === p.id)
      .reduce((sum, e) => sum + e.amount, 0)
    return { ...p, total }
  })

  const formatMonthName = (m: string) => {
    const [year, month] = m.split('-')
    const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthsPt[parseInt(month) - 1]} / ${year}`
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      // Ajuste de timezone para evitar que 15/05 vire 14/05
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

      {/* Modals and Forms */}
      <AnimatePresence>
        {uploading && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
              style={{ 
                position: 'relative', 
                width: '90%', 
                maxWidth: '400px', 
                padding: '2.5rem 2rem', 
                zIndex: 100000, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '4rem', 
                height: '4rem', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary-light)', 
                color: 'var(--primary)', 
                marginBottom: '1.5rem' 
              }}>
                <Loader2 size={36} className="animate-spin" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
                Processando Fatura
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                A inteligência artificial do Gemini está analisando o PDF para extrair as transações. Isso pode levar alguns segundos...
              </p>
            </motion.div>
          </div>
        )}

        {showAddPerson && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                setNewPersonName('')
                setNewPersonPhone('')
                setNewPersonInviteEmail('')
                setNewPersonIsSystemUser(false)
                setShowAddPerson(false)
              }}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
              style={{ position: 'relative', width: '90%', maxWidth: '420px', padding: '2rem', zIndex: 10000 }}
            >
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                  Nova Pessoa
                </h3>
                <button 
                  onClick={() => {
                    setNewPersonName('')
                    setNewPersonPhone('')
                    setNewPersonInviteEmail('')
                    setNewPersonIsSystemUser(false)
                    setShowAddPerson(false)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  className="input" 
                  placeholder="Nome da pessoa" 
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  autoFocus
                />
                
                {/* Toggle de Tipo de Membro */}
                <div className="flex-row gap-2 flex-y-center" style={{ padding: '0.25rem 0' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Membro do sistema?</span>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={newPersonIsSystemUser} 
                      onChange={(e) => setNewPersonIsSystemUser(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '2.5rem',
                      height: '1.4rem',
                      backgroundColor: newPersonIsSystemUser ? 'var(--primary)' : 'var(--border)',
                      borderRadius: '999px',
                      position: 'relative',
                      transition: 'background-color 0.2s'
                    }}>
                      <div style={{
                        width: '1.1rem',
                        height: '1.1rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '0.15rem',
                        left: newPersonIsSystemUser ? '1.25rem' : '0.15rem',
                        transition: 'left 0.2s'
                      }} />
                    </div>
                  </label>
                </div>

                {!newPersonIsSystemUser ? (
                  <input 
                    className="input" 
                    placeholder="WhatsApp (ex: 11999999999)" 
                    value={newPersonPhone}
                    onChange={(e) => setNewPersonPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  />
                ) : (
                  <input 
                    type="email"
                    className="input" 
                    placeholder="E-mail de convite" 
                    value={newPersonInviteEmail}
                    onChange={(e) => setNewPersonInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  />
                )}

                <button className="btn btn-primary" onClick={addPerson} style={{ marginTop: '0.5rem', padding: '0.6rem' }}>Adicionar Integrante</button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddManual && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddManual(false)}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
              style={{ position: 'relative', width: '90%', maxWidth: '480px', padding: '2rem', zIndex: 10000 }}
            >
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Plus size={20} style={{ color: 'var(--primary)' }} />
                  Gasto Manual
                </h3>
                <button 
                  onClick={() => setShowAddManual(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</label>
                  <input 
                    type="date"
                    className="input" 
                    value={manualExpense.date}
                    onChange={(e) => setManualExpense({ ...manualExpense, date: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</label>
                  <input 
                    className="input" 
                    placeholder="R$ 0,00"
                    inputMode="numeric"
                    value={manualExpense.amount ? `R$ ${manualExpense.amount}` : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (!raw) {
                        setManualExpense({ ...manualExpense, amount: '' })
                        return
                      }
                      const cents = parseInt(raw, 10)
                      const formatted = (cents / 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                      setManualExpense({ ...manualExpense, amount: formatted })
                    }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
                  <input 
                    className="input" 
                    placeholder="Ex: Aluguel, Mercado, etc." 
                    value={manualExpense.description}
                    onChange={(e) => setManualExpense({ ...manualExpense, description: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instituição / Cartão (opcional)</label>
                  <input 
                    className="input" 
                    placeholder="Ex: Nubank, Itaú, Dinheiro..." 
                    value={manualExpense.card || ''}
                    onChange={(e) => setManualExpense({ ...manualExpense, card: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Atribuir a (opcional)</label>
                  <div className="flex-row gap-2 flex-wrap">
                    <button
                      className={!manualExpense.personId ? "btn btn-primary" : "btn btn-outline"}
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px' }}
                      onClick={() => setManualExpense({ ...manualExpense, personId: '' })}
                    >
                      Pendente
                    </button>
                    {people.map(p => (
                      <button
                        key={p.id}
                        className={manualExpense.personId === p.id ? "btn btn-primary" : "btn btn-outline"}
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px' }}
                        onClick={() => setManualExpense({ ...manualExpense, personId: p.id })}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                  {people.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem', display: 'block' }}>
                      Nenhuma pessoa cadastrada
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-row gap-3" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowAddManual(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={async () => {
                  if (!manualExpense.date) {
                    toast.error('Selecione uma data')
                    return
                  }
                  if (!manualExpense.description.trim()) {
                    toast.error('Digite uma descrição')
                    return
                  }
                  const parsedAmount = parseFloat(manualExpense.amount.replace(/\./g, '').replace(',', '.'))
                  if (!manualExpense.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
                    toast.error('Digite um valor válido')
                    return
                  }
                  const res = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      date: manualExpense.date,
                      description: manualExpense.description,
                      amount: parsedAmount,
                      personId: manualExpense.personId || null,
                      card: manualExpense.card || null,
                      month: activeMonth,
                    }),
                  })
                  if (res.ok) {
                    toast.success('Gasto adicionado!')
                    fetchData()
                    setShowAddManual(false)
                    setManualExpense({ date: '', description: '', amount: '', personId: '', card: '' })
                  } else {
                    const errData = await res.json().catch(() => ({}))
                    toast.error(errData.error || 'Erro ao salvar gasto')
                  }
                }}>Salvar Gasto</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Month Toolbar / Selector */}
      <div className="month-toolbar">
        <div className="month-toolbar-header">
          <span className="month-toolbar-title">
            <Calendar size={14} />
            Mês de Referência
          </span>
          <div className="flex-row gap-2">
            <button 
              className="btn btn-outline" 
              onClick={() => setShowAddManual(true)} 
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.725rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}
            >
              <Plus size={12} style={{ marginRight: '0.2rem' }} />
              Gasto Manual
            </button>
            <label 
              className="btn btn-primary" 
              style={{ 
                margin: 0, 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.725rem', 
                cursor: 'pointer',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.03em'
              }}
            >
              <Upload size={12} style={{ marginRight: '0.2rem' }} />
              {uploading ? 'Processando...' : 'Importar PDF'}
              <input type="file" hidden accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Carregando dados do painel...</div>
      ) : (
        <>
          {/* Banner de Convites Pendentes */}
          {pendingInvites.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card card-glass"
              style={{ 
                padding: '1.25rem 1.5rem', 
                marginBottom: '1.5rem', 
                borderLeft: '4px solid var(--warning)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div className="flex-between flex-wrap gap-3" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                    color: 'var(--warning)' 
                  }}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Convites de Vínculo Pendentes</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                      Outros usuários gostariam de vincular seus gastos a você. Ao aceitar, as despesas deles atribuídas a você aparecerão no seu painel.
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingInvites.map(invite => (
                  <div 
                    key={invite.id} 
                    className="flex-between flex-wrap gap-3" 
                    style={{ 
                      padding: '0.75rem 1rem', 
                      backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {invite.ownerName} ({invite.ownerEmail})
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Convidou você como &quot;{invite.name}&quot;
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          fontSize: '0.8rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.3rem',
                          borderColor: 'var(--danger)',
                          color: 'var(--danger)'
                        }}
                        disabled={respondingInviteId === invite.id}
                        onClick={() => respondToInvite(invite.id, 'reject')}
                      >
                        <UserXIcon size={14} /> Recusar
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          fontSize: '0.8rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.3rem' 
                        }}
                        disabled={respondingInviteId === invite.id}
                        onClick={() => respondToInvite(invite.id, 'accept')}
                      >
                        <UserCheck size={14} /> Aceitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dashboard Metrics and Division Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}
          >
            
            {/* Left Metrics Column */}
            <div className="flex-col gap-3">
              
              <div className="card card-interactive card-glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div className="flex-y-center gap-2">
                    <PieChart className="text-primary" size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total da Fatura</h3>
                  </div>
                  {prevGrandTotal > 0 && (
                    <span className={`badge ${grandTotalDiff > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '20px', fontWeight: 600 }}>
                      {grandTotalDiff > 0 ? `▲ +${grandTotalDiff.toFixed(0)}%` : `▼ ${grandTotalDiff.toFixed(0)}%`}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                  R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: 0 }}>
                  Soma de todas as despesas em {formatMonthName(activeMonth)}
                </p>
              </div>

              <div className="card card-interactive card-glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="flex-y-center gap-2" style={{ marginBottom: '0.5rem' }}>
                  <Users className="text-primary" size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendentes de Atribuição</h3>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: unassignedTotal > 0 ? 'var(--danger)' : 'var(--success)', letterSpacing: '-0.02em' }}>
                  R$ {unassignedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: 0 }}>
                  Gastos que ainda não pertencem a ninguém
                </p>
              </div>

              <div className="card card-interactive card-glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                  <div className="flex-y-center gap-2">
                    <CreditCard className="text-primary" size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Integrantes ({people.length})</h3>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    onClick={() => setShowAddPerson(true)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <UserPlus size={14} />
                    Adicionar
                  </button>
                </div>
                <div className="flex-row gap-2 flex-wrap" style={{ marginTop: '0.25rem' }}>
                  <AnimatePresence mode="popLayout">
                    {people.map(p => (
                      <motion.div 
                        key={p.id} 
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="badge badge-blue"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          paddingRight: '0.4rem'
                        }}
                      >
                        {p.name}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            deletePerson(p.id)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.6,
                            transition: 'opacity 0.2s',
                            position: 'relative',
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                          title={`Excluir ${p.name}`}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {people.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Nenhuma pessoa cadastrada
                    </span>
                  )}
                </div>
              </div>

              {/* Card de Gastos Compartilhados Comigo */}
              {sharedExpenses.length > 0 && (
                <div className="card card-interactive card-glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-y-center gap-2" style={{ marginBottom: '1rem' }}>
                    <Users className="text-primary" size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Gastos Compartilhados Comigo
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {sharedExpenses.map((se, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedSharedGroup(se)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.5rem',
                          margin: '0 -0.5rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Clique para ver os gastos detalhados"
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{se.ownerName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Como &quot;{se.personName}&quot; • {se.expenseCount} despesas
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            R$ {se.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatMonthName(se.month)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Division breakdown widget */}
            <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', margin: 0 }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                Divisão de Gastos da Fatura
              </h3>
              
              {people.length > 0 ? (
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', flex: 1, marginTop: '1rem' }}>
                  {grandTotal > 0 && (
                    <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
                      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="8" style={{ opacity: 0.3 }} />
                        {(() => {
                          let cumulativePercent = 0;
                          const palette = ['var(--primary)', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                          return totals.map((p, index) => {
                            const percent = grandTotal > 0 ? p.total / grandTotal : 0;
                            const strokeLength = percent * 251.33;
                            const strokeOffset = 251.33 - strokeLength;
                            const rotation = cumulativePercent * 360;
                            cumulativePercent += percent;
                            const sliceColor = palette[index % palette.length];

                            if (percent === 0) return null;

                            return (
                              <motion.circle
                                key={p.id}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={sliceColor}
                                strokeWidth="8"
                                strokeDasharray="251.33"
                                strokeDashoffset={strokeOffset}
                                style={{ transformOrigin: '50px 50px', transform: `rotate(${rotation}deg)` }}
                                initial={{ strokeDashoffset: 251.33 }}
                                animate={{ strokeDashoffset: strokeOffset }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', letterSpacing: '0.05em' }}>Total</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)' }}>
                          R$ {grandTotal > 9999 ? `${(grandTotal/1000).toFixed(1)}k` : grandTotal.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex-col gap-3" style={{ flex: 1, minWidth: '220px' }}>
                    {totals.map((p, index) => {
                      const palette = ['var(--primary)', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                      const personColor = palette[index % palette.length];
                      return (
                        <div key={p.id} className="flex-col gap-1">
                          <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: personColor, display: 'inline-block' }} />
                              {p.name}
                            </span>
                            <span style={{ fontWeight: 700, color: personColor }}>
                              R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${grandTotal > 0 ? (p.total / grandTotal) * 100 : 0}%` }}
                              style={{ height: '100%', backgroundColor: personColor, borderRadius: '3px' }}
                            />
                          </div>
                          <div className="flex-between" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span>{grandTotal > 0 ? ((p.total / grandTotal) * 100).toFixed(1) : 0}% do total</span>
                            <span>{filteredExpenses.filter(e => e.personId === p.id).length} transações</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '3rem 0', fontStyle: 'italic', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Cadastre pessoas para ver a divisão de gastos.
                </div>
              )}
            </div>

          </motion.div>

          {/* Invite Banner */}
          {pendingInvites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <div className="card card-glass" style={{
                padding: '1.25rem 1.5rem',
                borderLeft: '4px solid var(--primary)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0.02) 100%)'
              }}>
                <div className="flex-row flex-y-center gap-3" style={{ marginBottom: pendingInvites.length > 0 ? '0.75rem' : 0 }}>
                  <div style={{
                    width: '2rem', height: '2rem', borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Bell size={14} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                      {pendingInvites.length === 1 ? 'Você tem 1 convite pendente' : `Você tem ${pendingInvites.length} convites pendentes`}
                    </span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                      Alguém adicionou você como integrante nos gastos. Aceite para visualizar.
                    </p>
                  </div>
                </div>
                <div className="flex-col gap-2" style={{ marginTop: '0.5rem' }}>
                  {pendingInvites.map(invite => (
                    <div key={invite.id} className="flex-between flex-y-center" style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'var(--card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}>
                      <div className="flex-col">
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--foreground)' }}>
                          {invite.ownerName || 'Usuário'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          adicionou você como “{invite.name}”
                        </span>
                      </div>
                      <div className="flex-row gap-2">
                        <button
                          onClick={() => respondToInvite(invite.id, 'reject')}
                          disabled={respondingInviteId === invite.id}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <UserXIcon size={12} /> Recusar
                        </button>
                        <button
                          onClick={() => respondToInvite(invite.id, 'accept')}
                          disabled={respondingInviteId === invite.id}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <UserCheck size={12} /> Aceitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Shared Expenses Card */}
          {sharedExpenses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{ marginBottom: '2rem' }}
            >
              <div className="card card-glass" style={{ padding: '1.5rem 2rem' }}>
                <div className="flex-between flex-y-center" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div className="flex-row flex-y-center gap-2">
                    <ExternalLink size={16} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>Gastos Compartilhados Comigo</h3>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem',
                    borderRadius: '999px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                    textTransform: 'uppercase', letterSpacing: '0.03em'
                  }}>
                    {sharedExpenses.length} vínculo{sharedExpenses.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex-col gap-3">
                  {sharedExpenses.map((se, idx) => {
                    const formatMonth = (m: string) => {
                      const [y, mo] = m.split('-')
                      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                      return `${months[parseInt(mo) - 1]}/${y}`
                    }
                    return (
                      <div key={idx} className="flex-between flex-y-center" style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}>
                        <div className="flex-col">
                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--foreground)' }}>
                            {se.ownerName}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {se.expenseCount} gasto{se.expenseCount > 1 ? 's' : ''} · {formatMonth(se.month)}
                          </span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                          R$ {se.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )
                  })}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                    Total: <strong style={{ color: 'var(--foreground)' }}>R$ {sharedExpenses.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Detailed Expenses Table */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="card" 
            style={{ padding: '2rem' }}
          >
            <div className="flex-between flex-wrap gap-4" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Despesas Pendentes ({unassignedExpenses.length})</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Aguardando atribuição de integrantes
                </p>
              </div>

              {/* Barra de Filtro/Pesquisa */}
              <div className="table-filter-input-wrapper">
                <Search size={16} className="table-filter-icon" />
                <input 
                  type="text"
                  placeholder="Pesquisar despesas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="table-filter-input"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={paginatedUnassignedExpenses.length > 0 && paginatedUnassignedExpenses.every(e => selectedIds.includes(e.id))}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                      />
                    </th>
                    <th 
                      onClick={() => handleSort('date')}
                      className="th-sortable"
                      style={{ width: '12%' }}
                    >
                      <div className="flex-row flex-y-center">
                        Data {renderSortIcon('date')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('card')}
                      className="th-sortable"
                      style={{ width: '12%' }}
                    >
                      <div className="flex-row flex-y-center">
                        Instituição {renderSortIcon('card')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('description')}
                      className="th-sortable"
                      style={{ width: '33%' }}
                    >
                      <div className="flex-row flex-y-center">
                        Descrição {renderSortIcon('description')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('amount')}
                      className="th-sortable"
                      style={{ width: '15%' }}
                    >
                      <div className="flex-row flex-y-center">
                        Valor {renderSortIcon('amount')}
                      </div>
                    </th>
                    <th style={{ width: '17%' }}>Atribuir a</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedUnassignedExpenses.map(e => {
                      const isNeg = e.amount < 0
                      const isSelected = selectedIds.includes(e.id)
                      return (
                        <motion.tr 
                          key={e.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.2 }}
                          style={{ 
                            backgroundColor: isSelected 
                              ? 'rgba(219, 20, 96, 0.05)' 
                              : (isNeg ? 'rgba(16, 185, 129, 0.02)' : 'transparent'),
                            borderLeft: isSelected ? '3px solid var(--primary)' : undefined
                          }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(ev) => ev.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectExpense(e.id)}
                              style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                            />
                          </td>
                          <td style={{ color: isNeg ? 'var(--success)' : 'inherit', fontWeight: isNeg ? 600 : 400 }}>{formatDate(e.date)}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {e.card ? (
                              <span style={{ 
                                background: 'var(--background)', 
                                padding: '0.2rem 0.4rem', 
                                borderRadius: '4px', 
                                border: '1px solid var(--border)',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem'
                              }}>
                                {e.card}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: isNeg ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {e.description}
                              {isNeg && (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                  Estorno
                                </span>
                              )}
                            </div>
                            {e.isManual && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Manual</span>}
                          </td>
                          <td style={{ fontWeight: 700, color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                            {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </td>
                          <td>
                            <div className="flex-row gap-1 flex-wrap" style={{ padding: '0.2rem 0' }}>
                              {people.map(p => (
                                <button
                                  key={p.id}
                                  className="btn btn-outline"
                                  style={{ 
                                    padding: '0.25rem 0.5rem', 
                                    fontSize: '0.75rem', 
                                    borderRadius: '6px'
                                  }}
                                  onClick={() => assignExpense(e.id, p.id)}
                                >
                                  {p.name}
                                </button>
                              ))}
                              {people.length === 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Sem pessoas
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={(ev) => {
                                ev.preventDefault()
                                deleteExpense(e.id)
                              }} 
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--danger)', 
                                cursor: 'pointer', 
                                padding: '6px', 
                                display: 'inline-flex',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '6px',
                                transition: 'all 0.15s ease'
                              }}
                              title="Excluir despesa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                  {paginatedUnassignedExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nenhuma despesa pendente para o mês selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-expenses-list">
              <AnimatePresence mode="popLayout">
                {paginatedUnassignedExpenses.map(e => {
                  const isNeg = e.amount < 0
                  const isSelected = selectedIds.includes(e.id)
                  
                  const getInitials = (name: string) => {
                    const parts = name.trim().split(/\s+/)
                    if (parts.length >= 2) {
                      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
                    }
                    return name.substring(0, 2).toUpperCase()
                  }

                  return (
                    <motion.div 
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`expense-mobile-card ${isSelected ? 'selected' : ''}`}
                      style={{ backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.02)' : undefined }}
                    >
                      <div className="expense-mobile-card-header">
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectExpense(e.id)}
                            style={{ cursor: 'pointer', transform: 'scale(1.15)', marginTop: '0.2rem' }}
                          />
                          <div className="flex-col" style={{ gap: '0.25rem' }}>
                            <span className="expense-mobile-card-title">{e.description}</span>
                            <div className="expense-mobile-card-meta">
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
                              {e.isManual && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Manual</span>}
                            </div>
                          </div>
                        </div>
                        <div className="expense-mobile-card-amount" style={{ color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                          {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </div>
                      </div>

                      <div className="expense-mobile-card-actions">
                        <div className="expense-mobile-card-assign">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginRight: '0.25rem' }}>Atribuir:</span>
                          {people.map(p => (
                            <button
                              key={p.id}
                              className="btn-avatar-assign"
                              title={`Atribuir a ${p.name}`}
                              onClick={() => assignExpense(e.id, p.id)}
                            >
                              {getInitials(p.name)}
                            </button>
                          ))}
                          {people.length === 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sem pessoas</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteExpense(e.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px'
                          }}
                          title="Excluir despesa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {paginatedUnassignedExpenses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  Nenhuma despesa pendente para o mês selecionado.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex-row flex-y-center" style={{ justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
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
          </motion.div>
        </>
      )}

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

      {/* Modal de Detalhes de Gastos Compartilhados */}
      <AnimatePresence>
        {selectedSharedGroup && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedSharedGroup(null)}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
              style={{ position: 'relative', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem', zIndex: 10000 }}
            >
              <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                  Gastos de {selectedSharedGroup.ownerName}
                </h3>
                <button 
                  onClick={() => setSelectedSharedGroup(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Atribuídos a você como: <strong>&quot;{selectedSharedGroup.personName}&quot;</strong>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total no mês: <strong style={{ color: 'var(--primary)' }}>R$ {selectedSharedGroup.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({selectedSharedGroup.expenseCount} transações)
                </span>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Data</th>
                      <th style={{ width: '50%' }}>Descrição</th>
                      <th style={{ width: '25%', textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSharedGroup.expenses.map((exp: any) => (
                      <tr key={exp.id}>
                        <td>{formatDate(exp.date)}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{exp.description}</div>
                          {exp.card && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{exp.card}</span>}
                        </td>
                        <td style={{ fontWeight: 700, textAlign: 'right' }}>
                          R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => setSelectedSharedGroup(null)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Carregando painel...</div>}>
      <HomeContent />
    </Suspense>
  )
}
