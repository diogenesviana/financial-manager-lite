'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, UserPlus, X, Calendar, Loader2, Check, ChevronDown, Search, Trash2, CreditCard, Users, UserCheck, Phone, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
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
  
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [manualExpense, setManualExpense] = useState({ 
    date: getTodayStr(), 
    description: '', 
    amount: '', 
    personId: '', 
    card: '' 
  })

  // Pending table states
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
    setSelectedMonth(currentMonthStr)
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, searchTerm])

  const fetchData = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const [peopleRes, expensesRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?t=${t}`)
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

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Analisando ${file.name} (${i + 1}/${files.length})...`)
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('month', selectedMonth || currentMonthStr)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          totalImported += data.count || 0
          totalAutoAssigned += data.autoAssigned || 0
        } else {
          hasError = true
          errorMsg = data.error || `Erro ao processar o arquivo ${file.name}`
          break
        }
      }

      if (!hasError) {
        toast.success(`Sucesso! ${totalImported} despesas importadas (${totalAutoAssigned} atribuídas automaticamente).`)
        fetchData()
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
          month: selectedMonth || currentMonthStr,
        }),
      })
      if (res.ok) {
        toast.success('Gasto adicionado com sucesso!')
        setManualExpense({ 
          date: getTodayStr(), 
          description: '', 
          amount: '', 
          personId: '', 
          card: '' 
        })
        fetchData()
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
  const unassignedExpensesAll = filteredExpenses.filter(e => !e.personId)

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
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {showMonthDropdown && (
            <div 
              onClick={() => setShowMonthDropdown(false)} 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
            />
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={15} />
            Mês de Trabalho:
          </span>
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
              <span>{formatMonthName(selectedMonth)}</span>
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
                    right: 0,
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Importar Fatura PDF */}
        <div className="card card-glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-y-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <Upload className="text-primary" size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              Importar Fatura PDF
            </h3>
          </div>
          
          <label 
            className="upload-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: isDragging ? 'rgba(219, 20, 96, 0.04)' : 'rgba(255, 255, 255, 0.01)',
              transition: 'all 0.2s ease',
              flex: 1,
              justifyContent: 'center',
              boxShadow: isDragging ? '0 0 15px rgba(219, 20, 96, 0.1)' : 'none'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.2rem',
              height: '3.2rem',
              borderRadius: '50%',
              backgroundColor: isDragging ? 'var(--primary)' : 'var(--primary-light)',
              color: isDragging ? 'white' : 'var(--primary)',
              transition: 'all 0.2s ease',
              marginBottom: '0.25rem'
            }}>
              <Upload size={22} className={uploading ? 'animate-bounce' : ''} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>
                {isDragging ? 'Solte o arquivo aqui!' : 'Arraste ou clique para enviar'}
              </span>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0, lineHeight: 1.4 }}>
                A inteligência artificial extrairá todas as transações automaticamente.
              </p>
            </div>
            <input type="file" hidden accept=".pdf" multiple onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        {/* Card 3: Adicionar Gasto Manual */}
        <div className="card card-glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-y-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <Plus className="text-primary" size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              Adicionar Gasto Manual
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Data</label>
                <input 
                  type="date"
                  className="input" 
                  value={manualExpense.date}
                  onChange={(e) => setManualExpense({ ...manualExpense, date: e.target.value })}
                  style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Valor</label>
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
                  style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <input 
                  className="input" 
                  placeholder="Descrição (Ex: Mercado)" 
                  value={manualExpense.description}
                  onChange={(e) => setManualExpense({ ...manualExpense, description: e.target.value })}
                  style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <input 
                  className="input" 
                  placeholder="Cartão / Banco (opcional)" 
                  value={manualExpense.card || ''}
                  onChange={(e) => setManualExpense({ ...manualExpense, card: e.target.value })}
                  style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', display: 'block' }}>
                  Atribuir a:
                </label>
                <div className="flex-row gap-1.5 flex-wrap" style={{ alignItems: 'center' }}>
                  <button
                    className={!manualExpense.personId ? "btn btn-primary" : "btn btn-outline"}
                    style={{ 
                      padding: '0.25rem 0.6rem', 
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
                          padding: p.avatar ? '0.15rem 0.6rem 0.15rem 0.2rem' : '0.25rem 0.6rem', 
                          fontSize: '0.75rem', 
                          borderRadius: '999px', 
                          height: 'auto',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setManualExpense({ ...manualExpense, personId: p.id })}
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} style={{ width: '1.2rem', height: '1.2rem', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '1.2rem', height: '1.2rem', borderRadius: '50%',
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
              style={{ padding: '0.55rem', fontWeight: 700, fontSize: '0.85rem', width: '100%', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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
          <div className="flex-between flex-wrap gap-4" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                Despesas Pendentes ({unassignedExpenses.length})
                {selectedIds.length > 0 && (
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(219, 20, 96, 0.2)' }}>
                    {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              {selectedIds.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                    Excluir Selecionadas
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedIds([])}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}
                  >
                    Limpar Seleção
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Selecione as despesas abaixo e atribua-as aos integrantes correspondentes.
                </p>
              )}
            </div>

            {/* Quick Search */}
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
                  {paginatedUnassignedExpenses.map(e => {
                    const isNeg = e.amount < 0
                    const isSelected = selectedIds.includes(e.id)
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
                        <td style={{ color: isNeg ? 'var(--success)' : 'inherit', fontWeight: isNeg ? 600 : 400 }}>{formatDate(e.date)}</td>
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
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => setActiveDropdownExpenseId(activeDropdownExpenseId === e.id ? null : e.id)}
                              style={{ 
                                padding: '0.35rem 0.75rem', 
                                fontSize: '0.75rem', 
                                borderRadius: '6px', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                height: 'auto'
                              }}
                            >
                              <UserPlus size={14} />
                              Atribuir...
                              <ChevronDown size={12} style={{ opacity: 0.7 }} />
                            </button>
                            {activeDropdownExpenseId === e.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  marginTop: '4px',
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
                                {people.map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      assignExpense(e.id, p.id);
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
                                    {p.linkedUserId === p.userId && (
                                      <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 700 }}>Você</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Tooltip content="Excluir despesa">
                            <button 
                              onClick={(ev) => { ev.preventDefault(); deleteExpense(e.id); }} 
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
                      Nenhuma despesa pendente para o mês selecionado.
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
                      <div className="expense-mobile-card-assign" style={{ position: 'relative' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => setActiveDropdownExpenseId(activeDropdownExpenseId === e.id ? null : e.id)}
                          style={{ 
                            padding: '0.35rem 0.75rem', 
                            fontSize: '0.75rem', 
                            borderRadius: '6px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            height: 'auto'
                          }}
                        >
                          <UserPlus size={14} />
                          Atribuir...
                          <ChevronDown size={12} style={{ opacity: 0.7 }} />
                        </button>
                        {activeDropdownExpenseId === e.id && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '100%',
                              left: 0,
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
                            {people.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  assignExpense(e.id, p.id);
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
                                {p.linkedUserId === p.userId && (
                                  <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '0.05rem 0.25rem', borderRadius: '3px', fontWeight: 700 }}>Você</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteExpense(e.id)}
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
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              zIndex: 900,
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              padding: '0.6rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-xl)',
              maxWidth: '90%',
              width: 'max-content',
              flexWrap: 'wrap'
            }}
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
                          assignExpense(selectedIds[0], p.id);
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
      <Toaster position="bottom-right" />
    </MainLayout>
  )
}
