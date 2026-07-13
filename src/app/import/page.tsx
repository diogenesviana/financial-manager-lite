'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchImportPageData } from '@/lib/api-client'
import { Plus, Upload, UserPlus, X, Calendar, Loader2, Check, ChevronDown, Search, Trash2, CreditCard, Users, UserCheck, Phone, Mail, ArrowLeft, Edit2, QrCode, Eye, EyeOff } from 'lucide-react'
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
import { QrCodeScanner } from '@/components/QrCodeScanner'
import { parseNfceUrl } from '@/lib/nfce'
import CategoryBadge from '@/components/CategoryBadge'
import BankBadge from '@/components/BankBadge'
import PageHeader from '@/components/PageHeader'
import Skeleton from '@/components/Skeleton'

function ImportSkeleton() {
  return (
    <div className="card" style={{ padding: '2rem', marginTop: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Skeleton width="200px" height="1.3rem" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton width="42px" height="42px" style={{ borderRadius: 'var(--radius-md)' }} />
          <Skeleton width="42px" height="42px" style={{ borderRadius: 'var(--radius-md)' }} />
          <Skeleton width="120px" height="42px" style={{ borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
      {/* Search bar */}
      <Skeleton width="100%" height="42px" style={{ borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }} />
      {/* Table header */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '2px solid var(--border)', marginBottom: '0.5rem' }}>
        <Skeleton width="12%" height="0.75rem" />
        <Skeleton width="35%" height="0.75rem" />
        <Skeleton width="15%" height="0.75rem" />
        <Skeleton width="18%" height="0.75rem" />
        <Skeleton width="10%" height="0.75rem" />
        <Skeleton width="10%" height="0.75rem" />
      </div>
      {/* Table rows */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
          <Skeleton width="12%" height="0.85rem" />
          <div style={{ width: '35%', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <Skeleton width="85%" height="0.9rem" />
            <Skeleton width="50%" height="0.65rem" />
          </div>
          <Skeleton width="15%" height="0.9rem" />
          <div style={{ width: '18%', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Skeleton circle width={22} height={22} />
            <Skeleton width="60%" height="0.75rem" />
          </div>
          <Skeleton width="10%" height="1.3rem" style={{ borderRadius: '4px' }} />
          <Skeleton width="10%" height="1.5rem" style={{ borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  )
}

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
  if (!name) return ''
  return name.trim().charAt(0).toUpperCase()
}

const getAvatarColor = (name: string) => {
  if (!name) return { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1' }
  const colors = [
    { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1' },  // Índigo
    { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },  // Verde
    { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },  // Azul
    { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },  // Amarelo
    { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },   // Vermelho
    { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6' },  // Violeta
    { bg: 'rgba(236, 72, 153, 0.12)', text: '#ec4899' },  // Rosa
    { bg: 'rgba(6, 182, 212, 0.12)', text: '#06b6d4' }     // Ciano
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
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
    card: '',
    category: ''
  })
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAddManualForm, setShowAddManualForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showAddPdfModal, setShowAddPdfModal] = useState(false)
  const [showMonthSelectorModal, setShowMonthSelectorModal] = useState(false)
  const [pendingActionType, setPendingActionType] = useState<'pdf' | 'manual' | null>(null)
  const [tempSelectedMonth, setTempSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7))
  const [selectorYear, setSelectorYear] = useState(() => new Date().getFullYear())
  const [isCustomCard, setIsCustomCard] = useState(false)

  // States for password protected PDFs
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pdfPassword, setPdfPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingFilesList, setPendingFilesList] = useState<File[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const importStatsRef = useRef({ imported: 0, autoAssigned: 0 })

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
    
    // Verifica redirecionamento do painel para lançamento manual
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('add') === 'manual') {
      setPendingActionType('manual')
      setTempSelectedMonth(currentMonthStr)
      setShowMonthSelectorModal(true)
    }
  }, [])

  useEffect(() => {
    if (showAddManualForm) {
      fetch('/api/expenses/suggestions')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSuggestions(data)
          }
        })
        .catch(err => console.error('Erro ao buscar sugestões:', err))
    }
  }, [showAddManualForm])

  useEffect(() => {
    if (selectedMonth) {
      setManualExpense(prev => ({
        ...prev,
        date: getDefaultDateForMonth(selectedMonth)
      }))
    }
  }, [selectedMonth])

  useEffect(() => {
    if (showMonthSelectorModal && tempSelectedMonth) {
      const parts = tempSelectedMonth.split('-')
      const y = parseInt(parts[0])
      if (!isNaN(y)) {
        setSelectorYear(y)
      }
    }
  }, [showMonthSelectorModal, tempSelectedMonth])

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

  const processUploadQueue = async (files: File[], index: number, password?: string) => {
    if (index >= files.length) {
      setUploading(false)
      setUploadProgress('')
      if (importStatsRef.current.imported > 0) {
        toast.success(`Sucesso! ${importStatsRef.current.imported} despesas importadas (${importStatsRef.current.autoAssigned} atribuídas automaticamente).`)
      }
      fetchData(selectedMonth)
      
      // Reset state
      importStatsRef.current = { imported: 0, autoAssigned: 0 }
      setPendingFilesList([])
      setCurrentFileIndex(0)
      setPdfPassword('')
      setPasswordError('')
      setShowPasswordModal(false)
      return
    }

    const file = files[index]
    setUploading(true)
    setUploadProgress(`Analisando ${file.name} (${index + 1}/${files.length})...`)

    const formData = new FormData()
    formData.append('file', file)
    if (selectedMonth) {
      formData.append('month', selectedMonth)
    }
    if (password) {
      formData.append('password', password)
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        importStatsRef.current.imported += data.count || 0
        importStatsRef.current.autoAssigned += data.autoAssigned || 0
        
        // Reset password fields for next files
        setPdfPassword('')
        setPasswordError('')
        setShowPasswordModal(false)
        
        // Next file
        processUploadQueue(files, index + 1)
      } else {
        if (data.code === 'PASSWORD_REQUIRED' || data.code === 'WRONG_PASSWORD') {
          setPendingFilesList(files)
          setCurrentFileIndex(index)
          setShowPasswordModal(true)
          if (data.code === 'WRONG_PASSWORD') {
            setPasswordError('Senha incorreta. Por favor, tente novamente.')
          } else {
            setPasswordError('')
          }
          setUploading(false)
        } else {
          toast.error(data.error || `Erro ao processar o arquivo ${file.name}`)
          // Skip file and continue
          processUploadQueue(files, index + 1)
        }
      }
    } catch (error) {
      toast.error('Erro de conexão ao enviar arquivos')
      setUploading(false)
    }
  }

  const handleConfirmPassword = () => {
    if (!pdfPassword.trim()) {
      setPasswordError('Por favor, digite a senha do PDF.')
      return
    }
    const files = pendingFilesList
    const index = currentFileIndex
    const password = pdfPassword
    
    // Resume queue
    processUploadQueue(files, index, password)
  }

  const handleCancelPassword = () => {
    setShowPasswordModal(false)
    setPdfPassword('')
    setPasswordError('')
    // Skip this file and resume queue
    processUploadQueue(pendingFilesList, currentFileIndex + 1)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setShowAddPdfModal(false)
    processUploadQueue(Array.from(files), 0)
    e.target.value = ''
  }

  const handleQrCodeScanSuccess = (decodedText: string) => {
    setShowScanner(false)
    const result = parseNfceUrl(decodedText)
    
    if (result.amount !== undefined) {
      const formattedAmount = result.amount.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })

      // Preenche imediatamente o valor e data (se disponível) e exibe indicador de carregando
      setManualExpense(prev => ({
        ...prev,
        amount: formattedAmount,
        date: result.date || prev.date,
        description: 'Buscando estabelecimento...'
      }))
      
      toast.loading('Processando dados da nota...', { id: 'nfce-scan' })

      // Se tivermos a chave de acesso, podemos obter o CNPJ do emissor (dígitos 7 ao 20)
      if (result.key && result.key.length === 44) {
        const cnpj = result.key.substring(6, 20)
        fetch(`/api/cnpj/${cnpj}`)
          .then(res => {
            if (!res.ok) throw new Error()
            return res.json()
          })
          .then(data => {
            const storeName = data.nome_fantasia || data.razao_social || 'Nota Fiscal'
            setManualExpense(prev => ({
              ...prev,
              description: storeName
            }))
            toast.success(`Nota fiscal lida! R$ ${formattedAmount} em ${storeName}`, { id: 'nfce-scan' })
          })
          .catch(() => {
            setManualExpense(prev => ({
              ...prev,
              description: 'Nota Fiscal'
            }))
            toast.success(`Nota fiscal lida! Valor: R$ ${formattedAmount}`, { id: 'nfce-scan' })
          })
      } else {
        setManualExpense(prev => ({
          ...prev,
          description: 'Nota Fiscal'
        }))
        toast.success(`Nota fiscal lida! Valor: R$ ${formattedAmount}`, { id: 'nfce-scan' })
      }
    } else if (result.key) {
      toast.error('Nota fiscal identificada, mas não foi possível extrair o valor automaticamente. Digite-o manualmente.', { id: 'nfce-scan' })
    } else {
      toast.error('Código lido não parece ser de uma Nota Fiscal (NFC-e) válida.', { id: 'nfce-scan' })
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
          category: manualExpense.category || null,
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
          card: '',
          category: ''
        })
        setShowAddManualForm(false)
        setIsCustomCard(false)
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
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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

      {/* Header da Página Padrão */}
      <PageHeader
        title="Importar & Lançar"
        description="Lance despesas manualmente, envie faturas fechadas (PDF) ou puxe os gastos mais recentes importando seu extrato (CSV)."
        backHref="/"
      />

      <div className="import-options-grid">
        {/* Opção PDF */}
        <div 
          onClick={() => {
            setPendingActionType('pdf')
            setTempSelectedMonth(selectedMonth)
            setShowMonthSelectorModal(true)
          }}
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
          onClick={() => {
            setPendingActionType('manual')
            setTempSelectedMonth(selectedMonth)
            setShowMonthSelectorModal(true)
          }}
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
        <ImportSkeleton />
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
                {/* Mês de Destino Informacional */}
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} />
                  <span>Fatura: <strong style={{ color: 'var(--foreground)' }}>{formatMonthName(selectedMonth)}</strong></span>
                </div>
              </div>
            </div>

            {/* Row 2: Search Input (Full Width) */}
            <div className="table-filter-input-wrapper" style={{ margin: '0.5rem 0 0 0', width: '100%', maxWidth: 'none' }}>
              <Search size={16} className="table-filter-icon" />
              <input 
                type="text"
                id="searchQuery"
                name="searchQuery"
                autoComplete="off"
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
                key: 'amount',
                label: 'Valor',
                sortable: true,
                width: '13%',
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
                key: 'category',
                label: 'Categoria',
                sortable: true,
                width: '11%',
                render: (e) => <CategoryBadge category={e.category} />
              },
              {
                key: 'date',
                label: 'Data',
                sortable: true,
                width: '10%',
                render: (e) => {
                  const isNeg = e.amount < 0;
                  return (
                    <div style={{
                      color: isNeg ? 'var(--success)' : 'inherit',
                      fontWeight: isNeg ? 600 : 400,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap'
                    }}>
                      <span>{formatDate(e.date)}</span>
                      {showAllPending && e.month !== activeMonth && (
                        <span style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          border: '1px solid rgba(219, 20, 96, 0.15)',
                          display: 'inline-block'
                        }}>
                          → {formatMonthName(e.month).split(' / ')[0].substring(0, 3)}
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
                width: '11%',
                render: (e) => <BankBadge bank={e.card} />
              },
              {
                key: 'assign',
                label: 'Atribuir a',
                width: '16%',
                render: (e) => {
                  const isLastRows = false; // Simplified for DataTable as overflow might be handled differently
                  return (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {people.length <= 4 ? (
                        people.map(p => (
                          <Tooltip key={p.id} content={`Atribuir a ${p.name}`}>
                            <button
                             key={p.id}
                             onClick={(ev) => { ev.stopPropagation(); assignExpenses([e.id], p.id); }}
                             className="btn-avatar-assign"
                             style={p.avatar ? undefined : {
                               backgroundColor: getAvatarColor(p.name).bg,
                               color: getAvatarColor(p.name).text,
                               border: '1.5px solid var(--border)'
                             }}
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
                               key={p.id}
                               onClick={(ev) => { ev.stopPropagation(); assignExpenses([e.id], p.id); }}
                               className="btn-avatar-assign"
                               style={p.avatar ? undefined : {
                                 backgroundColor: getAvatarColor(p.name).bg,
                                 color: getAvatarColor(p.name).text,
                                 border: '1.5px solid var(--border)'
                               }}
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
                                      <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
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
                key: 'actions',
                label: 'Ações',
                width: '6%',
                align: 'center',
                render: (e) => (
                  <div className="flex-row flex-center gap-2">
                    <Tooltip content="Editar despesa" align="right">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); setEditingExpense(e); }}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                      >
                        <Edit2 size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Excluir despesa" align="right">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); deleteExpense(e.id); }}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                      >
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
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
                              → {formatMonthName(e.month).split(' / ')[0].substring(0, 3)}
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
                                      <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
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
                        className="btn btn-outline"
                        style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                      >
                        <Edit2 size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button 
                        onClick={(ev) => { ev.stopPropagation(); deleteExpense(e.id); }} 
                        className="btn btn-outline"
                        style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', borderColor: 'var(--border)' }}
                      >
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
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
          setIsCustomCard(false)
          setManualExpense({
            date: getTodayStr(),
            description: '',
            amount: '',
            personId: '',
            card: '',
            category: ''
          })
        }} 
        title="Novo Gasto Manual"
        maxWidth="650px"
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
              gap: '1.5rem',
              marginBottom: '0.25rem'
            }}
          >
            {/* Coluna 1: Informações principais */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Descrição</label>
                <input 
                  type="text" 
                  className="input" 
                  value={manualExpense.description} 
                  onChange={e => {
                    setManualExpense({...manualExpense, description: e.target.value})
                    setShowSuggestions(true)
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Ex: Mercado, Uber, Ifood..." 
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} 
                />
                {showSuggestions && manualExpense.description.trim().length >= 3 && (() => {
                  const filtered = suggestions.filter(s => s.toLowerCase().includes(manualExpense.description.toLowerCase()))
                  if (filtered.length === 0) return null;
                  return (
                    <div 
                      className="card-glass"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0.25rem'
                      }}
                    >
                      {filtered.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setManualExpense({ ...manualExpense, description: s })
                            setShowSuggestions(false)
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--foreground)',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'background-color 0.2s',
                            width: '100%'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(219, 20, 96, 0.08)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Valor (R$)</label>
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      fontSize: '0.72rem', 
                      color: 'var(--primary)', 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer', 
                      fontWeight: 700,
                      padding: 0
                    }}
                  >
                    <QrCode size={13} /> Ler QR Code
                  </button>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Vincular a</label>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Opcional</span>
                </div>
                <select className="input" value={manualExpense.personId} onChange={e => setManualExpense({...manualExpense, personId: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}>
                  <option value="">-- Não vincular (Deixar Pendente) --</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Coluna 2: Tempo e banco */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Instituição / Banco</label>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Opcional</span>
                </div>
                <select 
                  className="input" 
                  value={isCustomCard ? '___custom___' : manualExpense.card} 
                  onChange={e => {
                    const val = e.target.value
                    if (val === '___custom___') {
                      setIsCustomCard(true)
                      setManualExpense({...manualExpense, card: ''})
                    } else {
                      setIsCustomCard(false)
                      setManualExpense({...manualExpense, card: val})
                    }
                  }} 
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem 0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)', 
                    appearance: 'none', 
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 0.75rem center', 
                    backgroundSize: '1rem' 
                  }}
                >
                  <option value="">-- Selecione o Banco --</option>
                  {Array.from(new Set([
                    'Nubank', 
                    'Inter', 
                    'Itaú', 
                    'Bradesco', 
                    'Santander', 
                    'C6 Bank', 
                    'Caixa', 
                    'Banco do Brasil',
                    ...expenses.map(e => e.card).filter((c): c is string => !!c)
                  ])).sort().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="___custom___">-- Outro (digitar...) --</option>
                </select>
                {isCustomCard && (
                  <input 
                    type="text" 
                    className="input" 
                    value={manualExpense.card} 
                    onChange={e => setManualExpense({...manualExpense, card: e.target.value})} 
                    placeholder="Digite o nome do banco/cartão..." 
                    style={{ 
                      width: '100%', 
                      padding: '0.6rem 0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border)', 
                      marginTop: '0.5rem' 
                    }} 
                  />
                )}
              </div>

              {/* Categoria */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Categoria</label>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Opcional</span>
                </div>
                <select
                  className="input"
                  value={manualExpense.category}
                  onChange={e => setManualExpense({...manualExpense, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1rem'
                  }}
                >
                  <option value="">-- Selecione a Categoria --</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Casa">Casa</option>
                  <option value="Assinaturas">Assinaturas</option>
                  <option value="Educação">Educação</option>
                  <option value="Vestuário">Vestuário</option>
                  <option value="Viagem">Viagem</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button className="btn btn-outline" onClick={() => {
              setShowAddManualForm(false)
              setIsCustomCard(false)
              setManualExpense({
                date: getTodayStr(),
                description: '',
                amount: '',
                personId: '',
                card: '',
                category: ''
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

      {showScanner && (
        <QrCodeScanner 
          onScanSuccess={handleQrCodeScanSuccess} 
          onClose={() => setShowScanner(false)} 
        />
      )}

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

      {/* Modal: Desbloquear PDF com Senha */}
      <Modal
        isOpen={showPasswordModal}
        onClose={handleCancelPassword}
        title="🔒 PDF Protegido por Senha"
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            O arquivo <strong style={{ color: 'var(--foreground)' }}>{pendingFilesList[currentFileIndex]?.name}</strong> está protegido por senha. Insira a senha abaixo para desbloqueá-lo e importar as despesas:
          </p>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Senha do Arquivo
              </label>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                value={pdfPassword}
                onChange={(e) => {
                  setPdfPassword(e.target.value)
                  if (passwordError) setPasswordError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmPassword()
                }}
                placeholder="Digite a senha do PDF..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.6rem 2.75rem 0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: passwordError ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  color: 'var(--foreground)',
                  WebkitTextSecurity: showPassword ? 'none' : 'disc'
                } as any}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 600 }}>
                {passwordError}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <button 
              className="btn btn-outline" 
              onClick={handleCancelPassword} 
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleConfirmPassword} 
              disabled={!pdfPassword} 
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Desbloquear e Importar
            </button>
          </div>
        </div>
      </Modal>
      
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
                    <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', backgroundColor: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
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

      {/* Modal: Selecionar Mês de Referência */}
      <Modal
        isOpen={showMonthSelectorModal}
        onClose={() => {
          setShowMonthSelectorModal(false)
          setPendingActionType(null)
        }}
        title="Mês de Referência (Fatura)"
        maxWidth="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
            Selecione o mês da fatura para onde esses gastos devem ser importados/lançados:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: 'var(--background)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border)' 
            }}>
              <button 
                type="button" 
                onClick={() => setSelectorYear(y => y - 1)} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              >
                &larr;
              </button>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--foreground)' }}>
                {selectorYear}
              </span>
              <button 
                type="button" 
                onClick={() => setSelectorYear(y => y + 1)} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              >
                &rarr;
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '0.5rem',
              backgroundColor: 'var(--background)',
              padding: '0.75rem',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mLabel, idx) => {
                const mVal = `${selectorYear}-${String(idx + 1).padStart(2, '0')}`
                const isSelected = tempSelectedMonth === mVal
                return (
                  <button
                    key={mLabel}
                    type="button"
                    onClick={() => setTempSelectedMonth(mVal)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card)',
                      color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'var(--background)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'var(--card)';
                      }
                    }}
                  >
                    {mLabel}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={() => {
                setShowMonthSelectorModal(false)
                setPendingActionType(null)
              }}
              className="btn btn-outline"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setSelectedMonth(tempSelectedMonth)
                setShowMonthSelectorModal(false)
                if (pendingActionType === 'pdf') {
                  setShowAddPdfModal(true)
                } else if (pendingActionType === 'manual') {
                  setShowAddManualForm(true)
                }
                setPendingActionType(null)
              }}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            >
              Continuar
            </button>
          </div>
        </div>
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

      </motion.div>
    </MainLayout>
  )
}
