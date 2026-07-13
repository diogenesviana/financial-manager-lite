'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  Calendar, 
  Users, 
  SlidersHorizontal, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowLeft,
  Calendar as CalendarIcon,
  Tag,
  CreditCard,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'
import Tooltip from '@/components/Tooltip'
import DataTable, { Column } from '@/components/DataTable'
import ConfirmModal from '@/components/ConfirmModal'
import MonthSelector from '@/components/MonthSelector'
import EditExpenseModal from '@/components/EditExpenseModal'
import Modal from '@/components/Modal'
import CategoryBadge, { categoryColorMap } from '@/components/CategoryBadge'
import BankBadge from '@/components/BankBadge'

interface Person {
  id: string
  name: string
  avatar?: string | null
  monthlyTotal?: number
}

interface Expense {
  id: string
  date: string
  description: string
  amount: number
  personId: string | null
  person?: Person
  card?: string | null
  category?: string | null
  month: string
  isManual: boolean
  isPaid: boolean
  createdAt: string
}



function ExpensesSearchContent() {
  const router = useRouter()

  // Estado para ocultar/exibir integrantes zerados (salvo no localStorage)
  const [hideZeroMembers, setHideZeroMembers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('financial-manager:hide-zero-members')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  // Sincronizar com localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('financial-manager:hide-zero-members', String(hideZeroMembers))
  }, [hideZeroMembers])

  // Filtros e ordenação (estado aplicado — dispara a busca)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedPersonId, setSelectedPersonId] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedIsPaid, setSelectedIsPaid] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [sortOption, setSortOption] = useState('date-desc') // 'campo-direcao'
  const [showFilterPopup, setShowFilterPopup] = useState(false)

  // Estado "draft" do modal — só copiado para o estado real ao clicar em Aplicar
  const [draftMonth, setDraftMonth] = useState('all')
  const [draftCategory, setDraftCategory] = useState('all')
  const [draftIsPaid, setDraftIsPaid] = useState('all')
  const [draftSource, setDraftSource] = useState('all')
  const [draftSortOption, setDraftSortOption] = useState('date-desc')

  // Dados auxiliares para filtros
  const [people, setPeople] = useState<Person[]>([])
  const [dbMonths, setDbMonths] = useState<string[]>([])

  // Dados de exibição
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [filteredTotalAmount, setFilteredTotalAmount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Modais de edição/exclusão
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  // Utilitários de formatação
  const formatMonthName = (m: string) => {
    if (!m) return ''
    const [year, monthStr] = m.split('-')
    const date = new Date(parseInt(year, 10), parseInt(monthStr, 10) - 1, 15)
    const name = date.toLocaleDateString('pt-BR', { month: 'long' })
    return name.charAt(0).toUpperCase() + name.slice(1) + ' / ' + year
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    } catch {
      return dateStr
    }
  }

  const formatFullDateAndTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Carregar filtros (Membros e Meses cadastrados)
  const loadFilterOptions = useCallback(async (month: string) => {
    try {
      const [resPeople, resMonths] = await Promise.all([
        fetch(`/api/people?month=${month}`),
        fetch('/api/expenses/months')
      ])
      if (resPeople.ok) {
        const data = await resPeople.json()
        setPeople(data)
      }
      if (resMonths.ok) {
        const data = await resMonths.json()
        setDbMonths(data)
      }
    } catch (e) {
      console.error('Erro ao carregar opções de filtros:', e)
    }
  }, [])

  // Buscar gastos aplicando paginação e filtros
  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const [sortBy, sortDir] = sortOption.split('-')
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
        month: selectedMonth,
        personId: selectedPersonId,
        category: selectedCategory,
        isPaid: selectedIsPaid,
        source: selectedSource,
        sortBy,
        sortDir
      })

      const res = await fetch(`/api/expenses/search?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses)
        setTotalExpenses(data.pagination.total)
        setFilteredTotalAmount(data.totalAmount || 0)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast.error('Erro ao carregar extrato de despesas')
      }
    } catch (e) {
      console.error(e)
      toast.error('Falha na conexão ao buscar despesas')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm, selectedMonth, selectedPersonId, selectedCategory, selectedIsPaid, selectedSource, sortOption])

  // Efeito inicial e ao mudar de mês para carregar filtros de pessoas com gastos naquele mês
  useEffect(() => {
    loadFilterOptions(selectedMonth)
  }, [loadFilterOptions, selectedMonth])

  // Efeito para recarregar gastos ao alterar filtros/paginações
  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Resetar página ao alterar filtros
  const handleFilterChange = () => {
    setPage(1)
  }

  const hasActiveFilters = searchTerm !== '' || 
    selectedMonth !== 'all' || 
    selectedPersonId !== 'all' || 
    selectedCategory !== 'all' || 
    selectedIsPaid !== 'all' || 
    selectedSource !== 'all'

  const hasActiveFiltersExcludingSearch = selectedMonth !== 'all' || 
    selectedCategory !== 'all' || 
    selectedIsPaid !== 'all' || 
    selectedSource !== 'all'

  const activeFiltersCount = (selectedMonth !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedIsPaid !== 'all' ? 1 : 0) +
    (selectedSource !== 'all' ? 1 : 0)

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedMonth('all')
    setSelectedPersonId('all')
    setSelectedCategory('all')
    setSelectedIsPaid('all')
    setSelectedSource('all')
    setPage(1)
  }

  const clearAdvancedFilters = () => {
    setSelectedMonth('all')
    setSelectedCategory('all')
    setSelectedIsPaid('all')
    setSelectedSource('all')
    setPage(1)
  }

  // Abre o modal sincronizando os drafts com o estado atual
  const openFilterModal = () => {
    setDraftMonth(selectedMonth)
    setDraftCategory(selectedCategory)
    setDraftIsPaid(selectedIsPaid)
    setDraftSource(selectedSource)
    setDraftSortOption(sortOption)
    setShowFilterPopup(true)
  }

  // Aplica os drafts e fecha o modal
  const applyFilters = () => {
    setSelectedMonth(draftMonth)
    setSelectedCategory(draftCategory)
    setSelectedIsPaid(draftIsPaid)
    setSelectedSource(draftSource)
    setSortOption(draftSortOption)
    setPage(1)
    setShowFilterPopup(false)
  }

  // Limpa os drafts (sem aplicar ainda)
  const clearDraftFilters = () => {
    setDraftMonth('all')
    setDraftCategory('all')
    setDraftIsPaid('all')
    setDraftSource('all')
    setDraftSortOption('date-desc')
  }

  // Descarta os drafts ao fechar sem aplicar
  const closeFilterModal = () => {
    setDraftMonth(selectedMonth)
    setDraftCategory(selectedCategory)
    setDraftIsPaid(selectedIsPaid)
    setDraftSource(selectedSource)
    setDraftSortOption(sortOption)
    setShowFilterPopup(false)
  }

  // Excluir despesa
  const handleDeleteConfirm = async () => {
    if (!deletingExpenseId) return
    try {
      const res = await fetch(`/api/expenses/${deletingExpenseId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Despesa excluída com sucesso!')
        setDeletingExpenseId(null)
        fetchExpenses()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao excluir despesa')
      }
    } catch {
      toast.error('Erro de conexão ao excluir despesa')
    }
  }

  // Estilo padrão para dropdowns de filtros
  const selectStyle = {
    width: '100%',
    padding: '0.6rem 2rem 0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--foreground)',
    appearance: 'none' as any,
    backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s'
  }

  const getSelectStyle = (isActive: boolean) => ({
    ...selectStyle,
    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'var(--input-bg)',
    boxShadow: isActive ? '0 0 0 1px var(--primary)' : 'none',
    fontWeight: isActive ? 600 : 400
  })

  const searchInputStyle = (isActive: boolean) => ({
    paddingLeft: '2.25rem', 
    fontSize: '0.85rem', 
    width: '100%',
    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'var(--input-bg)',
    boxShadow: isActive ? '0 0 0 1px var(--primary)' : 'none',
    fontWeight: isActive ? 600 : 400,
    transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s'
  })

  // Definição das colunas da tabela (Desktop)
  const columns: Column<Expense>[] = [
    {
      key: 'description',
      label: 'Descrição',
      width: '30%',
      sortable: true,
      render: (e) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--foreground)', fontWeight: 500, fontSize: '0.88rem' }}>
            {e.description}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
            Inserido em {formatFullDateAndTime(e.createdAt)}
          </span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Valor',
      width: '11%',
      sortable: true,
      render: (e) => {
        const isNeg = e.amount < 0
        return (
          <span style={{ color: isNeg ? 'var(--success)' : 'var(--foreground)', fontWeight: 600, fontSize: '0.88rem' }}>
            {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
        )
      }
    },
    {
      key: 'category',
      label: 'Categoria',
      width: '11%',
      render: (e) => <CategoryBadge category={e.category} />
    },
    {
      key: 'isPaid',
      label: 'Status',
      width: '8%',
      render: (e) => (
        <span style={{
          fontSize: '0.72rem',
          padding: '0.2rem 0.45rem',
          borderRadius: '4px',
          fontWeight: 700,
          backgroundColor: e.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          color: e.isPaid ? 'var(--success)' : 'var(--text-muted)',
          border: e.isPaid ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid var(--border)'
        }}>
          {e.isPaid ? 'Pago' : 'Pendente'}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Data',
      width: '8%',
      sortable: true,
      render: (e) => (
        <span style={{ color: 'var(--foreground)', fontSize: '0.85rem' }}>
          {formatDate(e.date)}
        </span>
      )
    },
    {
      key: 'person',
      label: 'Atribuído a',
      width: '10%',
      render: (e) => {
        const p = e.person
        return p ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {p.avatar ? (
              <img src={p.avatar} alt={p.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700 }}>
                {getInitials(p.name)}
              </div>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>{p.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Pendente</span>
        )
      }
    },
    {
      key: 'card',
      label: 'Instituição',
      width: '10%',
      render: (e) => <BankBadge bank={e.card} />
    },
    {
      key: 'month',
      label: 'Fatura',
      width: '9%',
      render: (e) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
          {formatMonthName(e.month).split(' / ')[0]}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      width: '8%',
      align: 'right',
      render: (e) => (
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            className="action-btn"
            onClick={() => setEditingExpense(e)}
            style={{ padding: '0.35rem', borderRadius: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Edit2 size={15} />
          </button>
          <button
            className="action-btn"
            onClick={() => setDeletingExpenseId(e.id)}
            style={{ padding: '0.35rem', borderRadius: '6px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ]

  // Renderização do cartão para visualização mobile
  const renderMobileCard = (e: Expense) => {
    const isNeg = e.amount < 0
    
    return (
      <div 
        key={e.id}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.95rem' }}>{e.description}</span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>{formatDate(e.date)}</span>
              <span>•</span>
              <span>Fatura: {formatMonthName(e.month).split(' / ')[0]}</span>
              {e.card && (
                <>
                  <span>•</span>
                  <BankBadge bank={e.card} size="sm" />
                </>
              )}
            </div>
          </div>
          <span style={{ color: isNeg ? 'var(--success)' : 'var(--foreground)', fontWeight: 700, fontSize: '1rem' }}>
            {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '0.6rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <CategoryBadge category={e.category} />
            <span style={{ 
              fontSize: '0.68rem', 
              padding: '0.15rem 0.4rem', 
              borderRadius: '20px',
              fontWeight: 700,
              backgroundColor: e.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              color: e.isPaid ? 'var(--success)' : 'var(--text-muted)',
              border: e.isPaid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)'
            }}>
              {e.isPaid ? 'Pago' : 'Pendente'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {e.person ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {e.person.avatar ? (
                  <img src={e.person.avatar} alt={e.person.name} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: getAvatarColor(e.person.name).bg, color: getAvatarColor(e.person.name).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700 }}>
                    {getInitials(e.person.name)}
                  </div>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.person.name.split(' ')[0]}</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>Pendente</span>
            )}
            
            <div style={{ display: 'flex', gap: '0.15rem' }}>
              <button 
                onClick={() => setEditingExpense(e)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '0.25rem', cursor: 'pointer' }}
              >
                <Edit2 size={15} />
              </button>
              <button 
                onClick={() => setDeletingExpenseId(e.id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '0.25rem', cursor: 'pointer' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSort = (field: string) => {
    let newDir = 'desc'
    const [currentField, currentDir] = sortOption.split('-')
    if (currentField === field) {
      newDir = currentDir === 'desc' ? 'asc' : 'desc'
    } else {
      newDir = field === 'amount' ? 'desc' : 'desc'
    }
    setSortOption(`${field}-${newDir}`)
    setPage(1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header da Página Padrão */}
      <div className="flex-row flex-y-center gap-3" style={{ marginBottom: '2rem' }}>
        <Link href="/" className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-col">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
            Extrato Geral
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Busca global e gerenciamento completo de todos os gastos da sua conta.
          </p>
        </div>
      </div>

      {/* Barra de Integrantes Padrão do Sistema (Horizontal Scroll) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filtrar por Integrante
        </span>
        
        {/* Toggle Switch Estilizado no Padrão do App (iOS style) */}
        <div 
          onClick={() => setHideZeroMembers(!hideZeroMembers)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
        >
          <div 
            style={{
              width: '2.1rem',
              height: '1.15rem',
              backgroundColor: hideZeroMembers ? 'var(--primary)' : 'var(--border)',
              borderRadius: '999px',
              padding: '2px',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0
            }}
          >
            <div 
              style={{
                width: '0.9rem',
                height: '0.9rem',
                backgroundColor: '#fff',
                borderRadius: '50%',
                position: 'absolute',
                left: hideZeroMembers ? 'calc(100% - 0.9rem - 2px)' : '2px',
                top: '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ocultar sem gastos</span>
        </div>
      </div>

      <div className="members-horizontal-bar" style={{ marginBottom: '1.5rem' }}>
        {/* Todos */}
        <div
          className={`member-avatar-card ${selectedPersonId === 'all' ? 'active' : ''}`}
          onClick={() => { setSelectedPersonId('all'); handleFilterChange(); }}
        >
          <div className="avatar-wrapper">
            <div 
              className="avatar-placeholder" 
              style={{ 
                backgroundColor: selectedPersonId === 'all' ? 'var(--primary)' : 'var(--border)',
                color: selectedPersonId === 'all' ? '#fff' : 'var(--text-muted)'
              }}
            >
              *
            </div>
          </div>
          <span className="member-name">Todos</span>
        </div>

        {/* Pendentes */}
        <div
          className={`member-avatar-card ${selectedPersonId === 'none' ? 'active' : ''}`}
          onClick={() => { setSelectedPersonId('none'); handleFilterChange(); }}
        >
          <div className="avatar-wrapper">
            <div 
              className="avatar-placeholder" 
              style={{ 
                backgroundColor: selectedPersonId === 'none' ? 'var(--primary)' : 'var(--border)',
                color: selectedPersonId === 'none' ? '#fff' : 'var(--text-muted)'
              }}
            >
              ?
            </div>
          </div>
          <span className="member-name">Pendentes</span>
        </div>

        {/* Integrantes cadastrados */}
        {people
          .filter(p => !hideZeroMembers || (p.monthlyTotal && p.monthlyTotal > 0) || selectedPersonId === p.id)
          .map((p) => {
            const isActive = selectedPersonId === p.id
            return (
              <div
                key={p.id}
                className={`member-avatar-card ${isActive ? 'active' : ''}`}
                onClick={() => { setSelectedPersonId(p.id); handleFilterChange(); }}
              >
                <div className="avatar-wrapper">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder" style={{ background: getAvatarColor(p.name).bg, color: getAvatarColor(p.name).text }}>
                      {getInitials(p.name)}
                    </div>
                  )}
                </div>
                <span className="member-name">{p.name.split(' ')[0]}</span>
              </div>
            )
          })}
      </div>

      {/* Barra de Pesquisa e Botão de Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center', position: 'relative' }}>
        {/* Campo de Busca Principal */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: searchTerm ? 'var(--primary)' : 'var(--text-muted)', pointerEvents: 'none', transition: 'color 0.2s' }} />
          <input
            type="text"
            placeholder="Buscar por descrição, banco ou valor..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
            className="input"
            style={searchInputStyle(searchTerm !== '')}
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); handleFilterChange(); }} 
              style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Botão de Filtros */}
        <button
          onClick={openFilterModal}
          className={`btn ${hasActiveFiltersExcludingSearch ? 'btn-primary' : 'btn-outline'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1.25rem',
            height: '42px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span style={{
              backgroundColor: hasActiveFiltersExcludingSearch ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              borderRadius: '50%',
              width: '1.1rem',
              height: '1.1rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.15rem'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal de Filtros Avançados — padrão do sistema */}
      <Modal
        isOpen={showFilterPopup}
        onClose={closeFilterModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
            <span>Filtros Avançados</span>
            {hasActiveFiltersExcludingSearch && (
              <span style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.45rem',
                borderRadius: '20px',
                border: '1px solid rgba(219,20,96,0.2)'
              }}>
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        }
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Filtro por Mês */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fatura / Mês
            </label>
            <MonthSelector
              activeMonth={draftMonth}
              availableMonths={dbMonths}
              onMonthChange={(m) => setDraftMonth(m)}
              showLabel={false}
              allowAll={true}
            />
          </div>

          {/* Filtro por Categoria */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Categoria
            </label>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="all">🏷️ Todas as Categorias</option>
              {Object.keys(categoryColorMap).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status de Pagamento
            </label>
            <select
              value={draftIsPaid}
              onChange={(e) => setDraftIsPaid(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="all">💵 Todos os Status</option>
              <option value="true">✅ Pago</option>
              <option value="false">⏳ Pendente</option>
            </select>
          </div>

          {/* Filtro por Origem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Origem do Gasto
            </label>
            <select
              value={draftSource}
              onChange={(e) => setDraftSource(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="all">📂 Todas as Origens</option>
              <option value="manual">✏️ Manual</option>
              <option value="pdf">📄 Fatura de Cartão (PDF)</option>
            </select>
          </div>

          {/* Ordenação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ordenar Por
            </label>
            <select
              value={draftSortOption}
              onChange={(e) => setDraftSortOption(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            >
              <option value="date-desc">🗓️ Data da Transação (Mais Recente)</option>
              <option value="date-asc">🗓️ Data da Transação (Mais Antiga)</option>
              <option value="createdAt-desc">📥 Data de Cadastro (Mais Recente)</option>
              <option value="createdAt-asc">📥 Data de Cadastro (Mais Antiga)</option>
              <option value="amount-desc">💰 Valor (Maior)</option>
              <option value="amount-asc">💰 Valor (Menor)</option>
            </select>
          </div>

          {/* Rodapé: Limpar + Aplicar */}
          <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-outline"
              onClick={clearDraftFilters}
              disabled={draftMonth === 'all' && draftCategory === 'all' && draftIsPaid === 'all' && draftSource === 'all' && draftSortOption === 'date-desc'}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Limpar Filtros
            </button>
            <button
              className="btn btn-primary"
              onClick={applyFilters}
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      </Modal>

      {/* Tabela de Resultados */}
      <div className="card card-glass" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 1s linear infinite'
            }}>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Buscando gastos...</span>
          </div>
        ) : (
          <>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total de gastos encontrados: <strong style={{ color: 'var(--foreground)' }}>{totalExpenses}</strong>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Soma dos gastos filtrados: <strong style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700 }}>R$ {filteredTotalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>

            <DataTable
              data={expenses}
              columns={columns}
              keyExtractor={(e) => e.id}
              emptyMessage={
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <X size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>Nenhum gasto corresponde aos filtros aplicados.</p>
                </div>
              }
              renderMobileCard={renderMobileCard}
              sortField={sortOption.split('-')[0]}
              sortDirection={sortOption.split('-')[1] as 'asc' | 'desc'}
              onSort={handleSort}
            />
          </>
        )}
      </div>

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', gap: '1rem', flexWrap: 'wrap', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Itens por página:</span>
            <div style={{ position: 'relative' }}>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                className="input"
                style={{ ...selectStyle, width: 'auto', padding: '0.25rem 1.75rem 0.25rem 0.5rem', height: 'auto', fontSize: '0.8rem' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                className="btn btn-outline"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.4rem 0.6rem', height: 'auto' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '0.4rem 0.6rem', height: 'auto' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Gasto"
        message="Tem certeza de que deseja excluir este gasto? Esta ação não pode ser desfeita."
      />

      {/* Modal de Edição */}
      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense as any}
        onSuccess={() => {
          fetchExpenses()
          toast.success('Despesa atualizada com sucesso!')
        }}
      />
    </motion.div>
  )
}

export default function ExpensesSearchPage() {
  return (
    <MainLayout>
      <ExpensesSearchContent />
    </MainLayout>
  )
}
