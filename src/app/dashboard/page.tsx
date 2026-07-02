'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchDashboardData } from '@/lib/api-client'
import { 
  PieChart, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Grid, 
  Calendar, 
  ChevronDown, 
  Car, 
  ShoppingBag, 
  Utensils, 
  Film, 
  DollarSign, 
  AlertCircle,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'
import MonthSelector from '@/components/MonthSelector'
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
  person?: Person
  category?: string | null
}

// Mapeamento de categorias e suas respectivas cores do design system
const categoryColorMap: Record<string, { bg: string; text: string; raw: string }> = {
  'Alimentação': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', raw: '#ef4444' }, // Vermelho
  'Transporte': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', raw: '#3b82f6' }, // Azul
  'Lazer': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', raw: '#f59e0b' },    // Amarelo/Laranja
  'Saúde': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', raw: '#10b981' },    // Verde
  'Moradia': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', raw: '#8b5cf6' },  // Violeta
  'Assinaturas': { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', raw: '#ec4899' }, // Rosa
  'Educação': { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4', raw: '#06b6d4' },    // Ciano
  'Outros': { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', raw: '#6b7280' }      // Cinza
}

const defaultColor = { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', raw: '#6366f1' } // Índigo

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([])
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, boolean>>({})
  const [dbMonths, setDbMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7))
  const [loading, setLoading] = useState(true)
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [activeCategoryHover, setActiveCategoryHover] = useState<{ name: string; amount: number; percentage: number } | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const currentMonthStr = new Date().toISOString().substring(0, 7)

  const fetchData = async (monthToFetch?: string) => {
    setLoading(true)
    try {
      const targetMonth = monthToFetch || selectedMonth || currentMonthStr
      const data = await fetchDashboardData(targetMonth)
      setPeople(data.people)
      setExpenses(data.expenses)
      setPrevExpenses(data.prevExpenses || [])
      setPaymentStatuses(data.paymentsMap || {})
      setDbMonths(data.months)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao buscar dados do Dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSelectedMemberId(null)
    fetchData(selectedMonth)
  }, [selectedMonth])

  // Gerar meses recentes para o seletor
  const generateRecentMonths = () => {
    const months = []
    const d = new Date()
    for (let i = 0; i < 6; i++) {
      months.push(d.toISOString().substring(0, 7))
      d.setMonth(d.getMonth() - 1)
    }
    return months
  }

  const availableMonths = Array.from(new Set([
    ...generateRecentMonths(),
    ...dbMonths
  ])).sort().reverse()

  const activeMonth = selectedMonth || currentMonthStr

  // 1. Processar dados por Integrante (usa as despesas totais brutas para permitir comparação)
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  const memberData = people
    .map(p => {
      const pExpenses = expenses.filter(e => e.personId === p.id)
      const amount = pExpenses.reduce((sum, e) => sum + e.amount, 0)
      return {
        ...p,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      }
    })
    .sort((a, b) => b.amount - a.amount)

  // Adicionar "Sem atribuição" se houver
  const unassignedExpenses = expenses.filter(e => e.personId === null)
  const unassignedAmount = unassignedExpenses.reduce((sum, e) => sum + e.amount, 0)
  if (unassignedAmount > 0) {
    memberData.push({
      id: 'unassigned',
      name: 'Sem atribuição',
      linkedUserId: null,
      avatar: null,
      amount: unassignedAmount,
      percentage: totalAmount > 0 ? (unassignedAmount / totalAmount) * 100 : 0
    })
  }

  // Filtrar despesas se houver um integrante selecionado (para os gráficos de categoria e serviço)
  const filteredExpenses = selectedMemberId
    ? expenses.filter(e => {
        if (selectedMemberId === 'unassigned') {
          return e.personId === null
        }
        return e.personId === selectedMemberId
      })
    : expenses

  const filteredTotalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  // 2. Processar dados por Categoria baseados nas despesas filtradas
  const categoryData = Object.entries(
    filteredExpenses.reduce((acc: Record<string, number>, e) => {
      const cat = e.category || 'Outros'
      acc[cat] = (acc[cat] || 0) + e.amount
      return acc
    }, {})
  )
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: filteredTotalAmount > 0 ? (amount / filteredTotalAmount) * 100 : 0,
      color: categoryColorMap[name] || defaultColor
    }))
    .sort((a, b) => b.amount - a.amount)

  // 3. Processar serviços mais frequentes (Top Gastos)
  // Agrupa descrições parecidas usando termos comuns de faturas
  const serviceKeywords = ['uber', 'ifood', 'spotify', 'netflix', 'amazon', 'mercado', 'mercadolivre', 'google', 'apple', 'delivery', 'posto', 'farmacia']
  
  const getGroupedName = (description: string): string => {
    const descLower = description.toLowerCase()
    for (const kw of serviceKeywords) {
      if (descLower.includes(kw)) {
        if (kw === 'mercadolivre') return 'Mercado Livre'
        return kw.charAt(0).toUpperCase() + kw.slice(1)
      }
    }
    // Caso contrário, pega as primeiras 2 palavras da descrição para agrupar compras no mesmo local
    return description.split(' ').slice(0, 2).join(' ')
  }

  const serviceData = Object.entries(
    filteredExpenses.reduce((acc: Record<string, { amount: number; count: number; name: string }>, e) => {
      const key = getGroupedName(e.description)
      if (!acc[key]) {
        acc[key] = { name: key, amount: 0, count: 0 }
      }
      acc[key].amount += e.amount
      acc[key].count += 1
      return acc
    }, {})
  )
    .map(([_, data]) => data)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5) // Top 5

  // 4. Matriz Heatmap: Integrante vs Categoria
  const allCategories = Array.from(new Set(expenses.map(e => e.category || 'Outros')))
    .sort((a, b) => (categoryColorMap[a]?.raw || '').localeCompare(categoryColorMap[b]?.raw || ''))

  // 5. Geração de Insights & Feedbacks Rápidos
  const prevTotalAmount = prevExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  const generateInsights = () => {
    const list = []
    
    // Insight 1: Comparativo com o mês anterior
    if (prevTotalAmount > 0) {
      const diff = totalAmount - prevTotalAmount
      const diffPct = (Math.abs(diff) / prevTotalAmount) * 100
      if (diff < 0) {
        list.push({
          type: 'success',
          title: 'Economia detectada!',
          desc: `O gasto total diminuiu R$ ${Math.abs(diff).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${diffPct.toFixed(0)}% a menos) em relação ao mês anterior.`,
        })
      } else if (diff > 0) {
        list.push({
          type: 'warning',
          title: 'Aumento de despesas',
          desc: `O gasto total subiu R$ ${diff.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${diffPct.toFixed(0)}% a mais) comparado ao mês passado.`,
        })
      }
    }
    
    // Insight 2: Categoria mais cara
    if (categoryData.length > 0) {
      const topCat = categoryData[0]
      const topCatPct = totalAmount > 0 ? (topCat.amount / totalAmount) * 100 : 0
      list.push({
        type: 'info',
        title: `Maior ralo: ${topCat.name}`,
        desc: `Consumiu R$ ${topCat.amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${topCatPct.toFixed(0)}% do orçamento total do grupo).`,
      })
    }
    
    // Insight 3: Despesas Sem Atribuição
    if (unassignedAmount > 0) {
      list.push({
        type: 'danger',
        title: 'Gastos sem dono',
        desc: `Existem R$ ${unassignedAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sem atribuição. Vincule-os para fechar as contas.`,
      })
    }
    
    // Insight 4: Integrantes Pendentes de Quitação
    const pendingMembersCount = memberData.filter(m => m.id !== 'unassigned' && m.amount > 0 && !paymentStatuses[m.id]).length
    if (pendingMembersCount > 0) {
      list.push({
        type: 'warning',
        title: 'Quitações pendentes',
        desc: `Restam ${pendingMembersCount} integrantes com saldo pendente para acertar neste mês.`,
      })
    } else if (totalAmount > 0 && pendingMembersCount === 0) {
      list.push({
        type: 'success',
        title: 'Tudo resolvido!',
        desc: 'Todos os integrantes com gastos já realizaram os pagamentos deste mês.',
      })
    }
    
    return list.slice(0, 3) // Mostra no máximo 3 insights relevantes
  }

  const insightsList = generateInsights()

  // Formatar nomes do mês
  const formatMonthName = (monthStr: string) => {
    if (!monthStr) return ''
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  // Renderizar o círculo SVG de Pizza (Donut)
  // Raio de 50, comprimento do círculo = 2 * PI * r = 314.16
  const radius = 50
  const circ = 2 * Math.PI * radius
  let accumulatedPercentage = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', paddingBottom: '2rem' }}>
      
      {/* Top Header com Seletor de Mês */}
      <div className="flex-between flex-wrap gap-3">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.03em' }}>
            Indicadores Analíticos
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Visão gráfica e distribuição detalhada dos gastos do grupo.
          </p>
        </div>

        {/* Seletor de Mês */}
        <MonthSelector 
          activeMonth={activeMonth}
          availableMonths={availableMonths}
          onMonthChange={(m: string) => setSelectedMonth(m)}
        />
      </div>

      {/* Banner de Filtro Ativo */}
      {selectedMemberId && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(99, 102, 241, 0.08)', 
            padding: '0.65rem 1rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(99, 102, 241, 0.15)', 
            fontSize: '0.85rem', 
            color: 'var(--primary)',
            fontWeight: 500
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>
              Exibindo apenas despesas de <strong>{memberData.find(m => m.id === selectedMemberId)?.name}</strong>.
            </span>
          </div>
          <button 
            onClick={() => setSelectedMemberId(null)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: 700, 
              cursor: 'pointer', 
              textDecoration: 'underline', 
              padding: 0,
              fontSize: '0.85rem'
            }}
          >
            Limpar filtro
          </button>
        </motion.div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
          <LoaderSpinner />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Processando dados analíticos...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={40} style={{ opacity: 0.3, margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
            Nenhuma despesa neste período
          </h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Não encontramos despesas lançadas ou importadas para {formatMonthName(activeMonth)}. Importe uma fatura para ver os gráficos.
          </p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Seção de Insights Rápidos */}
          {insightsList.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {insightsList.map((ins, idx) => {
                let borderColor = 'rgba(99, 102, 241, 0.15)'
                let bgColor = 'rgba(99, 102, 241, 0.04)'
                let textColor = 'var(--text-muted)'
                let titleColor = 'var(--foreground)'
                let iconColor = 'var(--primary)'

                if (ins.type === 'success') {
                  borderColor = 'rgba(16, 185, 129, 0.2)'
                  bgColor = 'rgba(16, 185, 129, 0.05)'
                  iconColor = '#10b981'
                } else if (ins.type === 'warning') {
                  borderColor = 'rgba(245, 158, 11, 0.2)'
                  bgColor = 'rgba(245, 158, 11, 0.05)'
                  iconColor = '#f59e0b'
                } else if (ins.type === 'danger') {
                  borderColor = 'rgba(239, 68, 68, 0.2)'
                  bgColor = 'rgba(239, 68, 68, 0.05)'
                  iconColor = '#ef4444'
                }

                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="card"
                    style={{ 
                      padding: '0.85rem 1rem', 
                      borderRadius: '10px', 
                      border: '1.5px solid', 
                      borderColor, 
                      backgroundColor: bgColor,
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ 
                      color: iconColor, 
                      flexShrink: 0,
                      marginTop: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.35rem',
                      borderRadius: '6px'
                    }}>
                      {ins.type === 'success' && <Check size={14} />}
                      {ins.type === 'warning' && <AlertCircle size={14} />}
                      {ins.type === 'danger' && <AlertCircle size={14} />}
                      {ins.type === 'info' && <TrendingUp size={14} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: titleColor, margin: 0 }}>
                        {ins.title}
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: textColor, margin: 0, lineHeight: 1.4 }}>
                        {ins.desc}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Fila 1: Pizza e Integrantes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            
            {/* CARD 1: Categorias (Donut Chart) */}
            <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="flex-y-center gap-1.5" style={{ marginBottom: '1.5rem' }}>
                <PieChart size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gastos por Categoria
                </h3>
              </div>

              <div className="donut-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', flex: 1 }}>
                
                {/* SVG do Donut */}
                <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                  <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Círculo de Fundo */}
                    <circle 
                      cx="60" 
                      cy="60" 
                      r={radius} 
                      fill="transparent" 
                      stroke="var(--border)" 
                      strokeWidth="10" 
                      style={{ opacity: 0.3 }}
                    />
                    
                    {/* Fatias */}
                    {categoryData.map((cat, idx) => {
                      const strokeDashoffset = circ - (circ * cat.percentage) / 100
                      const strokeDasharray = circ
                      const rotation = (accumulatedPercentage * 360) / 100
                      accumulatedPercentage += cat.percentage

                      return (
                        <motion.circle
                          key={idx}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={cat.color.raw}
                          strokeWidth="10"
                          strokeDasharray={strokeDasharray}
                          initial={{ strokeDashoffset: circ }}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                          style={{
                            transformOrigin: '60px 60px',
                            transform: `rotate(${rotation}deg)`,
                            cursor: 'pointer',
                            transition: 'stroke-width 0.2s',
                          }}
                          onMouseEnter={() => setActiveCategoryHover({ name: cat.name, amount: cat.amount, percentage: cat.percentage })}
                          onMouseLeave={() => setActiveCategoryHover(null)}
                        />
                      )
                    })}
                  </svg>
                  
                  {/* Conteúdo no Centro da Rosca */}
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    pointerEvents: 'none',
                    textAlign: 'center',
                    padding: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {activeCategoryHover ? activeCategoryHover.name : 'Total Gasto'}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginTop: '0.1rem' }}>
                      R$ {(activeCategoryHover ? activeCategoryHover.amount : filteredTotalAmount).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {activeCategoryHover ? `${activeCategoryHover.percentage.toFixed(0)}%` : `${filteredExpenses.length} itens`}
                    </span>
                  </div>
                </div>

                {/* Legenda Lateral */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '160px' }}>
                  {categoryData.slice(0, 5).map((cat, idx) => (
                    <div 
                      key={idx} 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}
                      onMouseEnter={() => setActiveCategoryHover({ name: cat.name, amount: cat.amount, percentage: cat.percentage })}
                      onMouseLeave={() => setActiveCategoryHover(null)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color.raw, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {cat.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--foreground)', flexShrink: 0 }}>
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {categoryData.length > 5 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem', borderTop: '1px dashed var(--border)', paddingTop: '0.4rem' }}>
                      + {categoryData.length - 5} outras categorias
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 2: Integrantes (Barras Horizontais) */}
            <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="flex-y-center gap-1.5" style={{ marginBottom: '1.5rem' }}>
                <Users size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Divisão de Gastos
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                {memberData.map((m, idx) => {
                  const isUnassigned = m.id === 'unassigned'
                  const initials = getInitials(m.name)
                  const barColor = isUnassigned ? 'var(--text-muted)' : `hsl(${(idx * 60) % 360}, 65%, 55%)`

                  return (
                    <div 
                      key={m.id} 
                      onClick={() => setSelectedMemberId(prev => prev === m.id ? null : m.id)}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.35rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        backgroundColor: selectedMemberId === m.id ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        border: '1px solid',
                        borderColor: selectedMemberId === m.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        opacity: selectedMemberId && selectedMemberId !== m.id ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        margin: '0 -0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedMemberId !== m.id) {
                          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedMemberId !== m.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        
                        {/* Nome + Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {m.avatar ? (
                            <img 
                              src={m.avatar} 
                              alt={m.name} 
                              style={{ width: '1.65rem', height: '1.65rem', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: '1.65rem', 
                              height: '1.65rem', 
                              borderRadius: '50%', 
                              backgroundColor: isUnassigned ? 'rgba(99, 102, 241, 0.1)' : 'var(--primary-light)',
                              color: isUnassigned ? 'var(--text-muted)' : 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              border: '1px solid var(--border)'
                            }}>
                              {initials}
                            </div>
                          )}
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{m.name}</span>
                        </div>

                        {/* Totais */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.percentage.toFixed(0)}%</span>
                          <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                            R$ {m.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${m.percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                          style={{ 
                            height: '100%', 
                            background: barColor, 
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Fila 2: Top Serviços & Heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            
            {/* CARD 3: Top Serviços Recorrentes */}
            <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="flex-y-center gap-1.5" style={{ marginBottom: '1.25rem' }}>
                <Clock size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Frequência de Serviços (Top 5)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
                {serviceData.map((svc, idx) => {
                  const isHighFreq = svc.count >= 5
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '0.65rem 0.85rem', 
                        borderRadius: '6px', 
                        background: 'rgba(var(--primary-rgb), 0.03)',
                        border: '1px solid var(--border)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Círculo do número do Ranking */}
                        <div style={{ 
                          width: '1.35rem', 
                          height: '1.35rem', 
                          borderRadius: '50%', 
                          background: 'rgba(var(--primary-rgb), 0.1)', 
                          color: 'var(--primary)', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          #{idx + 1}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{svc.name}</span>
                          <span style={{ fontSize: '0.7rem', color: isHighFreq ? 'var(--warning)' : 'var(--text-muted)', fontWeight: isHighFreq ? 600 : 400 }}>
                            {svc.count}x transações
                          </span>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>
                        R$ {svc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CARD 4: Heatmap de Matriz Cruzada */}
            <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
              <div className="flex-y-center gap-1.5" style={{ marginBottom: '1.25rem' }}>
                <Grid size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Heatmap: Membros vs Categorias
                </h3>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Membro</th>
                      {allCategories.slice(0, 3).map((cat, idx) => (
                        <th key={idx} style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{cat}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {memberData.slice(0, 4).map(p => {
                      return (
                        <tr key={p.id}>
                          <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600, color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>
                            {p.name.split(' ')[0]}
                          </td>
                          {allCategories.slice(0, 3).map((cat, idx) => {
                            const val = expenses
                              .filter(e => e.personId === p.id && (e.category || 'Outros') === cat)
                              .reduce((sum, e) => sum + e.amount, 0)
                            
                            // Calcula opacidade de fundo baseada na proporção do total
                            const maxVal = totalAmount > 0 ? totalAmount : 1
                            const opacity = Math.min(0.8, Math.max(0.05, (val / maxVal) * 3))
                            const hasValue = val > 0

                            return (
                              <td 
                                key={idx} 
                                style={{ 
                                  textAlign: 'center', 
                                  padding: '0.55rem 0.5rem', 
                                  borderBottom: '1px solid var(--border)',
                                  backgroundColor: hasValue ? `rgba(99, 102, 241, ${opacity})` : 'transparent',
                                  color: hasValue ? 'var(--foreground)' : 'var(--text-muted)',
                                  fontWeight: hasValue ? 700 : 400,
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                title={`${p.name} - ${cat}: R$ ${val.toFixed(2)}`}
                              >
                                {hasValue ? `R$ ${val.toFixed(0)}` : '───'}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </motion.div>
      )}

    </div>
  )
}

// Auxiliar para pegar as iniciais do nome
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Mini Componente Loader local
function LoaderSpinner() {
  return (
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
  )
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <DashboardContent />
    </MainLayout>
  )
}
