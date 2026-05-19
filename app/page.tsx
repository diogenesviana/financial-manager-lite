'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Upload, Trash2, UserPlus, Check, ChevronRight, PieChart, CreditCard, Users, Settings, X, Calendar, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

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

interface AssignmentRule {
  id: string
  keyword: string
  personId: string
  person?: Person
}

function HomeContent() {
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showAddManual, setShowAddManual] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [manualExpense, setManualExpense] = useState({ date: '', description: '', amount: '', personId: '', card: '' })
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [newRule, setNewRule] = useState({ keyword: '', personId: '' })

  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"

  const fetchData = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const [peopleRes, expensesRes, rulesRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/expenses?t=${t}`),
        fetch(`/api/rules?t=${t}`)
      ])
      const peopleData = await peopleRes.json()
      const expensesData = await expensesRes.json()
      const rulesData = await rulesRes.json()
      setPeople(Array.isArray(peopleData) ? peopleData : [])
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setRules(Array.isArray(rulesData) ? rulesData : [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-open settings if redirected with ?settings=true
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('settings') === 'true') {
      setShowSettings(true)
    }
  }, [searchParams])

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

  const assignExpense = async (expenseId: string, personId: string | null) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId }),
      })
      if (res.ok) {
        setExpenses(expenses.map(e => e.id === expenseId ? { ...e, personId } : e))
      }
    } catch (error) {
      console.error('Erro ao atribuir despesa:', error)
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
    if (!newPersonName.trim()) return
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPersonName }),
      })
      if (res.ok) {
        const person = await res.json()
        setPeople([...people, person])
        setNewPersonName('')
        setShowAddPerson(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error)
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

  const handleClearData = async (type: string) => {
    let confirmMsg = 'Tem certeza que deseja prosseguir?'
    if (type === 'unassigned') {
      confirmMsg = 'Tem certeza que deseja deletar todas as despesas pendentes (não atribuídas)?'
    } else if (type === 'assigned') {
      confirmMsg = 'Tem certeza que deseja deletar todas as despesas atribuídas a algum integrante?'
    } else if (type === 'all_expenses') {
      confirmMsg = 'Tem certeza que deseja deletar todas as despesas do sistema?'
    } else if (type === 'reset_all') {
      confirmMsg = 'ATENÇÃO: Isso deletará todas as despesas e todas as pessoas cadastradas. Deseja redefinir todo o sistema?'
    }

    setConfirmDialog({
      message: confirmMsg,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
          })
          if (res.ok) {
            toast.success('Dados apagados com sucesso!')
            fetchData()
            setShowSettings(false)
          } else {
            toast.error('Erro ao limpar dados')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
  }

  const addRule = async () => {
    if (!newRule.keyword.trim() || !newRule.personId) {
      toast.error('Preencha a palavra-chave e selecione uma pessoa')
      return
    }
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })
      if (res.ok) {
        toast.success(`Regra "${newRule.keyword}" criada!`)
        setNewRule({ keyword: '', personId: '' })
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao criar regra')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Regra removida!')
        fetchData()
      } else {
        toast.error('Erro ao remover regra')
      }
    } catch (error) {
      toast.error('Erro de conexão')
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

  const unassignedExpenses = filteredExpenses.filter(e => !e.personId)

  const unassignedTotal = unassignedExpenses.reduce((sum, e) => sum + e.amount, 0)

  const grandTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

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

  return (
    <main className="container">
      <header className="header">
        <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <h1 className="title">Financial Manager</h1>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--border)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>v1.0.0</span>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Controle de gastos compartilhados</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => setShowAddPerson(true)}>
            <UserPlus size={18} />
            Nova Pessoa
          </button>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <Link href="/" style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', textDecoration: 'none' }}>
          Painel Geral
        </Link>
        <Link href="/people" style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
          Gastos por Pessoa
        </Link>
        <Link href="/rules" style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
          Regras Automáticas
        </Link>
      </div>

      {/* Modals and Forms */}
      <AnimatePresence>
        {showAddPerson && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddPerson(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card glass"
              style={{ position: 'relative', width: '90%', maxWidth: '420px', padding: '2rem', zIndex: 10000 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                  Nova Pessoa
                </h3>
                <button 
                  onClick={() => setShowAddPerson(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  className="input" 
                  placeholder="Nome da pessoa" 
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={addPerson}>Adicionar</button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddManual && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddManual(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card glass"
              style={{ position: 'relative', width: '90%', maxWidth: '480px', padding: '2rem', zIndex: 10000 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Data</label>
                  <input 
                    type="date"
                    className="input" 
                    value={manualExpense.date}
                    onChange={(e) => setManualExpense({ ...manualExpense, date: e.target.value })}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Valor (R$)</label>
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
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Descrição</label>
                  <input 
                    className="input" 
                    placeholder="Ex: Aluguel, Mercado, etc." 
                    value={manualExpense.description}
                    onChange={(e) => setManualExpense({ ...manualExpense, description: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Instituição / Cartão (opcional)</label>
                  <input 
                    className="input" 
                    placeholder="Ex: Nubank, Itaú, Dinheiro..." 
                    value={manualExpense.card || ''}
                    onChange={(e) => setManualExpense({ ...manualExpense, card: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Atribuir a (opcional)</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.3rem', display: 'block' }}>
                      Nenhuma pessoa cadastrada
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
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
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} style={{ color: 'var(--primary)' }} />
            Mês de Referência
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => setShowAddManual(true)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', borderRadius: '6px' }}>
              <Plus size={14} />
              Gasto Manual
            </button>
            <label className="btn btn-primary" style={{ margin: 0, padding: '0.3rem 0.7rem', fontSize: '0.78rem', borderRadius: '6px', cursor: 'pointer' }}>
              <Upload size={14} />
              {uploading ? 'Processando...' : 'Importar PDF'}
              <input type="file" hidden accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {availableMonths.map(m => {
            const isActive = m === activeMonth
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
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
          {/* Dashboard Metrics and Division Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            
            {/* Left Metrics Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="card glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <PieChart className="text-primary" size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>Total da Fatura</h3>
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--foreground)' }}>
                  R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: 0 }}>
                  Soma de todas as despesas em {formatMonthName(activeMonth)}
                </p>
              </div>

              <div className="card glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Users className="text-primary" size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>Pendentes de Atribuição</h3>
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: unassignedTotal > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  R$ {unassignedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: 0 }}>
                  Gastos que ainda não pertencem a ninguém
                </p>
              </div>

              <div className="card glass" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <CreditCard className="text-primary" size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>Integrantes ({people.length})</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {people.map(p => (
                    <div 
                      key={p.id} 
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
                          padding: '4px',
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
                    </div>
                  ))}
                  {people.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      Nenhuma pessoa cadastrada
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Right Division breakdown widget */}
            <div className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                Divisão de Gastos da Fatura
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center', flex: 1 }}>
                {totals.map(p => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        R$ {p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${grandTotal > 0 ? (p.total / grandTotal) * 100 : 0}%` }}
                        style={{ height: '100%', backgroundColor: 'var(--primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{grandTotal > 0 ? ((p.total / grandTotal) * 100).toFixed(1) : 0}% do total</span>
                      <span>{filteredExpenses.filter(e => e.personId === p.id).length} transações</span>
                    </div>
                  </div>
                ))}

                {people.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0', fontStyle: 'italic' }}>
                    Cadastre pessoas para ver a divisão de gastos.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Detailed Expenses Table */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Despesas Pendentes ({unassignedExpenses.length})</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Aguardando atribuição de integrantes
              </span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Data</th>
                    <th style={{ width: '12%' }}>Instituição</th>
                    <th style={{ width: '36%' }}>Descrição</th>
                    <th style={{ width: '15%' }}>Valor</th>
                    <th style={{ width: '17%' }}>Atribuir a</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedExpenses.map(e => {
                    const isNeg = e.amount < 0
                    return (
                      <tr key={e.id} style={{ backgroundColor: isNeg ? 'rgba(46, 204, 113, 0.04)' : 'transparent' }}>
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
                              <span style={{ 
                                fontSize: '0.65rem', 
                                backgroundColor: 'rgba(46, 204, 113, 0.15)', 
                                color: 'var(--success)', 
                                padding: '0.1rem 0.4rem', 
                                borderRadius: '4px',
                                fontWeight: 700
                              }}>
                                Estorno
                              </span>
                            )}
                          </div>
                          {e.isManual && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Manual</span>}
                        </td>
                        <td style={{ fontWeight: 600, color: isNeg ? 'var(--success)' : 'var(--foreground)' }}>
                          {isNeg ? `- R$ ${Math.abs(e.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `R$ ${e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', padding: '0.2rem 0' }}>
                          {people.map(p => (
                            <button
                              key={p.id}
                              className="btn btn-outline"
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                fontSize: '0.75rem', 
                                borderRadius: '4px'
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
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', position: 'relative', zIndex: 10 }}
                          title="Excluir despesa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )})}
                  {unassignedExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nenhuma despesa pendente para o mês selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Settings Modal (Left Sidebar) */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#000',
                zIndex: 1000,
              }}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '350px',
                maxWidth: '85vw',
                backgroundColor: 'var(--card)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1001,
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Settings size={20} />
                  Configurações
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gerenciamento de Dados
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                    Escolha uma das ações abaixo para limpar as informações cadastradas.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button 
                      onClick={() => handleClearData('unassigned')}
                      className="btn btn-outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}
                    >
                      <Trash2 size={16} />
                      Deletar Gastos Pendentes
                    </button>
                    
                    <button 
                      onClick={() => handleClearData('assigned')}
                      className="btn btn-outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}
                    >
                      <Trash2 size={16} />
                      Deletar Gastos Atribuídos
                    </button>
                    
                    <button 
                      onClick={() => handleClearData('all_expenses')}
                      className="btn btn-outline"
                      style={{ color: 'var(--danger)', borderColor: 'var(--border)', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}
                    >
                      <Trash2 size={16} />
                      Limpar Todas as Despesas
                    </button>

                    <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border)' }} />

                    <button 
                      onClick={() => handleClearData('reset_all')}
                      className="btn btn-primary"
                      style={{ backgroundColor: 'var(--danger)', color: 'white', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}
                    >
                      <Trash2 size={16} />
                      Resetar Todo o Sistema
                    </button>
                  </div>
                </div>

                {/* Link to Rules Page */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Automação
                  </h4>
                  <Link
                    href="/rules"
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}
                    onClick={() => setShowSettings(false)}
                  >
                    <Zap size={16} />
                    Gerenciar Regras Automáticas
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rules.length} regra{rules.length !== 1 ? 's' : ''}
                    </span>
                  </Link>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                Financial Manager v1.0.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster position="bottom-right" />

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card glass"
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
      <footer style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>© {new Date().getFullYear()} Financial Manager v1.0.0. Todos os direitos reservados.</p>
        <p style={{ marginTop: '0.25rem' }}>Desenvolvido por <strong>Diógenes Viana</strong></p>
      </footer>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Carregando painel...</div>}>
      <HomeContent />
    </Suspense>
  )
}
