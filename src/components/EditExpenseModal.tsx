import React, { useState, useEffect } from 'react'
import Modal from '@/components/Modal'
import { Loader2 } from 'lucide-react'

interface Expense {
  id: string
  description: string
  amount: number
  isManual: boolean
  originalDescription?: string | null
}

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  onSuccess: () => void
}

export default function EditExpenseModal({ isOpen, onClose, expense, onSuccess }: EditExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
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
          amount: parsedAmount
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
