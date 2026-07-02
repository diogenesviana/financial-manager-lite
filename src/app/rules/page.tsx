'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { fetchRulesData } from '@/lib/api-client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Trash2, Zap, Search, Settings, X, PieChart, LogOut, Shield, Users, ArrowLeft, HelpCircle, Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import ConfirmModal from '@/components/ConfirmModal'
import Modal from '@/components/Modal'
import Tooltip from '@/components/Tooltip'
import BulkActionsBar from '@/components/BulkActionsBar'

import MainLayout from '@/components/MainLayout'
import PageLoader from '@/components/PageLoader'

interface Person {
  id: string
  name: string
  avatar?: string | null
}

interface AssignmentRule {
  id: string
  keyword: string
  personId: string
  person?: Person
}

interface CategoryRule {
  id: string
  keyword: string
  category: string
  userId: string
}

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Assinaturas',
  'Saúde',
  'Lazer',
  'Casa',
  'Vestuário',
  'Educação',
  'Viagem',
  'Outros'
]

function RulesPageContent() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([])
  const [loading, setLoading] = useState(true)
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'people' | 'category'>('people')

  // Modals and form states for AssignmentRules (People)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [selectedPersonForRule, setSelectedPersonForRule] = useState<Person | null>(null)
  const [ruleKeyword, setRuleKeyword] = useState('')
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([])
  const [deletingBulk, setDeletingBulk] = useState(false)

  // Modals and form states for CategoryRules
  const [showAddCategoryRuleModal, setShowAddCategoryRuleModal] = useState(false)
  const [selectedCategoryForRule, setSelectedCategoryForRule] = useState<string | null>(null)
  const [categoryRuleKeyword, setCategoryRuleKeyword] = useState('')
  const [selectedCategoryRuleIds, setSelectedCategoryRuleIds] = useState<string[]>([])
  const [deletingCategoryBulk, setDeletingCategoryBulk] = useState(false)

  const [search, setSearch] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [applyingRules, setApplyingRules] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{ totalRules: number; totalExpenses: number; changes: any[] } | null>(null)

  const hasLoadedInitially = useRef(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await fetchRulesData()
      
      setPeople(data.people)
      setRules(data.rules)
      setCategoryRules(data.categoryRules || [])
      
      if (!hasLoadedInitially.current) {
        if (data.rules.length === 0 && (!data.categoryRules || data.categoryRules.length === 0)) {
          setShowHowItWorks(true)
        }
        hasLoadedInitially.current = true
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyRules = async () => {
    setApplyingRules(true)
    const toastId = toast.loading('Analisando regras de categorias (dry-run)...')
    try {
      const res = await fetch('/api/expenses/apply-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true })
      })
      const data = await res.json()
      if (res.ok) {
        toast.dismiss(toastId)
        setPreviewData(data)
        setIsPreviewModalOpen(true)
      } else {
        toast.error(data.error || 'Erro ao simular regras', { id: toastId })
      }
    } catch (err) {
      toast.error('Erro de conexão com o servidor', { id: toastId })
    } finally {
      setApplyingRules(false)
    }
  }

  const handleConfirmApplyRules = async () => {
    setApplyingRules(true)
    setIsPreviewModalOpen(false)
    const toastId = toast.loading('Aplicando alterações no banco de dados...')
    try {
      const res = await fetch('/api/expenses/apply-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(
          `Sincronização concluída! ${data.updatedCount} despesa(s) atualizada(s).`,
          { id: toastId }
        )
      } else {
        toast.error(data.error || 'Erro ao sincronizar categorias', { id: toastId })
      }
    } catch (err) {
      toast.error('Erro de conexão com o servidor', { id: toastId })
    } finally {
      setApplyingRules(false)
      setPreviewData(null)
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [people, activeTab])

  useEffect(() => {
    const el = categoryScrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [categoryRules, activeTab])

  // --- AssignmentRule (People) Actions ---
  const addRule = async () => {
    if (!ruleKeyword.trim()) {
      toast.error('Digite uma palavra-chave')
      return
    }
    if (!selectedPersonForRule) {
      toast.error('Selecione uma pessoa')
      return
    }
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: ruleKeyword.trim(), personId: selectedPersonForRule.id }),
      })
      if (res.ok) {
        toast.success(`Regra "${ruleKeyword}" criada!`)
        setRuleKeyword('')
        setShowAddRuleModal(false)
        setSelectedPersonForRule(null)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao criar regra')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  const deleteRule = async (id: string, keyword: string) => {
    setConfirmDialog({
      message: `Remover a regra "${keyword}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' })
          if (res.ok) {
            toast.success('Regra removida!')
            setSelectedRuleIds(prev => prev.filter(r => r !== id))
            fetchData()
          } else {
            toast.error('Erro ao remover regra')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
  }

  const handleBulkDelete = () => {
    setConfirmDialog({
      message: `Deseja realmente excluir ${selectedRuleIds.length} regras selecionadas?`,
      onConfirm: async () => {
        setDeletingBulk(true)
        try {
          await Promise.all(
            selectedRuleIds.map(id => fetch(`/api/rules/${id}`, { method: 'DELETE' }))
          )
          toast.success(`${selectedRuleIds.length} regras excluídas com sucesso!`)
          setSelectedRuleIds([])
          fetchData()
        } catch (error) {
          toast.error('Erro ao excluir regras em lote')
        } finally {
          setDeletingBulk(false)
        }
      }
    })
  }

  const toggleSelectRule = (id: string) => {
    setSelectedRuleIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  // --- CategoryRule Actions ---
  const addCategoryRule = async () => {
    if (!categoryRuleKeyword.trim()) {
      toast.error('Digite uma palavra-chave')
      return
    }
    if (!selectedCategoryForRule) {
      toast.error('Selecione uma categoria')
      return
    }
    try {
      const res = await fetch('/api/category-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: categoryRuleKeyword.trim().toLowerCase(), category: selectedCategoryForRule }),
      })
      if (res.ok) {
        toast.success(`Regra de categoria "${categoryRuleKeyword}" criada!`)
        setCategoryRuleKeyword('')
        setShowAddCategoryRuleModal(false)
        setSelectedCategoryForRule(null)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao criar regra')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  const deleteCategoryRule = async (id: string, keyword: string) => {
    setConfirmDialog({
      message: `Remover a regra de categoria "${keyword}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/category-rules/${id}`, { method: 'DELETE' })
          if (res.ok) {
            toast.success('Regra de categoria removida!')
            setSelectedCategoryRuleIds(prev => prev.filter(r => r !== id))
            fetchData()
          } else {
            toast.error('Erro ao remover regra')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
  }

  const handleCategoryBulkDelete = () => {
    setConfirmDialog({
      message: `Deseja realmente excluir ${selectedCategoryRuleIds.length} regras de categoria selecionadas?`,
      onConfirm: async () => {
        setDeletingCategoryBulk(true)
        try {
          await Promise.all(
            selectedCategoryRuleIds.map(id => fetch(`/api/category-rules/${id}`, { method: 'DELETE' }))
          )
          toast.success(`${selectedCategoryRuleIds.length} regras excluídas com sucesso!`)
          setSelectedCategoryRuleIds([])
          fetchData()
        } catch (error) {
          toast.error('Erro ao excluir regras em lote')
        } finally {
          setDeletingCategoryBulk(false)
        }
      }
    })
  }

  const toggleSelectCategoryRule = (id: string) => {
    setSelectedCategoryRuleIds(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  // --- Filtering & Grouping ---
  const rulesByPerson = rules.reduce((acc, rule) => {
    const name = rule.person?.name || 'Desconhecido'
    if (!acc[name]) acc[name] = []
    acc[name].push(rule)
    return acc
  }, {} as Record<string, AssignmentRule[]>)

  const categoryRulesByCat = categoryRules.reduce((acc, rule) => {
    const cat = rule.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(rule)
    return acc
  }, {} as Record<string, CategoryRule[]>)

  // Filtered Person Rules
  const filteredRules = search.trim()
    ? rules.filter(r =>
        r.keyword.toLowerCase().includes(search.toLowerCase()) ||
        (r.person?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : rules

  const filteredByPerson = filteredRules.reduce((acc, rule) => {
    const name = rule.person?.name || 'Desconhecido'
    if (!acc[name]) acc[name] = []
    acc[name].push(rule)
    return acc
  }, {} as Record<string, AssignmentRule[]>)

  // Filtered Category Rules
  const filteredCategoryRules = search.trim()
    ? categoryRules.filter(r =>
        r.keyword.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
      )
    : categoryRules

  const filteredByCat = filteredCategoryRules.reduce((acc, rule) => {
    const cat = rule.category || 'Outros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(rule)
    return acc
  }, {} as Record<string, CategoryRule[]>)

  return (
    <MainLayout>
      {/* Header da Página Padrão */}
      <div className="flex-row flex-y-center gap-3" style={{ marginBottom: '2rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="flex-row flex-y-center gap-3">
          <Link href="/" className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-col">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Regras Automáticas
              <button 
                onClick={() => setShowHowItWorks(true)}
                style={{ 
                  background: 'rgba(255, 26, 119, 0.1)', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 26, 119, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 26, 119, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                title="Como funcionam as regras?"
              >
                <HelpCircle size={16} strokeWidth={2.5} />
              </button>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Configure regras de auto-atribuição e auto-categorização de despesas a partir de palavras-chave.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-row" style={{ gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0px' }}>
        <button
          onClick={() => { setActiveTab('people'); setSearch(''); }}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'people' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'people' ? 'var(--foreground)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          Atribuição de Integrantes
        </button>
        <button
          onClick={() => { setActiveTab('category'); setSearch(''); }}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'category' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'category' ? 'var(--foreground)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          Categorização de Gastos
        </button>
      </div>

      {activeTab === 'people' ? (
        <>
          {/* Add Rule Selector */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card card-glass"
            style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}
          >
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Criar Regra Automática (Clique em um integrante)
            </h3>
            
            {people.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontStyle: 'italic', fontWeight: 500, margin: 0 }}>
                Cadastre integrantes no Painel de Pessoas antes de criar regras.
              </p>
            ) : (
              <div className="members-horizontal-bar" ref={scrollRef}>
                {people.map(p => (
                  <div
                    key={p.id}
                    className="member-avatar-card"
                    onClick={() => {
                      setSelectedPersonForRule(p)
                      setRuleKeyword('')
                      setShowAddRuleModal(true)
                    }}
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
                      {rules.filter(r => r.personId === p.id).length} regras
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Rules List */}
          {loading ? (
            <PageLoader title="Carregando regras..." description="Buscando as regras de atribuição de integrantes." />
          ) : rules.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card card-glass flex-col flex-center"
              style={{ padding: '4rem 2rem', textAlign: 'center' }}
            >
              <Zap size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                Nenhuma regra de integrante cadastrada
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Cadastre sua primeira regra acima clicando em um integrante para automatizar quem paga o quê ao importar faturas.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Search */}
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  placeholder="Buscar regra ou pessoa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {/* Summary */}
              <div className="flex-row gap-4" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="card card-glass flex-col gap-1" style={{ padding: '1.5rem 1.25rem', flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total de Regras
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {rules.length}
                  </div>
                </div>
                <div className="card card-glass flex-col gap-1" style={{ padding: '1.5rem 1.25rem', flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pessoas com Regras
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {Object.keys(rulesByPerson).length}
                  </div>
                </div>
              </div>

              {/* Grouped by person */}
              <div className="flex-col gap-4">
                <AnimatePresence>
                  {Object.entries(filteredByPerson).map(([personName, personRules], idx) => {
                    const personObj = people.find(p => p.name === personName)
                    return (
                      <motion.div
                        key={personName}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="card card-glass"
                        style={{ padding: '1.5rem' }}
                      >
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            {personObj?.avatar ? (
                              <img 
                                src={personObj.avatar} 
                                alt={personName}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border)'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary-light)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 700
                              }}>
                                {personName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {personName}
                          </h3>
                          <span className="badge badge-blue">
                            {personRules.length} regra{personRules.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex-row gap-2 flex-wrap">
                          {personRules.map(rule => (
                            <motion.div
                              key={rule.id}
                              layout
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="flex-row flex-y-center"
                              style={{
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem 0.45rem 0.75rem',
                                background: selectedRuleIds.includes(rule.id) ? 'rgba(219, 20, 96, 0.05)' : 'var(--background)',
                                border: `1px solid ${selectedRuleIds.includes(rule.id) ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleSelectRule(rule.id)}
                            >
                              <div 
                                className="checkbox-custom"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  border: `2px solid ${selectedRuleIds.includes(rule.id) ? 'var(--primary)' : 'var(--text-muted)'}`,
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: selectedRuleIds.includes(rule.id) ? 'var(--primary)' : 'transparent',
                                  transition: 'all 0.2s',
                                  marginRight: '4px'
                                }}
                              >
                                {selectedRuleIds.includes(rule.id) && <X size={12} color="white" style={{ transform: 'rotate(45deg)' }} />}
                              </div>
                              <span style={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: 'var(--primary)',
                              }}>
                                {rule.keyword}
                              </span>
                              <Tooltip content="Remover regra">
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteRule(rule.id, rule.keyword); }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'color 0.15s'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Add Category Rule Selector */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card card-glass"
            style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}
          >
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Criar Regra de Categoria (Clique em uma categoria)
            </h3>
            
            <div className="members-horizontal-bar" ref={categoryScrollRef}>
              {CATEGORIES.map(cat => (
                <div
                  key={cat}
                  className="member-avatar-card"
                  onClick={() => {
                    setSelectedCategoryForRule(cat)
                    setCategoryRuleKeyword('')
                    setShowAddCategoryRuleModal(true)
                  }}
                  style={{ minWidth: '95px' }}
                >
                  <div className="avatar-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}>
                      {cat.charAt(0)}
                    </div>
                  </div>
                  <span className="member-name" style={{ marginTop: '0.5rem' }}>{cat}</span>
                  <span className="member-total">
                    {categoryRules.filter(r => r.category === cat).length} regras
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action Row - Sempre visível */}
          <div className="flex-row" style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button
              onClick={applyingRules ? undefined : handleApplyRules}
              disabled={applyingRules}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                opacity: applyingRules ? 0.7 : 1,
                cursor: applyingRules ? 'not-allowed' : 'pointer'
              }}
            >
              {applyingRules ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Sincronizar Categorias
            </button>
          </div>

          {/* Category Rules List */}
          {loading ? (
            <PageLoader title="Carregando regras..." description="Buscando as regras de categorias." />
          ) : categoryRules.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card card-glass flex-col flex-center"
              style={{ padding: '4rem 2rem', textAlign: 'center' }}
            >
              <Zap size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                Nenhuma regra de categoria cadastrada
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Cadastre sua primeira regra acima clicando em uma categoria para auto-classificar compras no PDF de fatura.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Search */}
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  placeholder="Buscar palavra-chave ou categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {/* Summary */}
              <div className="flex-row gap-4" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="card card-glass flex-col gap-1" style={{ padding: '1.5rem 1.25rem', flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total de Regras
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {categoryRules.length}
                  </div>
                </div>
                <div className="card card-glass flex-col gap-1" style={{ padding: '1.5rem 1.25rem', flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Categorias Mapeadas
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {Object.keys(categoryRulesByCat).length}
                  </div>
                </div>
              </div>

              {/* Grouped by category */}
              <div className="flex-col gap-4">
                <AnimatePresence>
                  {Object.entries(filteredByCat).map(([catName, catRules], idx) => {
                    return (
                      <motion.div
                        key={catName}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="card card-glass"
                        style={{ padding: '1.5rem' }}
                      >
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}>
                              {catName.charAt(0)}
                            </div>
                            {catName}
                          </h3>
                          <span className="badge badge-blue">
                            {catRules.length} regra{catRules.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex-row gap-2 flex-wrap">
                          {catRules.map(rule => (
                            <motion.div
                              key={rule.id}
                              layout
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="flex-row flex-y-center"
                              style={{
                                gap: '0.5rem',
                                padding: '0.45rem 0.5rem 0.45rem 0.75rem',
                                background: selectedCategoryRuleIds.includes(rule.id) ? 'rgba(219, 20, 96, 0.05)' : 'var(--background)',
                                border: `1px solid ${selectedCategoryRuleIds.includes(rule.id) ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleSelectCategoryRule(rule.id)}
                            >
                              <div 
                                className="checkbox-custom"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  border: `2px solid ${selectedCategoryRuleIds.includes(rule.id) ? 'var(--primary)' : 'var(--text-muted)'}`,
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: selectedCategoryRuleIds.includes(rule.id) ? 'var(--primary)' : 'transparent',
                                  transition: 'all 0.2s',
                                  marginRight: '4px'
                                }}
                              >
                                {selectedCategoryRuleIds.includes(rule.id) && <X size={12} color="white" style={{ transform: 'rotate(45deg)' }} />}
                              </div>
                              <span style={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: 'var(--primary)',
                              }}>
                                {rule.keyword}
                              </span>
                              <Tooltip content="Remover regra de categoria">
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteCategoryRule(rule.id, rule.keyword); }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'color 0.15s'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </>
      )}

      {/* Bulk Actions */}
      {activeTab === 'people' ? (
        <BulkActionsBar
          selectedCount={selectedRuleIds.length}
          subtitle="regras selecionadas"
          isVisible={selectedRuleIds.length > 0}
        >
          <button
            onClick={handleBulkDelete}
            disabled={deletingBulk}
            className="btn btn-danger"
          >
            {deletingBulk ? 'Excluindo...' : (
              <>
                <Trash2 size={14} />
                Excluir
              </>
            )}
          </button>
        </BulkActionsBar>
      ) : (
        <BulkActionsBar
          selectedCount={selectedCategoryRuleIds.length}
          subtitle="regras de categoria selecionadas"
          isVisible={selectedCategoryRuleIds.length > 0}
        >
          <button
            onClick={handleCategoryBulkDelete}
            disabled={deletingCategoryBulk}
            className="btn btn-danger"
          >
            {deletingCategoryBulk ? 'Excluindo...' : (
              <>
                <Trash2 size={14} />
                Excluir
              </>
            )}
          </button>
        </BulkActionsBar>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm()
        }}
        message={confirmDialog?.message || ''}
      />

      {/* Add Rule Modal (People) */}
      <Modal 
        isOpen={showAddRuleModal && !!selectedPersonForRule} 
        onClose={() => {
          setShowAddRuleModal(false)
          setSelectedPersonForRule(null)
          setRuleKeyword('')
        }} 
        title="Nova Regra Automática"
        maxWidth="450px"
      >
        <div className="flex-col gap-3">
          {selectedPersonForRule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '0.25rem' }}>
              {selectedPersonForRule.avatar ? (
                <img 
                  src={selectedPersonForRule.avatar} 
                  alt={selectedPersonForRule.name} 
                  style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
                />
              ) : (
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', border: '2px solid var(--primary)' }}>
                  {selectedPersonForRule.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-col">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atribuir despesa para</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)' }}>{selectedPersonForRule.name}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>Palavra-chave</label>
            <input
              className="input"
              placeholder="Ex: uber, ifood, netflix..."
              value={ruleKeyword}
              autoFocus
              onChange={(e) => setRuleKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRule()}
              style={{ width: '100%', padding: '0.55rem 0.75rem' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block', lineHeight: '1.3' }}>
              💡 Qualquer despesa importada contendo esta palavra-chave será associada a {selectedPersonForRule?.name} automaticamente.
            </span>
          </div>

          <div className="flex-row gap-2" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              onClick={() => {
                setShowAddRuleModal(false)
                setSelectedPersonForRule(null)
                setRuleKeyword('')
              }} 
              className="btn btn-outline" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Cancelar
            </button>
            <button 
              onClick={addRule} 
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Adicionar Regra
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Category Rule Modal */}
      <Modal 
        isOpen={showAddCategoryRuleModal && !!selectedCategoryForRule} 
        onClose={() => {
          setShowAddCategoryRuleModal(false)
          setSelectedCategoryForRule(null)
          setCategoryRuleKeyword('')
        }} 
        title="Nova Regra de Categoria"
        maxWidth="450px"
      >
        <div className="flex-col gap-3">
          {selectedCategoryForRule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '0.25rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', border: '2px solid var(--primary)' }}>
                {selectedCategoryForRule.charAt(0)}
              </div>
              <div className="flex-col">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mapear compras para categoria</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)' }}>{selectedCategoryForRule}</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>Palavra-chave</label>
            <input
              className="input"
              placeholder="Ex: posto, petz, farmacia..."
              value={categoryRuleKeyword}
              autoFocus
              onChange={(e) => setCategoryRuleKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategoryRule()}
              style={{ width: '100%', padding: '0.55rem 0.75rem' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block', lineHeight: '1.3' }}>
              💡 Qualquer despesa contendo esta palavra-chave será automaticamente classificada na categoria "{selectedCategoryForRule}".
            </span>
          </div>

          <div className="flex-row gap-2" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              onClick={() => {
                setShowAddCategoryRuleModal(false)
                setSelectedCategoryForRule(null)
                setCategoryRuleKeyword('')
              }} 
              className="btn btn-outline" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Cancelar
            </button>
            <button 
              onClick={addCategoryRule} 
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              Adicionar Regra
            </button>
          </div>
        </div>
      </Modal>

      {/* How it Works Modal */}
      <Modal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} title="Como funcionam as regras?" maxWidth="500px">
        <div className="flex-col gap-4">
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #a855f7)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', margin: '0 auto' }}>
            <Zap size={32} color="white" />
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--foreground)', lineHeight: 1.6, textAlign: 'center', margin: 0 }}>
            As <strong>Regras Automáticas</strong> ajudam você a não ter que classificar ou atribuir gastos um por um.
          </p>
          <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.25rem' }}>1. Atribuição de Integrantes:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Associe palavras-chave a integrantes do grupo. Qualquer despesa importada contendo esse termo será atribuída a ele automaticamente.
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}><em>Ex: "uber" → Maria</em></span>

            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.25rem', marginTop: '1rem' }}>2. Categorização de Gastos:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Mapeie palavras-chave para categorias específicas. O sistema classificará a despesa na categoria cadastrada.
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}><em>Ex: "posto" → Transporte</em></span>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }} onClick={() => setShowHowItWorks(false)}>
            Entendi!
          </button>
        </div>
      </Modal>

      {/* Category Rules Preview Modal for Common User */}
      <Modal 
        isOpen={isPreviewModalOpen} 
        onClose={() => { if (!applyingRules) setIsPreviewModalOpen(false); }} 
        title="Sincronização de Categorias (Simulação)"
        maxWidth="600px"
      >
        {previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px', backgroundColor: 'var(--input-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Minhas Regras</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)' }}>{previewData.totalRules}</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', backgroundColor: 'var(--input-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Meus Gastos</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)' }}>{previewData.totalExpenses}</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', backgroundColor: previewData.changes.length > 0 ? 'rgba(234, 179, 8, 0.08)' : 'var(--input-bg)', padding: '0.75rem', borderRadius: '8px', border: previewData.changes.length > 0 ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: previewData.changes.length > 0 ? '#eab308' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>A Atualizar</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: previewData.changes.length > 0 ? '#eab308' : 'var(--foreground)' }}>{previewData.changes.length}</div>
              </div>
            </div>

            {previewData.changes.length > 0 ? (
              <>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Os seguintes gastos pessoais serão atualizados com base nas suas regras de categoria:
                </p>
                
                <div style={{ 
                  maxHeight: '250px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  padding: '0.5rem',
                  backgroundColor: 'var(--background)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {previewData.changes.map((item, idx) => (
                    <div key={item.id || idx} style={{ 
                      padding: '0.75rem', 
                      borderRadius: '6px', 
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)', wordBreak: 'break-word' }}>
                          {item.description}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                          R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Ref: {item.month}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.oldCategory}</span>
                          <span style={{ color: 'var(--primary)' }}>➔</span>
                          <span style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>{item.newCategory}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    disabled={applyingRules}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmApplyRules}
                    disabled={applyingRules}
                    className="btn btn-primary"
                    style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {applyingRules ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={14} />}
                    Confirmar Sincronização
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2.5rem' }}>✨</div>
                <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--foreground)' }}>Tudo em Conformidade!</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.5 }}>
                  Todos os seus gastos já estão com as categorias corretas conforme suas regras atuais.
                </p>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem', width: '120px' }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}

export default function RulesPage() {
  return (
    <Suspense fallback={<PageLoader title="Carregando regras..." description="Preparando tela de regras." />}>
      <RulesPageContent />
    </Suspense>
  )
}
