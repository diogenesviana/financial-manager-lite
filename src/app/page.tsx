'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { fetchDashboardData } from '@/lib/api-client'
import { calculateTotalPaid, calculateTotalPending } from '@/lib/dashboard-helpers'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Upload, Trash2, UserPlus, Check, Minus, ChevronRight, PieChart, CreditCard, Users, Settings, X, Calendar, Zap, LogOut, Shield, Loader2, Search, Bell, UserCheck, UserX as UserXIcon, ExternalLink, ChevronDown, MessageSquare, Edit2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import Tooltip from '@/components/Tooltip'
import MonthSelector from '@/components/MonthSelector'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
import Button from '@/components/Button'
import EditExpenseModal from '@/components/EditExpenseModal'

import MainLayout from '@/components/MainLayout'
import PageLoader from '@/components/PageLoader'
import { WhatsAppService } from '@/lib/whatsapp'

interface Person {
  id: string
  name: string
  userId?: string
  linkedUserId?: string | null
  avatar?: string | null
  phone?: string | null
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
  category?: string | null
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
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
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([])
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'card'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpenseSummary[]>([])
  const [selectedSharedGroup, setSelectedSharedGroup] = useState<SharedExpenseSummary | null>(null)
  const [divisionPage, setDivisionPage] = useState(1)
  const [prevGrandTotal, setPrevGrandTotal] = useState(0)
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, boolean>>({})

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
      
      const data = await fetchDashboardData(targetMonth)
      
      setPaymentStatuses(data.paymentsMap)
      setPeople(data.people)
      setExpenses(data.expenses)
      setPrevExpenses(data.prevExpenses)
      
      const prevTotal = data.prevExpenses.reduce((sum: number, e: any) => sum + e.amount, 0)
      setPrevGrandTotal(prevTotal)
      
      setDbMonths(data.months)

