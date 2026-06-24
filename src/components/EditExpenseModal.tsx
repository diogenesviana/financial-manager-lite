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
  'Casa',
  'Vestuário',
  'Educação',
  'Viagem',
  'Outros'
]

export default function EditExpenseModal({ isOpen, onClose, expense, onSuccess }: EditExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [card, setCard] = useState('')
  const [isCustomCard, setIsCustomCard] = useState(false)
  const [saving, setSaving] = useState(false)

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
      setAmount(expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
      setCategory(expense.category || 'Outros')
      setCard(expense.card || '')
      
      const defaultCards = ['Nubank', 'Inter', 'Itaú', 'Bradesco', 'Santander', 'C6 Bank', 'Caixa', 'Banco do Brasil']
      if (expense.card && !defaultCards.includes(expense.card)) {
        setIsCustomCard(true)
      } else {
        setIsCustomCard(false)
      }
    }
  }, [expense, isOpen])

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
          card: expense.isManual ? (card || null) : undefined
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
      maxWidth="450px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {!expense.isManual && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Gasto importado de PDF:</strong> O nome que você digitar abaixo será exibido entre parênteses ao lado do nome original <em>({baseName})</em>.
          </div>
        )}

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
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {expense.isManual && (
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Instituição / Banco (Opcional)</label>
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
                'Nubank', 
                'Inter', 
                'Itaú', 
                'Bradesco', 
                'Santander', 
                'C6 Bank', 
                'Caixa', 
                'Banco do Brasil',
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

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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
