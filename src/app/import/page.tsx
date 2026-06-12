'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, UserPlus, X, Calendar, Loader2, Check, ChevronDown, Search, Trash2, CreditCard, Users, UserCheck, Phone, Mail, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'

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
  const [importType, setImportType] = useState<'select' | 'pdf'>('select')

  // Pending table states
  const [showAllPending, setShowAllPending] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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
      const [peopleRes, expensesRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?month=${targetMonth}&t=${t}`)
      ])
      if (peopleRes.ok && expensesRes.ok) {
        const peopleData = await peopleRes.json()
        const expensesData = await expensesRes.json()
        setPeople(Array.isArray(peopleData) ? peopleData : [])
        setExpenses(Array.isArray(expensesData) ? expensesData : [])
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

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
        if (lastDetectedMonth && lastDetectedMonth !== selectedMonth) {
          setSelectedMonth(lastDetectedMonth)
        }
        fetchData(lastDetectedMonth || selectedMonth)
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

  const handleSaveExpense = async () => {
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
  const itemsPerPage = 15
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
            Adicione despesas manuais ou envie faturas em formato PDF para processamento automático.
          </p>
        </div>

      </div>

      {importType === 'select' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', maxWidth: '800px', margin: '0 auto 2rem auto' }}>
          {/* Opção PDF */}
          <div 
            onClick={() => setImportType('pdf')}
            className="card card-glass clickable-card"
            style={{ 
              padding: '2.5rem 2rem', 
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
            }}>
              <Upload size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
                Importar Fatura PDF
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Envie faturas em formato PDF para processamento inteligente automático das transações.
              </p>
            </div>
          </div>

          {/* Opção Manual */}
          <div 
            onClick={() => setShowAddManualForm(true)}
            className="card card-glass clickable-card"
            style={{ 
              padding: '2.5rem 2rem', 
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
            }}>
              <Plus size={28} />
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
      ) : (
        /* Tela de Upload do PDF */
        <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setImportType('select')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: 0,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              Importar Fatura PDF
            </h3>
            <div style={{ width: '60px' }} /> {/* Spacer to align title */}
          </div>
          
          <label 
            className="upload-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 1.5rem',
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
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0, lineHeight: 1.4 }}>
                A inteligência artificial extrairá todas as transações automaticamente do seu PDF.
              </p>
            </div>
            <input type="file" hidden accept=".pdf" multiple onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      )}

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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {showMonthDropdown && (
                    <div 
                      onClick={() => setShowMonthDropdown(false)} 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
                    />
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} />
                    <span className="hide-mobile">Mês de </span>Destino:
                  </span>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                      className="btn btn-outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        height: 'auto'
                      }}
                    >
                      <span className="hide-mobile">{formatMonthName(selectedMonth)}</span>
                      <span className="show-mobile" style={{ display: 'none' }}>{formatMonthShorthand(selectedMonth)}</span>
                      <ChevronDown size={12} style={{ opacity: 0.7, transform: showMonthDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                            top: 'calc(100% + 0.35rem)',
                            right: 0,
                            minWidth: '180px',
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
                            const isActive = m === selectedMonth
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

          <div className="table-container" style={{ minHeight: '280px' }}>
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
                  <th onClick={() => handleSort('date')} className="th-sortable" style={{ width: '12%' }}>
                    <div className="flex-row flex-y-center">
                      Data {renderSortIcon('date')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('card')} className="th-sortable" style={{ width: '12%' }}>
                    <div className="flex-row flex-y-center">
                      Instituição {renderSortIcon('card')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('description')} className="th-sortable" style={{ width: '33%' }}>
                    <div className="flex-row flex-y-center">
                      Descrição {renderSortIcon('description')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('amount')} className="th-sortable" style={{ width: '15%' }}>
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
                  {paginatedUnassignedExpenses.map((e, index) => {
                    const isNeg = e.amount < 0
                    const isSelected = selectedIds.includes(e.id)
                    const isLastRows = index >= paginatedUnassignedExpenses.length - 3 && index >= 3
                    return (
                      <motion.tr 
                        key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}
                        style={{ 
                          backgroundColor: isSelected ? 'rgba(219, 20, 96, 0.05)' : (isNeg ? 'rgba(16, 185, 129, 0.02)' : 'transparent'),
                          borderLeft: isSelected ? '3px solid var(--primary)' : undefined
                        }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(ev) => ev.stopPropagation()}>
                          <input 
                            type="checkbox" checked={isSelected} onChange={() => toggleSelectExpense(e.id)}
                            style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                          />
                        </td>
                        <td style={{ color: isNeg ? 'var(--success)' : 'inherit', fontWeight: isNeg ? 600 : 400 }}>
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
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {e.card ? (
                            <span style={{ 
                              background: 'var(--background)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border)',
                              fontFamily: 'monospace', fontSize: '0.8rem'
                            }}>
                              {e.card}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: isNeg ? 'var(--success)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {e.description}
                            {isNeg && <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>Estorno</span>}
                          </div>
                          {e.isManual && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Manual</span>}
                        </td>
                        <td style={{ fontWeight: 700, color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                          {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </td>
                        <td>
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
                        </td>
                        <td style={{ textAlign: 'center' }}>
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
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
                {paginatedUnassignedExpenses.length === 0 && (
                  <tr>
                     <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                       {showAllPending ? 'Nenhuma despesa pendente encontrada.' : 'Nenhuma despesa pendente para o mês selecionado.'}
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mobile-expenses-list">
            {paginatedUnassignedExpenses.length > 0 && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.75rem 1rem', 
                  backgroundColor: 'var(--background)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '1rem' 
                }}
              >
                <input 
                  type="checkbox" 
                  id="mobile-select-all"
                  checked={paginatedUnassignedExpenses.length > 0 && paginatedUnassignedExpenses.every(e => selectedIds.includes(e.id))}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                />
                <label 
                  htmlFor="mobile-select-all"
                  style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}
                >
                  Selecionar todas as despesas da página
                </label>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {paginatedUnassignedExpenses.map(e => {
                const isNeg = e.amount < 0
                const isSelected = selectedIds.includes(e.id)
                
                return (
                  <motion.div 
                    key={e.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
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
                      <button
                        onClick={(ev) => { ev.stopPropagation(); deleteExpense(e.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-row flex-y-center" style={{ justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button 
                className="btn btn-outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Página <strong style={{ color: 'var(--foreground)' }}>{currentPage}</strong> de {totalPages}
              </span>
              <button 
                className="btn btn-outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Próxima
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Modal: Adicionar Gasto Manual */}
      <AnimatePresence>
        {showAddManualForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setShowAddManualForm(false)
                setManualExpense({
                  date: getTodayStr(),
                  description: '',
                  amount: '',
                  personId: '',
                  card: ''
                })
              }}
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
                width: '95%', 
                maxWidth: '480px', 
                padding: '1.75rem', 
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Header */}
              <div className="flex-between" style={{ alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Adicionar Gasto Manual</span>
                <button
                  onClick={() => {
                    setShowAddManualForm(false)
                    setManualExpense({
                      date: getTodayStr(),
                      description: '',
                      amount: '',
                      personId: '',
                      card: ''
                    })
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'block' }}>Data</label>
                    <input 
                      type="date"
                      className="input" 
                      value={manualExpense.date}
                      onChange={(e) => setManualExpense({ ...manualExpense, date: e.target.value })}
                      style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'block' }}>Valor</label>
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
                      style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'block' }}>Descrição</label>
                    <input 
                      className="input" 
                      placeholder="Ex: Mercado" 
                      value={manualExpense.description}
                      onChange={(e) => setManualExpense({ ...manualExpense, description: e.target.value })}
                      style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'block' }}>Cartão / Banco (opcional)</label>
                    <input 
                      className="input" 
                      placeholder="Ex: Nubank" 
                      value={manualExpense.card || ''}
                      onChange={(e) => setManualExpense({ ...manualExpense, card: e.target.value })}
                      style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Attribution field */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                      Atribuir a:
                    </label>
                    <div className="flex-row gap-1.5 flex-wrap" style={{ alignItems: 'center' }}>
                      <button
                        className={!manualExpense.personId ? "btn btn-primary" : "btn btn-outline"}
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          fontSize: '0.75rem', 
                          borderRadius: '999px', 
                          height: 'auto',
                          border: !manualExpense.personId ? '1px solid var(--primary)' : '1px solid var(--border)' 
                        }}
                        onClick={() => setManualExpense({ ...manualExpense, personId: '' })}
                      >
                        Pendente
                      </button>
                      {people.map(p => {
                        const isSelected = manualExpense.personId === p.id
                        return (
                          <button
                            key={p.id}
                            className={isSelected ? "btn btn-primary" : "btn btn-outline"}
                            style={{ 
                              padding: p.avatar ? '0.2rem 0.75rem 0.2rem 0.25rem' : '0.35rem 0.75rem', 
                              fontSize: '0.75rem', 
                              borderRadius: '999px', 
                              height: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setManualExpense({ ...manualExpense, personId: p.id })}
                          >
                            {p.avatar ? (
                              <img src={p.avatar} alt={p.name} style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{
                                width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--primary-light)',
                                color: isSelected ? 'white' : 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700
                              }}>
                                {getInitials(p.name)}
                              </div>
                            )}
                            <span>{p.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveExpense}
                  disabled={savingManual}
                  style={{ padding: '0.65rem', fontWeight: 700, fontSize: '0.85rem', width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDialog(null)}
              className="modal-backdrop" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card" style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', zIndex: 10000 }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Confirmação</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>{confirmDialog.message}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => setConfirmDialog(null)} className="btn btn-outline">Cancelar</button>
                <button 
                  onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} 
                  className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Floating Action Bar for Bulk Operations */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="floating-bulk-bar"
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>
              {selectedIds.length} {selectedIds.length > 1 ? 'itens selecionados' : 'item selecionado'}
            </span>
            <div style={{ width: '1px', height: '1.25rem', backgroundColor: 'var(--border)' }} className="hide-mobile" />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Dropdown for bulk assignment */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setActiveDropdownExpenseId(activeDropdownExpenseId === 'bulk' ? null : 'bulk')}
                  style={{ 
                    padding: '0.4rem 0.85rem', 
                    fontSize: '0.75rem', 
                    borderRadius: '999px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.25rem', 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    height: 'auto'
                  }}
                >
                  <UserPlus size={13} />
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
                className="btn btn-primary"
                onClick={() => deleteExpense(selectedIds[0])}
                style={{ 
                  padding: '0.4rem 0.85rem', 
                  fontSize: '0.75rem', 
                  borderRadius: '999px', 
                  backgroundColor: 'var(--danger)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  height: 'auto'
                }}
              >
                <Trash2 size={13} />
                Excluir
              </button>
              
              <button
                className="btn btn-outline"
                onClick={() => setSelectedIds([])}
                style={{ 
                  padding: '0.4rem 0.85rem', 
                  fontSize: '0.75rem', 
                  borderRadius: '999px', 
                  color: 'rgba(255,255,255,0.7)', 
                  borderColor: 'transparent',
                  height: 'auto'
                }}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}