      // Fetch shared expenses (invites were moved to NotificationsModal)
      try {
        const sharedRes = await fetch(`/api/shared-expenses?t=${t}`)
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
    const handleRefresh = () => fetchData(selectedMonth)
    window.addEventListener('refreshData', handleRefresh)
    return () => window.removeEventListener('refreshData', handleRefresh)
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
  const itemsPerPage = 10
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
  const grandTotalDiff = prevGrandTotal > 0 ? ((grandTotal - prevGrandTotal) / prevGrandTotal) * 100 : 0

  const totals = people.map(p => {
    const total = filteredExpenses
      .filter(e => e.personId === p.id)
      .reduce((sum, e) => sum + e.amount, 0)
      
    const prevTotal = prevExpenses
      .filter(e => e.personId === p.id)
      .reduce((sum, e) => sum + e.amount, 0)
      
    const diff = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0
      
    return { ...p, total, prevTotal, diff }
  }).sort((a, b) => b.total - a.total)

  const totalPaid = calculateTotalPaid(totals, paymentStatuses)
  const unpaidMembersSum = totals
    .filter(p => !paymentStatuses[p.id])
    .reduce((sum, p) => sum + p.total, 0)
  const totalPending = calculateTotalPending(totals, paymentStatuses, unassignedTotal)

  const divisionTotals = totals.filter(t => t.total > 0)
  const divisionItemsPerPage = 3
  const divisionTotalPages = Math.ceil(divisionTotals.length / divisionItemsPerPage)
  const paginatedTotals = divisionTotals.slice(
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

  const handleCobrarPendentes = () => {
    const pendingPeople = totals.filter(p => !paymentStatuses[p.id] && p.total > 0 && p.phone)
    if (pendingPeople.length === 0) {
      toast.success('Ninguém pendente com telefone cadastrado!')
      return
    }

    toast.success(`Preparando WhatsApp para ${pendingPeople.length} integrantes... (Permita pop-ups no navegador)`, { duration: 4000 })

    pendingPeople.forEach((p, index) => {
      setTimeout(() => {
        const pExpenses = filteredExpenses.filter(e => e.personId === p.id)
        WhatsAppService.sendBillSummary({
          phone: p.phone!,
          personName: p.name,
          month: formatMonthName(activeMonth),
          expenses: pExpenses,
          totalAmount: p.total
        })
      }, index * 1000)
    })
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

          {/* Top Metrics Cards Row (Full Width) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}
          >
            {/* CARD 1: Total da Fatura */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  Soma das despesas em {formatMonthShorthand ? formatMonthShorthand(activeMonth) : formatMonthName(activeMonth)}
                </p>
                {prevGrandTotal > 0 && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                    Anterior: <strong style={{ color: 'var(--foreground)' }}>R$ {prevGrandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* CARD 2: Total Pago */}
            <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <div className="flex-y-center gap-1.5">
                  <Check className="text-success" size={15} color="var(--success)" />
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pago</h3>
                </div>
                {grandTotal > 0 && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '20px', fontWeight: 600 }}>
                    {((totalPaid / grandTotal) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.02em' }}>
                R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  {totals.filter(p => p.total > 0 && paymentStatuses[p.id]).length} de {totals.filter(p => p.total > 0).length} integrantes pagos
                </p>
              </div>
            </div>

            {/* CARD 3: Total Pendente */}
            <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <div className="flex-y-center gap-1.5">
                  <UserXIcon className="text-warning" size={15} color="var(--warning)" />
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pendente</h3>
                </div>
                {grandTotal > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '20px', fontWeight: 600 }}>
                    {((totalPending / grandTotal) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPending > 0 ? 'var(--warning)' : 'var(--success)', letterSpacing: '-0.02em' }}>
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                  Membros: R$ {unpaidMembersSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Sem atribuição: R$ {unassignedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {pendingAllMonths.length > unassignedExpensesAll.length && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginTop: '0.15rem' }}>
                    ⚠️ + R$ {(pendingAllMonthsTotal - unassignedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem atribuição em outros meses
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Dashboard Metrics and Division Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="dashboard-grid"
          >
            
            {/* Left Metrics Column */}
            <div className="flex-col gap-3">

              {/* Row 2: Integrantes & Gastos Compartilhados */}
              <div style={{ display: 'grid', gridTemplateColumns: sharedExpenses.length > 0 ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '0.75rem' }}>
                <div className="card card-interactive card-glass" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div className="flex-y-center gap-1.5">
                      <Users className="text-primary" size={15} color="var(--primary)" />
                      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Integrantes ({people.length})</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Tooltip content="Cobrar pendentes via WhatsApp">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={handleCobrarPendentes}
                        >
                          <MessageSquare size={14} color="var(--success)" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Gerenciar integrantes">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => router.push('/people')}
                        >
                          <Settings size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.15rem', alignItems: 'flex-start' }}>
                    {people.slice(0, 5).map(p => {
                      const pTotal = totals.find(t => t.id === p.id)?.total || 0
                      const isSelf = p.linkedUserId === p.userId
                      const statusColor = isSelf || p.linkedUserId 
                        ? '#10b981' 
                        : (p.userId ? '#f59e0b' : '#94a3b8')
                      const statusTitle = isSelf || p.linkedUserId
                        ? 'Conectado'
                        : (p.userId ? 'Convite Pendente' : 'Membro Local')

                      return (
                        <Tooltip key={p.id} content={p.name}>
                          <div 
                            onClick={() => router.push(`/people?id=${p.id}`)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'transform 0.2s',
                              width: '50px'
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
                                    display: 'block',
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', width: '100%' }}>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'var(--foreground)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {p.name.split(' ')[0]}
                              </span>
                              {pTotal === 0 ? (
                                <span title="Sem gastos no mês"><Minus size={11} color="var(--text-muted)" /></span>
                              ) : paymentStatuses[p.id] ? (
                                <span title="Pago"><Check size={11} color="var(--success)" /></span>
                              ) : null}
                            </div>
                          </div>
                        </Tooltip>
                      )
                    })}
                    
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
                          return divisionTotals.map((p, index) => {
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
                      const originalIndex = divisionTotals.findIndex(t => t.id === p.id);
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
                              {paymentStatuses[p.id] && <span title="Pago" style={{ marginLeft: '0.3rem', color: 'var(--success)', display: 'inline-flex' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </span>}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              {p.prevTotal > 0 && (
                                <span className={`badge ${p.diff > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {p.diff > 0 ? `▲ +${p.diff.toFixed(0)}%` : `▼ ${p.diff.toFixed(0)}%`}
                               </span>
                              )}
                              <span style={{ fontWeight: 700, color: personColor, whiteSpace: 'nowrap' }}>
                                R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${grandTotal > 0 ? (p.total / grandTotal) * 100 : 0}%` }}
                              style={{ height: '100%', backgroundColor: personColor, borderRadius: '3px' }}
                            />
                          </div>
                          <div className="flex-between" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span style={{ whiteSpace: 'nowrap' }}>{grandTotal > 0 ? ((p.total / grandTotal) * 100).toFixed(1) : 0}% do total</span>
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
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); setEditingExpense(exp); }} className="btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'var(--background)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Editar</button>
                          {exp.sharedStatus === 'PENDING' && (
                            <>
                              <button onClick={() => handleSharedAction(exp.id, 'ACCEPT')} className="btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'var(--success-light)', color: 'var(--success)' }}>Aceitar</button>
                              <button onClick={() => handleSharedAction(exp.id, 'REJECT')} className="btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'var(--danger-light)', color: 'var(--danger)' }}>Recusar</button>
                            </>
                          )}
                        </div>
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
      
      <EditExpenseModal 
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense as any}
        onSuccess={() => {
          fetchData(selectedMonth)
          toast.success('Despesa atualizada com sucesso!')
        }}
      />
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
