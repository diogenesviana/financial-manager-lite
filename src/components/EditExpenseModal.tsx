import React, { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Loader2 } from 'lucide-react'

interface Expense {
  id: string
  description: string
  amount: number
  isManual: boolean
  category?: string | null
  card?: string | null
  originalDescription?: string | null
  date?: string | null
  month?: string | null
}

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  onSuccess: () => void
}

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Assinaturas',
  'Saúde',
  'Lazer',
  'Moradia',
  'Casa',
  'Vestuário',
  'Educação',
  'Viagem',
  'Outros'
]

const generateMonthsDropdown = () => {
  const months = []
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  for (let i = 0; i < 13; i++) {
    months.push(d.toISOString().substring(0, 7))
    d.setMonth(d.getMonth() + 1)
  }
  return months.reverse()
}

const formatMonthName = (m: string) => {
  if (!m) return ''
  const [year, month] = m.split('-')
  const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${monthsPt[parseInt(month, 10) - 1]} / ${year}`
}

export default function EditExpenseModal({ isOpen, onClose, expense, onSuccess }: EditExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [refMonth, setRefMonth] = useState('')
  const [selectorYear, setSelectorYear] = useState(() => new Date().getFullYear())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [card, setCard] = useState('')
  const [isCustomCard, setIsCustomCard] = useState(false)
  const [saving, setSaving] = useState(false)

  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [dbBanks, setDbBanks] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDbCategories(data)
        })
        .catch(err => console.error('Erro ao buscar categorias:', err))

      fetch('/api/banks')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDbBanks(data)
        })
        .catch(err => console.error('Erro ao buscar bancos:', err))
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && refMonth) {
      const parts = refMonth.split('-')
      const y = parseInt(parts[0])
      if (!isNaN(y)) {
        setSelectorYear(y)
      }
    }
  }, [isOpen, refMonth])

  useEffect(() => {
    if (expense && isOpen) {
      // Se for PDF, queremos editar apenas a parte adicionada ou limpar, 
      // mas como simplificação, a API concatena "Nome Original (Novo Nome)".
      // Então, mostraremos o nome vazio ou o valor que o usuário quiser adicionar.
      // Se já tiver originalDescription, a description atual tem "(...)".
      // Vamos apenas mostrar a description limpa se manual, ou vazia/extraída se PDF.
      
      let initialDesc = expense.description
      if (!expense.isManual) {
        // Se já foi editado antes, tentamos extrair o texto entre parênteses. 
        // Em casos que a string possui espaços no final, a regex precisa prever.
        // Pegamos sempre os últimos parênteses da string.
        if (expense.originalDescription && initialDesc.includes('(') && initialDesc.includes(')')) {
          const match = initialDesc.match(/\(([^)]+)\)[^()]*$/)
          initialDesc = match ? match[1].trim() : ''
        } else {
          initialDesc = ''
        }
      }
      setDescription(initialDesc)
      
      let initialDate = ''
      if (expense.date) {
        const d = new Date(expense.date)
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        initialDate = `${year}-${month}-${day}`
      }
      setDate(initialDate)
      setRefMonth(expense.month || '')
 
      setAmount(expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
      setCategory(expense.category || 'Outros')
      setCard(expense.card || '')
      
      const defaultCards = ['Nubank', 'Inter', 'Itaú', 'Bradesco', 'Santander', 'C6 Bank', 'Caixa', 'Banco do Brasil', 'Flash', 'Sodexo', 'Caju']
      const activeBanks = dbBanks.length > 0 ? dbBanks : defaultCards
      if (expense.card && !activeBanks.includes(expense.card)) {
        setIsCustomCard(true)
      } else {
        setIsCustomCard(false)
      }
    }
  }, [expense, isOpen, dbBanks])

  if (!isOpen || !expense) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
      
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: parsedAmount,
          category,
          card: expense.isManual ? (card || null) : undefined,
          date,
          month: refMonth
        })
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Erro ao atualizar gasto')
      }
    } catch (err) {
      alert('Erro de conexão ao salvar gasto')
    } finally {
      setSaving(false)
    }
  }

  const baseName = expense.originalDescription || expense.description

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Gasto"
      maxWidth="750px"
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {!expense.isManual && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            <strong>Gasto importado de PDF:</strong> O nome que você digitar abaixo será exibido entre parênteses ao lado do nome original <em>({baseName})</em>.
          </div>
        )}

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '0.25rem'
          }}
        >
          {/* Coluna 1: Informações principais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {expense.isManual ? 'Descrição' : 'Novo Nome / Apelido'}
              </label>
              <input 
                type="text" 
                className="input" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder={expense.isManual ? "Ex: Mercado, Uber..." : "Ex: Assinatura da Netflix"} 
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Valor (R$)</label>
              <input 
                type="text" 
                className="input" 
                value={amount} 
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (!val) {
                    setAmount('');
                    return;
                  }
                  const num = parseInt(val, 10) / 100;
                  setAmount(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }} 
                placeholder="0,00" 
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Categoria</label>
              <select 
                className="input" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
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
                {Array.from(new Set([
                  ...(dbCategories.length > 0 ? dbCategories : [
                    'Alimentação',
                    'Transporte',
                    'Assinaturas',
                    'Saúde',
                    'Lazer',
                    'Moradia',
                    'Casa',
                    'Vestuário',
                    'Educação',
                    'Viagem',
                    'Outros'
                  ]),
                  ...(category ? [category] : [])
                ])).sort().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {expense.isManual && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Instituição / Banco</label>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>Opcional</span>
                </div>
                <select 
                  className="input" 
                  value={isCustomCard ? '___custom___' : card} 
                  onChange={e => {
                    const val = e.target.value
                    if (val === '___custom___') {
                      setIsCustomCard(true)
                      setCard('')
                    } else {
                      setIsCustomCard(false)
                      setCard(val)
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
                  <option value="">-- Sem Banco --</option>
                  {Array.from(new Set([
                    ...(dbBanks.length > 0 ? dbBanks : [
                      'Nubank', 
                      'Inter', 
                      'Itaú', 
                      'Bradesco', 
                      'Santander', 
                      'C6 Bank', 
                      'Caixa', 
                      'Banco do Brasil',
                      'Flash',
                      'Sodexo',
                      'Caju'
                    ]),
                    ...(expense.card ? [expense.card] : [])
                  ])).sort().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="___custom___">-- Outro (digitar...) --</option>
                </select>
                {isCustomCard && (
                  <input 
                    type="text" 
                    className="input" 
                    value={card} 
                    onChange={e => setCard(e.target.value)} 
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
            )}
          </div>

          {/* Coluna 2: Tempo e Fatura */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Data
              </label>
              <input 
                type="date" 
                className="input" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Mês de Referência (Fatura)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: 'var(--background)', 
                  padding: '0.4rem 0.6rem', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border)' 
                }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectorYear(y => y - 1)} 
                    className="btn btn-outline" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    &larr;
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                    {selectorYear}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setSelectorYear(y => y + 1)} 
                    className="btn btn-outline" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    &rarr;
                  </button>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '0.4rem',
                  backgroundColor: 'var(--background)',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}>
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((mLabel, idx) => {
                    const mVal = `${selectorYear}-${String(idx + 1).padStart(2, '0')}`
                    const isSelected = refMonth === mVal
                    return (
                      <button
                        key={mLabel}
                        type="button"
                        onClick={() => setRefMonth(mVal)}
                        style={{
                          padding: '0.6rem 0.4rem',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--card)',
                          color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '0.8rem',
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
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, padding: '0.75rem' }}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || !amount || (expense.isManual && !description.trim())} 
            style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
