'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, UserPlus, X, Calendar, Loader2, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'

interface Person {
  id: string
  name: string
}

const getTodayStr = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ImportPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonIsSystemUser, setNewPersonIsSystemUser] = useState(false)
  const [newPersonPhone, setNewPersonPhone] = useState('')
  const [newPersonInviteEmail, setNewPersonInviteEmail] = useState('')
  
  const [selectedMonth, setSelectedMonth] = useState('')
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [manualExpense, setManualExpense] = useState({ 
    date: getTodayStr(), 
    description: '', 
    amount: '', 
    personId: '', 
    card: '' 
  })

  const currentMonthStr = new Date().toISOString().substring(0, 7) // "YYYY-MM"

  useEffect(() => {
    setSelectedMonth(currentMonthStr)
    fetchPeople()
  }, [])

  const fetchPeople = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const res = await fetch(`/api/people?t=${t}`)
      if (res.ok) {
        const data = await res.json()
        setPeople(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error)
    } finally {
      setLoading(false)
    }
  }

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
      } else {
        toast.error(data.error || 'Erro ao processar PDF')
      }
    } catch (error) {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const addPerson = async () => {
    const trimmedName = newPersonName.trim()
    if (!trimmedName) return

    const exists = people.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
      toast.error('Uma pessoa com este nome já está cadastrada.')
      return
    }

    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: newPersonIsSystemUser ? null : (newPersonPhone.trim() || null),
          inviteEmail: newPersonIsSystemUser ? (newPersonInviteEmail.trim() || null) : null,
          isSystemUser: newPersonIsSystemUser
        }),
      })
      if (res.ok) {
        const person = await res.json()
        setPeople([...people, person])
        setNewPersonName('')
        setNewPersonPhone('')
        setNewPersonInviteEmail('')
        setNewPersonIsSystemUser(false)
        toast.success(`Pessoa "${trimmedName}" adicionada com sucesso!`)
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Erro ao adicionar pessoa')
      }
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error)
      toast.error('Erro de conexão ao adicionar pessoa')
    }
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

  const formatMonthName = (m: string) => {
    if (!m) return ''
    const [year, month] = m.split('-')
    const monthsPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthsPt[parseInt(month) - 1]} / ${year}`
  }

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
      } else {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || 'Erro ao salvar gasto')
      }
    } catch {
      toast.error('Erro de conexão')
    }
  }

  return (
    <MainLayout>
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
                A inteligência artificial do Gemini está analisando o PDF para extrair as transações. Isso pode levar alguns segundos...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Importar & Lançar</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Adicione despesas manuais ou envie faturas em formato PDF para processamento automático.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Import PDF and Add Member */}
        <div className="flex-col gap-4">
          
          {/* Reference Month Selector */}
          <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-y-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Calendar className="text-primary" size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Mês de Trabalho das Lançamentos
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              As despesas e importações criadas serão vinculadas ao mês selecionado abaixo:
            </p>
            <div style={{ position: 'relative', width: '100%' }}>
              <button 
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="btn btn-outline"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.85rem',
                  fontWeight: 700, backgroundColor: 'var(--card)', borderColor: 'var(--border)'
                }}
              >
                <span>{formatMonthName(selectedMonth)}</span>
                <ChevronDown size={14} style={{ opacity: 0.7, transform: showMonthDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              
              <AnimatePresence>
                {showMonthDropdown && (
                  <>
                    <div onClick={() => setShowMonthDropdown(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, right: 0,
                        backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)', padding: '0.35rem', zIndex: 101, display: 'flex', flexDirection: 'column', gap: '0.15rem'
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
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                              color: isActive ? 'var(--primary)' : 'var(--foreground)',
                              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                              border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                              textAlign: 'left', width: '100%', transition: 'background-color 0.2s, color 0.2s'
                            }}
                          >
                            <span>{formatMonthName(m)}</span>
                            {isActive && <Check size={14} style={{ color: 'var(--primary)' }} />}
                          </button>
                        )
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Import Invoice Card */}
          <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-y-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Upload className="text-primary" size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Importar Fatura PDF
              </h3>
            </div>
            
            <label className="upload-zone" style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}>
              <Upload size={32} style={{ color: 'var(--primary)', opacity: 0.8 }} />
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)' }}>Clique para selecionar</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                  Apenas arquivos PDF são aceitos. A fatura será processada por IA.
                </p>
              </div>
              <input type="file" hidden accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {/* Add Integrante Card */}
          <div className="card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-y-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <UserPlus className="text-primary" size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Cadastrar Novo Integrante
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                className="input" 
                placeholder="Nome da pessoa" 
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
              />
              
              <div className="flex-row gap-2 flex-y-center" style={{ padding: '0.25rem 0' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Membro do sistema?</span>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={newPersonIsSystemUser} 
                    onChange={(e) => setNewPersonIsSystemUser(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '2.5rem', height: '1.4rem',
                    backgroundColor: newPersonIsSystemUser ? 'var(--primary)' : 'var(--border)',
                    borderRadius: '999px', position: 'relative', transition: 'background-color 0.2s'
                  }}>
                    <div style={{
                      width: '1.1rem', height: '1.1rem', backgroundColor: 'white', borderRadius: '50%',
                      position: 'absolute', top: '0.15rem', left: newPersonIsSystemUser ? '1.25rem' : '0.15rem',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                </label>
              </div>

              {!newPersonIsSystemUser ? (
                <input 
                  className="input" 
                  placeholder="WhatsApp (ex: 11999999999)" 
                  value={newPersonPhone}
                  onChange={(e) => setNewPersonPhone(e.target.value.replace(/\D/g, ''))}
                />
              ) : (
                <input 
                  type="email"
                  className="input" 
                  placeholder="E-mail de convite" 
                  value={newPersonInviteEmail}
                  onChange={(e) => setNewPersonInviteEmail(e.target.value)}
                />
              )}

              <button className="btn btn-primary animate-pulse" onClick={addPerson} style={{ padding: '0.65rem', fontWeight: 700 }}>
                Cadastrar Integrante
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Manual Expense form */}
        <div className="card card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex-y-center gap-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <Plus className="text-primary" size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              Adicionar Gasto Manual
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</label>
              <input 
                type="date"
                className="input" 
                value={manualExpense.date}
                onChange={(e) => setManualExpense({ ...manualExpense, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</label>
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
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
              <input 
                className="input" 
                placeholder="Ex: Aluguel, Mercado, Assinatura..." 
                value={manualExpense.description}
                onChange={(e) => setManualExpense({ ...manualExpense, description: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instituição / Cartão (opcional)</label>
              <input 
                className="input" 
                placeholder="Ex: Nubank, Itaú, Dinheiro..." 
                value={manualExpense.card || ''}
                onChange={(e) => setManualExpense({ ...manualExpense, card: e.target.value })}
              />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                Atribuir a integrante (opcional)
              </label>
              <div className="flex-row gap-2 flex-wrap">
                <button
                  className={!manualExpense.personId ? "btn btn-primary" : "btn btn-outline"}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: '6px' }}
                  onClick={() => setManualExpense({ ...manualExpense, personId: '' })}
                >
                  Pendente
                </button>
                {people.map(p => (
                  <button
                    key={p.id}
                    className={manualExpense.personId === p.id ? "btn btn-primary" : "btn btn-outline"}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: '6px' }}
                    onClick={() => setManualExpense({ ...manualExpense, personId: p.id })}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {people.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem', display: 'block' }}>
                  Nenhum integrante cadastrado
                </span>
              )}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSaveExpense}
            style={{ marginTop: '1.5rem', padding: '0.75rem', fontWeight: 700, fontSize: '0.95rem' }}
          >
            Salvar Despesa Manual
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
