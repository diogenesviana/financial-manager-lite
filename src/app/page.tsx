'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Upload, Trash2, UserPlus, Check, ChevronRight, PieChart, CreditCard, Users, Settings, X, Calendar, Zap, LogOut, Shield, Loader2, Search, Bell, UserCheck, UserX as UserXIcon, ExternalLink, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import Tooltip from '@/components/Tooltip'
import MonthSelector from '@/components/MonthSelector'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'

import MainLayout from '@/components/MainLayout'
import PageLoader from '@/components/PageLoader'

interface Person {
  id: string
  name: string
  userId?: string
  linkedUserId?: string | null
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

interface Invite {
  id: string
  name: string
  ownerName?: string
  ownerEmail?: string
  ownerAvatar?: string | null
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

const getTodayStr = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultDateForMonth = (monthStr: string) => {
  if (!monthStr) return getTodayStr()
  const today = new Date()
  const todayMonthStr = today.toISOString().substring(0, 7) // "YYYY-MM"
  if (monthStr === todayMonthStr) {
    return getTodayStr()
  }
  return `${monthStr}-01`
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
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
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7))
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [manualExpense, setManualExpense] = useState({ date: getTodayStr(), description: '', amount: '', personId: '', card: '' })
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dbMonths, setDbMonths] = useState<string[]>([])
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'card'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpenseSummary[]>([])
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null)
  const [selectedSharedGroup, setSelectedSharedGroup] = useState<SharedExpenseSummary | null>(null)
  const [divisionPage, setDivisionPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
    setDivisionPage(1)
  }, [selectedMonth, searchTerm])

  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"

  const fetchData = async (monthToFetch?: string) => {
    setLoading(true)
    try {
      const t = Date.now()
      const targetMonth = monthToFetch || selectedMonth || currentMonthStr
      const [peopleRes, expensesRes, monthsRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?month=${targetMonth}&t=${t}`),
        fetch(`/api/expenses/months?t=${t}`)
      ])
      const peopleData = await peopleRes.json()
      const expensesData = await expensesRes.json()
      const monthsData = monthsRes.ok ? await monthsRes.json() : []
      setPeople(Array.isArray(peopleData) ? peopleData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setDbMonths(Array.isArray(monthsData) ? monthsData : [])

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

  const handleSharedAction = async (expenseId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch(`/api/shared-expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        toast.success(action === 'ACCEPT' ? 'Gasto aceito!' : 'Gasto recusado!')
        // Reload all data
        await fetchData(selectedMonth)
        
        // Update selected group if it's open
        if (selectedSharedGroup) {
          const t = Date.now()
          const updatedShared = await fetch(`/api/shared-expenses?t=${t}`).then(r => r.json())
          const newGroup = updatedShared.find((sg: any) => sg.ownerName === selectedSharedGroup.ownerName && sg.month === selectedSharedGroup.month)
          setSelectedSharedGroup(newGroup || null)
        }
      } else {
        toast.error('Erro ao atualizar gasto')
      }
    } catch {
      toast.error('Erro de conexão')
    }
  }

  useEffect(() => {
    fetchData(selectedMonth)
  }, [selectedMonth])

  useEffect(() => {
    if (selectedMonth) {
      setManualExpense(prev => ({
        ...prev,
        date: getDefaultDateForMonth(selectedMonth)
      }))
    }
  }, [selectedMonth])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'PDF importado com sucesso!')
        fetchData(selectedMonth)
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
    ...dbMonths
  ])).sort().reverse()

  const activeMonth = selectedMonth || currentMonthStr

  // Filter expenses by active month
  const filteredExpenses = expenses.filter(e => e.month === activeMonth)

  const sortExpensesHelper = (exps: Expense[]) => {
    return [...exps].sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        const parseDate = (dStr: any) => {
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
        comparison = parseDate(a.date) - parseDate(b.date)
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

  const pendingAllMonths = expenses.filter(e => !e.personId)
  const pendingAllMonthsTotal = pendingAllMonths.reduce((sum, e) => sum + e.amount, 0)

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
  }).sort((a, b) => b.total - a.total)

  const divisionItemsPerPage = 3
  const divisionTotalPages = Math.ceil(totals.length / divisionItemsPerPage)
  const paginatedTotals = totals.slice(
    (divisionPage - 1) * divisionItemsPerPage,
    divisionPage * divisionItemsPerPage
  )

  const formatMonthName = (m: string) => {
    const [year, month] = m.split('-')
    const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthsPt[parseInt(month) - 1]} / ${year}`
  }

  const formatMonthShorthand = (m: string) => {
    if (!m) return ''
    const [year, month] = m.split('-')
    const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const shortYear = year.substring(2)
    return `${monthsPt[parseInt(month) - 1]} / ${shortYear}`
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





      {loading ? (
        <PageLoader title="Carregando dados do painel..." description="Buscando suas transações e dados atualizados." />
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
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                  color: 'var(--warning)',
                  flexShrink: 0
                }}>
                  <Bell size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: '1.3' }}>Convites de Vínculo Pendentes</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0', lineHeight: '1.4' }}>
                    Outros usuários gostariam de vincular seus gastos a você. Ao aceitar, as despesas deles atribuídas a você aparecerão no seu painel.
                  </p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 auto', minWidth: '200px' }}>
                      {invite.ownerAvatar ? (
                        <img 
                          src={invite.ownerAvatar} 
                          alt={invite.ownerName}
                          style={{
                            width: '2.2rem',
                            height: '2.2rem',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1px solid var(--border)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2.2rem',
                          height: '2.2rem',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          flexShrink: 0
                        }}>
                          {invite.ownerName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.25rem' }}>
                          {invite.ownerName} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({invite.ownerEmail})</span>
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          {/* Page Title & Month Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Painel Geral</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                Acompanhe o resumo da fatura e a divisão de gastos.
              </p>
            </div>
            
            <MonthSelector activeMonth={activeMonth} availableMonths={availableMonths} onMonthChange={setSelectedMonth} />
          </div>

          {/* Dashboard Metrics and Division Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="dashboard-grid"
          >
            
            {/* Left Metrics Column */}
            <div className="flex-col gap-3">
              {/* Row 1: Total da Fatura & Pendentes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div className="flex-y-center gap-1.5">
                      <PieChart className="text-primary" size={15} color="var(--primary)" />
                      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total da Fatura</h3>
                    </div>
                    {prevGrandTotal > 0 && (
                      <span className={`badge ${grandTotalDiff > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '20px', fontWeight: 600 }}>
                        {grandTotalDiff > 0 ? `▲ +${grandTotalDiff.toFixed(0)}%` : `▼ ${grandTotalDiff.toFixed(0)}%`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                    R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                    Soma das despesas em {formatMonthShorthand ? formatMonthShorthand(activeMonth) : formatMonthName(activeMonth)}
                  </p>
                </div>

                <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="flex-y-center gap-1.5" style={{ marginBottom: '0.35rem' }}>
                    <Users className="text-primary" size={15} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendentes</h3>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: unassignedTotal > 0 ? 'var(--danger)' : 'var(--success)', letterSpacing: '-0.02em' }}>
                    R$ {unassignedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {pendingAllMonths.length > unassignedExpensesAll.length && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginTop: '0.15rem' }}>
                      ⚠️ + R$ {(pendingAllMonthsTotal - unassignedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em outros meses
                    </span>
                  )}
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                    Gastos sem atribuição
                  </p>
                </div>
              </div>

              {/* Row 2: Integrantes & Gastos Compartilhados */}
              <div style={{ display: 'grid', gridTemplateColumns: sharedExpenses.length > 0 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '0.75rem' }}>
                <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div className="flex-y-center gap-1.5">
                      <Users className="text-primary" size={15} color="var(--primary)" />
                      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Integrantes ({people.length})</h3>
                    </div>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => router.push('/people')}
                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', height: 'auto' }}
                    >
                      <Settings size={11} />
                      Gerenciar
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.15rem', alignItems: 'flex-start' }}>
                    {people.slice(0, 5).map(p => {
                      const isSelf = p.linkedUserId === p.userId
                      const statusColor = isSelf || p.linkedUserId 
                        ? '#10b981' 
                        : (p.userId ? '#f59e0b' : '#94a3b8')
                      const statusTitle = isSelf || p.linkedUserId
                        ? 'Conectado'
                        : (p.userId ? 'Convite Pendente' : 'Membro Local')

                      return (
                        <Tooltip key={p.id} content={`${p.name} (${statusTitle})`}>
                          <div 
                            onClick={() => router.push(`/people?id=${p.id}`)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                          >
                            <div style={{ position: 'relative' }}>
                              {p.avatar ? (
                                <img 
                                  src={p.avatar} 
                                  alt={p.name}
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '1.5px solid var(--border)',
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '50%',
                                  backgroundColor: isSelf ? 'var(--primary)' : 'var(--primary-light)',
                                  color: isSelf ? 'white' : 'var(--primary)',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  border: '1.5px solid var(--border)',
                                  flexShrink: 0
                                }}>
                                  {getInitials(p.name)}
                                </div>
                              )}
                              <span 
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  width: '0.55rem',
                                  height: '0.55rem',
                                  borderRadius: '50%',
                                  backgroundColor: statusColor,
                                  border: '1.5px solid var(--card)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                                title={statusTitle}
                              />
                            </div>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'var(--foreground)',
                              maxWidth: '50px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'center'
                            }}>
                              {p.name.split(' ')[0]}
                            </span>
                          </div>
                        </Tooltip>
                      )
                    })}
                    
                    {people.length > 5 && (
                      <Tooltip content={`Mais ${people.length - 5} integrantes`}>
                        <div 
                          onClick={() => router.push('/people')}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--border)',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1.5px solid var(--border)'
                          }}
                        >
                          +{people.length - 5}
                        </div>
                      </Tooltip>
                    )}

                    {/* Quick Add button */}
                    <Tooltip content="Adicionar integrante">
                      <div 
                        onClick={() => router.push('/people?add=true')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1.5px dashed var(--border)',
                          color: 'var(--text-muted)',
                          flexShrink: 0
                        }}>
                          <Plus size={12} />
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>

                {/* Card de Gastos Compartilhados Comigo */}
                {sharedExpenses.filter(se => se.month === activeMonth).length > 0 && (
                  <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-y-center gap-1.5" style={{ marginBottom: '0.5rem' }}>
                      <Users className="text-primary" size={15} color="var(--primary)" />
                      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Compartilhados Comigo
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, maxHeight: '200px', overflowY: 'auto' }}>
                      {sharedExpenses.filter(se => se.month === activeMonth).map((se, idx) => (
                        <Tooltip key={idx} style={{ width: '100%' }} content="Clique para ver os gastos detalhados">
                          <div 
                            onClick={() => setSelectedSharedGroup(se)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '0.25rem 0.35rem',
                              margin: '0 -0.35rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              width: '100%'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{se.ownerName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {se.expenseCount} despesas
                                </span>
                                {se.expenses.some((e: any) => e.sharedStatus === 'PENDING') && (
                                  <span className="badge" style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>Novos Pendentes</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.05rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--foreground)' }}>
                                R$ {se.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                    {paginatedTotals.map((p) => {
                      const palette = ['var(--primary)', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                      const originalIndex = totals.findIndex(t => t.id === p.id);
                      const personColor = palette[originalIndex % palette.length];
                      return (
                        <div key={p.id} className="flex-col gap-1">
                          <div className="flex-between" style={{ fontSize: '0.85rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {p.avatar ? (
                                <img 
                                  src={p.avatar} 
                                  alt={p.name}
                                  style={{
                                    width: '1.6rem',
                                    height: '1.6rem',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: `2px solid ${personColor}`,
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '1.6rem',
                                  height: '1.6rem',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary-light)',
                                  color: 'var(--primary)',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  border: `2px solid ${personColor}`,
                                  flexShrink: 0
                                }}>
                                  {p.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
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

                    {divisionTotalPages > 1 && (
                      <Pagination
                        currentPage={divisionPage}
                        totalPages={divisionTotalPages}
                        onPageChange={setDivisionPage}
                        centered={true}
                        style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '3rem 0', fontStyle: 'italic', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Cadastre pessoas para ver a divisão de gastos.
                </div>
              )}
            </div>

          </motion.div>
        </>
      )}

      {/* Modal de Detalhes de Gastos Compartilhados */}
      <Modal
        isOpen={!!selectedSharedGroup}
        onClose={() => setSelectedSharedGroup(null)}
        title={selectedSharedGroup ? `Gastos de ${selectedSharedGroup.ownerName}` : ''}
        maxWidth="500px"
      >
        {selectedSharedGroup && (
          <div className="flex-col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Atribuídos a você como: <strong>&quot;{selectedSharedGroup.personName}&quot;</strong>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Total no mês: <strong style={{ color: 'var(--primary)' }}>R$ {selectedSharedGroup.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({selectedSharedGroup.expenseCount} transações)
              </span>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', maxHeight: '50vh' }}>
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
                    <tr key={exp.id} style={{ opacity: exp.sharedStatus === 'PENDING' ? 0.7 : 1 }}>
                      <td>{formatDate(exp.date)}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {exp.description}
                          {exp.sharedStatus === 'PENDING' && (
                            <span className="badge" style={{ marginLeft: '0.5rem', background: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.65rem' }}>PENDENTE</span>
                          )}
                        </div>
                        {exp.card && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{exp.card}</span>}
                      </td>
                      <td style={{ fontWeight: 700, textAlign: 'right' }}>
                        R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {exp.sharedStatus === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                            <button onClick={() => handleSharedAction(exp.id, 'ACCEPT')} className="btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'var(--success-light)', color: 'var(--success)' }}>Aceitar</button>
                            <button onClick={() => handleSharedAction(exp.id, 'REJECT')} className="btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'var(--danger-light)', color: 'var(--danger)' }}>Recusar</button>
                          </div>
                        )}
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
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoader title="Carregando painel..." description="Preparando sua tela inicial." />}>
      <HomeContent />
    </Suspense>
  )
}
