'use client'

import { useState, useEffect } from 'react'
import { fetchImportPageData } from '@/lib/api-client'
import { Plus, Upload, UserPlus, X, Calendar, Loader2, Check, ChevronDown, Search, Trash2, CreditCard, Users, UserCheck, Phone, Mail, ArrowLeft, Edit2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import MonthSelector from '@/components/MonthSelector'
import GlobalToaster from '@/components/GlobalToaster'
import ConfirmModal from '@/components/ConfirmModal'
import Modal from '@/components/Modal'
import ThemeToggle from '@/components/ThemeToggle'
import MainLayout from '@/components/MainLayout'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ptBR } from 'date-fns/locale'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'
import BulkActionsBar from '@/components/BulkActionsBar'
import Pagination from '@/components/Pagination'
import DataTable, { Column } from '@/components/DataTable'
import EditExpenseModal from '@/components/EditExpenseModal'

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
  isManual: boolean
  month: string
  card?: string | null
  category?: string | null
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

export default function ImportPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  
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
  
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7))
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [manualExpense, setManualExpense] = useState({ 
    date: getTodayStr(), 
    description: '', 
    amount: '', 
    personId: '', 
    card: '' 
  })
  const [showAddManualForm, setShowAddManualForm] = useState(false)
  const [showAddPdfModal, setShowAddPdfModal] = useState(false)

  // Pending table states
  const [showAllPending, setShowAllPending] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [sortField, setSortField] = useState<'date' | 'description' | 'amount' | 'card'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [activeDropdownExpenseId, setActiveDropdownExpenseId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      setShowAddPdfModal(false)
      const mockEvent = {
        target: {
          files,
          value: ''
        }
      } as any
      await handleFileUpload(mockEvent)
    }
  }

  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"

  useEffect(() => {
    fetchData(currentMonthStr)
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      setManualExpense(prev => ({
        ...prev,
        date: getDefaultDateForMonth(selectedMonth)
      }))
    }
  }, [selectedMonth])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, searchTerm])

  const fetchData = async (monthToFetch?: string) => {
    setLoading(true)
    try {
      const t = Date.now()
      const targetMonth = monthToFetch || selectedMonth || currentMonthStr
      const data = await fetchImportPageData(targetMonth)
      setPeople(data.people)
      setExpenses(data.expenses)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setShowAddPdfModal(false)
    setUploading(true)
    let totalImported = 0
    let totalAutoAssigned = 0
    let hasError = false
    let errorMsg = ''
    let lastDetectedMonth = ''

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Analisando ${file.name} (${i + 1}/${files.length})...`)
        
        const formData = new FormData()
        formData.append('file', file)
        if (selectedMonth) {
          formData.append('month', selectedMonth)
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          totalImported += data.count || 0
          totalAutoAssigned += data.autoAssigned || 0
          if (data.month) {
            lastDetectedMonth = data.month
          }
        } else {
          hasError = true
          errorMsg = data.error || `Erro ao processar o arquivo ${file.name}`
          break
        }
      }

      if (!hasError) {
        toast.success(`Sucesso! ${totalImported} despesas importadas (${totalAutoAssigned} atribuídas automaticamente).`)
        fetchData(selectedMonth)
      } else {
        toast.error(errorMsg || 'Erro ao processar faturas')
      }
    } catch (error) {
      toast.error('Erro de conexão ao enviar arquivos')
    } finally {
      setUploading(false)
      setUploadProgress('')
      e.target.value = ''
    }
  }

  const [savingManual, setSavingManual] = useState(false)

  const handleSaveManualExpense = async () => {
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

    setSavingManual(true)
    const targetMonth = manualExpense.date.substring(0, 7)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: manualExpense.date,
          description: manualExpense.description,
          amount: parsedAmount,
          personId: manualExpense.personId || null,
          card: manualExpense.card || null,
          month: targetMonth,
        }),
      })
      if (res.ok) {
        toast.success('Gasto adicionado com sucesso!')
        if (targetMonth !== selectedMonth) {
          setSelectedMonth(targetMonth)
        }
        setManualExpense({ 
          date: getTodayStr(), 
          description: '', 
          amount: '', 
          personId: '', 
          card: '' 
        })
        setShowAddManualForm(false)
        fetchData(targetMonth)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Erro ao salvar gasto')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSavingManual(false)
    }
  }

  // Pending triage table logics
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

  const assignExpenses = async (idsToUpdate: string[], personId: string | null) => {
    if (idsToUpdate.length === 0) return

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
          body: JSON.stringify({ personId, month: selectedMonth }),
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
          prev.map(e => idsToUpdate.includes(e.id) ? { ...e, personId, month: selectedMonth } : e)
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
    const isBulk = selectedIds.length > 0 && selectedIds.includes(id)
    const message = isBulk && selectedIds.length > 1
      ? `Tem certeza que deseja excluir as ${selectedIds.length} despesas selecionadas?`
      : 'Tem certeza que deseja excluir esta despesa?'

    setConfirmDialog({
      message,
      onConfirm: async () => {
        const idsToDelete = isBulk ? selectedIds : [id]
        const toastId = toast.loading(idsToDelete.length > 1 ? `Excluindo ${idsToDelete.length} despesas...` : 'Excluindo despesa...')
        try {
          const promises = idsToDelete.map(currId => 
            fetch(`/api/expenses/${currId}`, { method: 'DELETE' })
          )
          const results = await Promise.all(promises)
          const allOk = results.every(res => res.ok)
          
          if (allOk) {
            toast.success(idsToDelete.length > 1 ? `${idsToDelete.length} despesas excluídas!` : 'Despesa excluída!', { id: toastId })
            setExpenses(prev => prev.filter(e => !idsToDelete.includes(e.id)))
            setSelectedIds([])
          } else {
            toast.error('Erro ao excluir algumas despesas', { id: toastId })
            fetchData()
          }
        } catch (error) {
          toast.error('Erro de conexão', { id: toastId })
        }
      }
    })
  }

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

  const generateRecentMonths = () => {
    const months = []
    const d = new Date()
    for (let i = 0; i < 6; i++) {
      months.push(d.toISOString().substring(0, 7))
      d.setMonth(d.getMonth() - 1)
    }
    return months
  }

  const availableMonths = generateRecentMonths()

  const activeMonth = selectedMonth || currentMonthStr
  const filteredExpenses = expenses.filter(e => e.month === activeMonth)
  const unassignedExpensesAll = showAllPending
    ? expenses.filter(e => !e.personId)
    : filteredExpenses.filter(e => !e.personId)

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

  const formatMonthName = (m: string) => {
    if (!m) return ''
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
      {activeDropdownExpenseId && (
        <div 
          onClick={() => setActiveDropdownExpenseId(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 990 }}
        />
      )}
      <AnimatePresence>
        {uploading && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
              style={{ 
                position: 'relative', width: '90%', maxWidth: '400px', padding: '2.5rem 2rem', 
                zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
              }}
            >
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', 
                borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1.5rem' 
              }}>
                <Loader2 size={36} className="animate-spin" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
                Processando Fatura
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {uploadProgress || 'A inteligência artificial do Gemini está analisando o PDF para extrair as transações. Isso pode levar alguns segundos...'}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Importar & Lançar</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
            Lance despesas manualmente, envie faturas fechadas (PDF) ou puxe os gastos mais recentes importando seu extrato (CSV).
          </p>
        </div>

      </div>

      <div className="import-options-grid">
        {/* Opção PDF */}
        <div 
          onClick={() => setShowAddPdfModal(true)}
          className="card card-glass clickable-card import-option-card"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            gap: '1rem',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.2s ease',
          }}
        >
          <div className="import-option-card-icon-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
          }}>
            <Upload size={28} className="import-icon" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
              Importar Fatura ou Extrato
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Envie sua fatura fechada (PDF) ou seu extrato do mês atual (CSV) para lermos todos os gastos automaticamente.
            </p>
          </div>
        </div>

        {/* Opção Manual */}
        <div 
          onClick={() => setShowAddManualForm(true)}
          className="card card-glass clickable-card import-option-card"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            gap: '1rem',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.2s ease',
          }}
        >
          <div className="import-option-card-icon-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
          }}>
            <Plus size={28} className="import-icon" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
              Lançar Gasto Manual
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Abra o formulário para digitar e atribuir um gasto avulso ou específico de forma manual.
            </p>
          </div>
        </div>
      </div>

      {/* Triage Workspace: Pending Expenses Table */}
      {loading ? (
        <PageLoader title="Carregando área de triagem..." description="Buscando lançamentos pendentes de atribuição." />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card" 
          style={{ padding: '2rem', marginTop: '2.5rem' }}
        >
          <div className="flex-col gap-3" style={{ width: '100%', marginBottom: '1.5rem' }}>
            {/* Row 1: Heading and All Buttons */}
            <div className="flex-between flex-wrap gap-3" style={{ width: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                Despesas Pendentes ({unassignedExpenses.length})
                {selectedIds.length > 0 && (
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(219, 20, 96, 0.2)' }}>
                    {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Mês de Destino Dropdown (Sempre Visível) */}
                <MonthSelector 
                  activeMonth={selectedMonth} 
                  availableMonths={availableMonths} 
                  onMonthChange={setSelectedMonth} 
                  labelNode={<><span className="hide-mobile">Mês de </span>Destino:</>}
                />

                {/* Ações em Lote (Apenas se houver selecionados) */}
                {selectedIds.length > 0 && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (selectedIds.length > 0) {
                          deleteExpense(selectedIds[0]);
                        }
                      }}
                      style={{ 
                        padding: '0.35rem 0.75rem', 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--danger)', 
                        boxShadow: '0 4px 10px rgba(225, 29, 72, 0.15)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        height: 'auto'
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Excluir <span className="hide-mobile">Selecionadas</span></span>
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setSelectedIds([])}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}
                    >
                      <span>Limpar <span className="hide-mobile">Seleção</span></span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Search Input (Full Width) */}
            <div className="table-filter-input-wrapper" style={{ margin: '0.5rem 0 0 0', width: '100%', maxWidth: 'none' }}>
              <Search size={16} className="table-filter-icon" />
              <input 
                type="text"
                placeholder="Pesquisar despesas por descrição, banco ou valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="table-filter-input"
                style={{ width: '100%' }}
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

          <div id="import-table-container" className="table-container" style={{ minHeight: '280px' }}>
            <DataTable
            data={paginatedUnassignedExpenses}
            keyExtractor={(e) => e.id}
            selectable={true}
            selectedIds={selectedIds}
            onSelectAll={toggleSelectAll}
            onSelectRow={(id) => toggleSelectExpense(id)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort as (field: string) => void}
            emptyMessage={showAllPending ? 'Nenhuma despesa pendente encontrada.' : 'Nenhuma despesa pendente para o mês selecionado.'}
            columns={[
              {
                key: 'date',
                label: 'Data',
                sortable: true,
                width: '12%',
                render: (e) => {
                  const isNeg = e.amount < 0;
                  return (
                    <div style={{ color: isNeg ? 'var(--success)' : 'inherit', fontWeight: isNeg ? 600 : 400 }}>
                      {formatDate(e.date)}
                      {showAllPending && e.month !== activeMonth && (
                        <span style={{ 
                          marginLeft: '0.4rem', 
                          backgroundColor: 'var(--primary-light)', 
                          color: 'var(--primary)', 
                          fontSize: '0.65rem', 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '4px',
                          fontWeight: 700,
                          border: '1px solid rgba(219, 20, 96, 0.15)'
                        }}>
                          {formatMonthName(e.month).split(' / ')[0]}
                        </span>
                      )}
                    </div>
                  )
                }
              },
              {
                key: 'card',
                label: 'Instituição',
                sortable: true,
                width: '12%',
                render: (e) => (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {e.card ? (
                      <span style={{ 
                        background: 'var(--background)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border)',
                        fontFamily: 'monospace', fontSize: '0.8rem'
                      }}>
                        {e.card}
                      </span>
                    ) : '-'}
                  </span>
                )
              },
              {
                key: 'description',
                label: 'Descrição',
                sortable: true,
                width: '33%',
                render: (e) => {
                  const isNeg = e.amount < 0;
                  return (
                    <>
                      <div style={{ fontWeight: 500, color: isNeg ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {e.description}
                        {isNeg && <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>Estorno</span>}
                      </div>
                      {e.isManual && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Manual</span>}
                    </>
                  )
                }
              },
              {
                key: 'category',
                label: 'Categoria',
                sortable: true,
                width: '11%',
                render: (e) => (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    background: 'var(--background)',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}>
                    {e.category || 'Outros'}
                  </span>
                )
              },
              {
                key: 'amount',
                label: 'Valor',
                sortable: true,
                width: '15%',
                render: (e) => {
                  const isNeg = e.amount < 0;
                  return (
                    <div style={{ fontWeight: 700, color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                      {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </div>
                  )
                }
              },
              {
                key: 'assign',
                label: 'Atribuir a',
                width: '17%',
                render: (e) => {
                  const isLastRows = false; // Simplified for DataTable as overflow might be handled differently
                  return (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {people.length <= 4 ? (
                        people.map(p => (
                          <Tooltip key={p.id} content={`Atribuir a ${p.name}`}>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); assignExpenses([e.id], p.id); }}
                              className="btn-avatar-assign"
                            >
                              {p.avatar ? (
                                <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span>{getInitials(p.name)}</span>
                              )}
                            </button>
                          </Tooltip>
                        ))
                      ) : (
                        <>
                          {people.slice(0, 3).map(p => (
                            <Tooltip key={p.id} content={`Atribuir a ${p.name}`}>
                              <button
                                onClick={(ev) => { ev.stopPropagation(); assignExpenses([e.id], p.id); }}
                                className="btn-avatar-assign"
                              >
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span>{getInitials(p.name)}</span>
                                )}
                              </button>
                            </Tooltip>
                          ))}
                          <div style={{ position: 'relative', display: 'inline-block', zIndex: activeDropdownExpenseId === e.id ? 1000 : 'auto' }}>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); setActiveDropdownExpenseId(activeDropdownExpenseId === e.id ? null : e.id); }}
                              className="btn-avatar-assign"
                              style={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              <Plus size={16} />
                            </button>
                            {activeDropdownExpenseId === e.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: isLastRows ? undefined : '100%',
                                  bottom: isLastRows ? '100%' : undefined,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  marginTop: isLastRows ? undefined : '4px',
                                  marginBottom: isLastRows ? '4px' : undefined,
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  boxShadow: 'var(--shadow-lg)',
                                  padding: '0.35rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.2rem',
                                  minWidth: '180px',
                                  zIndex: 1000
                                }}
                              >
                                {people.slice(3).map(p => (
                                  <button
                                    key={p.id}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      assignExpenses([e.id], p.id);
                                      setActiveDropdownExpenseId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.4rem 0.6rem',
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--foreground)',
                                      fontSize: '0.8rem',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      borderRadius: '6px',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    {p.avatar ? (
                                      <img src={p.avatar} alt={p.name} style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                                        {getInitials(p.name)}
                                      </div>
                                    )}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                }
              },
              {
                key: 'delete',
                label: 'Excluir',
                width: '8%',
                align: 'center',
                render: (e) => (
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                    <Tooltip content="Editar despesa">
                      <button 
                        onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); setEditingExpense(e); }} 
                        style={{ 
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', 
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Excluir despesa">
                      <button 
                        onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); deleteExpense(e.id); }} 
                        style={{ 
                          background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', 
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                )
              }
            ]}
            renderMobileCard={(e) => {
              const isNeg = e.amount < 0
              const isSelected = selectedIds.includes(e.id)
              
              return (
                <div 
                  className={`expense-mobile-card ${isSelected ? 'selected' : ''}`}
                  style={{ backgroundColor: isNeg ? 'rgba(16, 185, 129, 0.02)' : undefined }}
                >
                  <div className="expense-mobile-card-header">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <input 
                        type="checkbox" checked={isSelected} onChange={() => toggleSelectExpense(e.id)}
                        style={{ cursor: 'pointer', transform: 'scale(1.15)', marginTop: '0.2rem' }}
                      />
                      <div className="flex-col" style={{ gap: '0.25rem' }}>
                        <span className="expense-mobile-card-title">{e.description}</span>
                        <div className="expense-mobile-card-meta">
                          <span>{formatDate(e.date)}</span>
                          {showAllPending && e.month !== activeMonth && (
                            <span style={{ 
                              background: 'var(--primary-light)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(219, 20, 96, 0.15)',
                              color: 'var(--primary)', fontWeight: 700, fontSize: '0.7rem'
                            }}>
                              {formatMonthName(e.month).split(' / ')[0]}
                            </span>
                          )}
                          {e.card && (
                            <span style={{ 
                              background: 'var(--background)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border)',
                              fontFamily: 'monospace', fontSize: '0.75rem'
                            }}>
                              {e.card}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="expense-mobile-card-amount" style={{ color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                      {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </div>
                  </div>

                  <div className="expense-mobile-card-actions">
                    <div className="expense-mobile-card-assign" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {people.length <= 4 ? (
                        people.map(p => (
                          <button
                            key={p.id}
                            onClick={(ev) => { ev.stopPropagation(); assignExpenses([e.id], p.id); }}
                            className="btn-avatar-assign"
                          >
                            {p.avatar ? (
                              <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span>{getInitials(p.name)}</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <>
                          {people.slice(0, 3).map(p => (
                            <button
                              key={p.id}
                              onClick={(ev) => { ev.stopPropagation(); assignExpenses([e.id], p.id); }}
                              className="btn-avatar-assign"
                            >
                              {p.avatar ? (
                                <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span>{getInitials(p.name)}</span>
                              )}
                            </button>
                          ))}
                          <div style={{ position: 'relative', display: 'inline-block', zIndex: activeDropdownExpenseId === e.id ? 1000 : 'auto' }}>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); setActiveDropdownExpenseId(activeDropdownExpenseId === e.id ? null : e.id); }}
                              className="btn-avatar-assign"
                              style={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              <Plus size={16} />
                            </button>
                            {activeDropdownExpenseId === e.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  marginBottom: '4px',
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  boxShadow: 'var(--shadow-lg)',
                                  padding: '0.35rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.2rem',
                                  minWidth: '180px',
                                  zIndex: 1000
                                }}
                              >
                                {people.slice(3).map(p => (
                                  <button
                                    key={p.id}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      assignExpenses([e.id], p.id);
                                      setActiveDropdownExpenseId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      width: '100%',
                                      padding: '0.4rem 0.6rem',
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--foreground)',
                                      fontSize: '0.8rem',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      borderRadius: '6px',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    {p.avatar ? (
                                      <img src={p.avatar} alt={p.name} style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                                        {getInitials(p.name)}
                                      </div>
                                    )}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); setEditingExpense(e); }} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(ev) => { ev.stopPropagation(); deleteExpense(e.id); }} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                const tableContainer = document.getElementById('import-table-container');
                if (tableContainer) {
                  const y = tableContainer.getBoundingClientRect().top + window.scrollY - 100;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              centered={true}
              style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}
            />
          )}
        </motion.div>
      )}

      {/* Modal: Adicionar Gasto Manual */}
      <Modal 
        isOpen={showAddManualForm} 
        onClose={() => {
          setShowAddManualForm(false)
          setManualExpense({
            date: getTodayStr(),
            description: '',
            amount: '',
            personId: '',
            card: ''
          })
        }} 
        title="Novo Gasto Manual"
        maxWidth="450px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Data</label>
            <div style={{ width: '100%' }}>
              <DatePicker
                selected={manualExpense.date ? new Date(manualExpense.date + 'T12:00:00Z') : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    setManualExpense({...manualExpense, date: date.toISOString().split('T')[0]})
                  }
                }}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="input"
                wrapperClassName="w-full"
                placeholderText="Selecione uma data"
                customInput={<input style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Descrição</label>
            <input type="text" className="input" value={manualExpense.description} onChange={e => setManualExpense({...manualExpense, description: e.target.value})} placeholder="Ex: Mercado, Uber, Ifood..." style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Valor (R$)</label>
            <input 
              type="text" 
              className="input" 
              value={manualExpense.amount} 
              onChange={e => {
                let val = e.target.value.replace(/\D/g, '');
                if (!val) {
                  setManualExpense({...manualExpense, amount: ''});
                  return;
                }
                const num = parseInt(val, 10) / 100;
                setManualExpense({...manualExpense, amount: num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })});
              }} 
              placeholder="0,00" 
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Vincular a (Opcional)</label>
            <select className="input" value={manualExpense.personId} onChange={e => setManualExpense({...manualExpense, personId: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}>
              <option value="">-- Não vincular (Deixar Pendente) --</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Cartão (Opcional)</label>
            <input type="text" className="input" value={manualExpense.card} onChange={e => setManualExpense({...manualExpense, card: e.target.value})} placeholder="Ex: Nubank, Itaú..." style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => {
              setShowAddManualForm(false)
              setManualExpense({
                date: getTodayStr(),
                description: '',
                amount: '',
                personId: '',
                card: ''
              })
            }} style={{ flex: 1, padding: '0.75rem' }}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveManualExpense} disabled={savingManual || !manualExpense.description || !manualExpense.amount} style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {savingManual ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Despesa</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Importar Fatura PDF */}
      <Modal 
        isOpen={showAddPdfModal} 
        onClose={() => setShowAddPdfModal(false)} 
        title="Importar Fatura PDF"
        maxWidth="480px"
      >
        {/* Upload Zone */}
        <label 
          className="upload-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: isDragging ? 'rgba(219, 20, 96, 0.04)' : 'rgba(255, 255, 255, 0.01)',
            transition: 'all 0.2s ease',
            justifyContent: 'center',
            boxShadow: isDragging ? '0 0 15px rgba(219, 20, 96, 0.1)' : 'none'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            backgroundColor: isDragging ? 'var(--primary)' : 'var(--primary-light)',
            color: isDragging ? 'white' : 'var(--primary)',
            transition: 'all 0.2s ease',
          }}>
            <Upload size={24} className={uploading ? 'animate-bounce' : ''} />
          </div>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)' }}>
              {isDragging ? 'Solte o arquivo aqui!' : 'Arraste ou clique para enviar'}
            </span>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]" style={{ marginTop: '0.5rem' }}>
              Fatura Fechada (.pdf) ou Extrato Parcial (.csv)
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Nossa inteligência vai ler o arquivo e listar todas as despesas prontas para você distribuir.
            </p>
          </div>
          <input type="file" hidden accept=".pdf,.csv" multiple onChange={handleFileUpload} disabled={uploading} />
        </label>
      </Modal>

      {/* Confirm dialog */}
      <ConfirmModal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm()
        }}
        message={confirmDialog?.message || ''}
      />
      
      {/* Floating Action Bar for Bulk Operations */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        subtitle="Atribuição em lote para integrantes"
        isVisible={selectedIds.length > 0}
      >
        {/* Dropdown for bulk assignment */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-outline"
            onClick={() => setActiveDropdownExpenseId(activeDropdownExpenseId === 'bulk' ? null : 'bulk')}
          >
            <UserPlus size={14} />
            Atribuir a...
          </button>
          {activeDropdownExpenseId === 'bulk' && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-xl)',
                padding: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                minWidth: '180px',
                zIndex: 1000
              }}
            >
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>Atribuir Selecionados:</span>
              {people.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    assignExpenses(selectedIds, p.id);
                    setActiveDropdownExpenseId(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--foreground)',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                      {getInitials(p.name)}
                    </div>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          className="btn btn-danger"
          onClick={() => deleteExpense(selectedIds[0])}
        >
          <Trash2 size={14} />
          Excluir
        </button>
        
        <button
          className="btn btn-outline"
          onClick={() => setSelectedIds([])}
        >
          Cancelar
        </button>
      </BulkActionsBar>

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
