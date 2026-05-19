'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, Zap, Search, Settings, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

interface Person {
  id: string
  name: string
}

interface AssignmentRule {
  id: string
  keyword: string
  personId: string
  person?: Person
}

function RulesPageContent() {
  const [people, setPeople] = useState<Person[]>([])
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [newRule, setNewRule] = useState({ keyword: '', personId: '' })
  const [search, setSearch] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const t = Date.now()
      const [peopleRes, rulesRes] = await Promise.all([
        fetch(`/api/people?t=${t}`),
        fetch(`/api/rules?t=${t}`)
      ])
      const peopleData = await peopleRes.json()
      const rulesData = await rulesRes.json()
      setPeople(Array.isArray(peopleData) ? peopleData : [])
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
    if (!newRule.keyword.trim()) {
      toast.error('Digite uma palavra-chave')
      return
    }
    if (!newRule.personId) {
      toast.error('Selecione uma pessoa')
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

  const deleteRule = async (id: string, keyword: string) => {
    setConfirmDialog({
      message: `Remover a regra "${keyword}"?`,
      onConfirm: async () => {
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
    })
  }

  // Group rules by person
  const rulesByPerson = rules.reduce((acc, rule) => {
    const name = rule.person?.name || 'Desconhecido'
    if (!acc[name]) acc[name] = []
    acc[name].push(rule)
    return acc
  }, {} as Record<string, AssignmentRule[]>)

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
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
            Configurações
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <Link href="/" style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
          Painel Geral
        </Link>
        <Link href="/people" style={{ padding: '0.5rem 1rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
          Gastos por Pessoa
        </Link>
        <Link href="/rules" style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--primary)', borderBottom: '2px solid var(--primary)', textDecoration: 'none' }}>
          Regras Automáticas
        </Link>
      </div>

      {/* How it works banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glass"
        style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
      >
        <div style={{ background: 'linear-gradient(135deg, var(--primary), #6366f1)', padding: '0.6rem', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
          <Zap size={20} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--foreground)' }}>Como funciona?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Cadastre uma <strong>palavra-chave</strong> e vincule a uma <strong>pessoa</strong>. Quando você importar um PDF de fatura,
            toda despesa cuja descrição contenha essa palavra será atribuída automaticamente à pessoa vinculada.
            <br />
            <span style={{ opacity: 0.8 }}>Ex: a regra <code style={{ background: 'var(--background)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>uber</code> → Maria fará com que "UBER *TRIP" seja atribuído à Maria.</span>
          </p>
        </div>
      </motion.div>

      {/* Add Rule Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ padding: '1.5rem', marginBottom: '2rem' }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} style={{ color: 'var(--primary)' }} />
          Nova Regra
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>Palavra-chave</label>
            <input
              className="input"
              placeholder="Ex: uber, ifood, netflix..."
              value={newRule.keyword}
              onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addRule()}
            />
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>Atribuir a</label>
            <select
              className="input"
              value={newRule.personId}
              onChange={(e) => setNewRule({ ...newRule, personId: e.target.value })}
            >
              <option value="">Selecione a pessoa</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={addRule} style={{ height: '42px', padding: '0 1.5rem' }}>
            <Plus size={16} />
            Adicionar
          </button>
        </div>
        {people.length === 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.75rem', fontStyle: 'italic' }}>
            Cadastre pessoas no Painel Geral antes de criar regras.
          </p>
        )}
      </motion.div>

      {/* Rules List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando regras...</div>
      ) : rules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card"
          style={{ textAlign: 'center', padding: '4rem 2rem' }}
        >
          <Zap size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            Nenhuma regra cadastrada
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Cadastre sua primeira regra acima para automatizar a atribuição de despesas ao importar faturas.
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
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="card glass" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Total de Regras
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                {rules.length}
              </div>
            </div>
            <div className="card glass" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Pessoas com Regras
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                {Object.keys(rulesByPerson).length}
              </div>
            </div>
          </div>

          {/* Grouped by person */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AnimatePresence>
              {Object.entries(filteredByPerson).map(([personName, personRules], idx) => (
                <motion.div
                  key={personName}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card"
                  style={{ padding: '1.5rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {personName.charAt(0).toUpperCase()}
                      </div>
                      {personName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--background)', padding: '0.25rem 0.6rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      {personRules.length} regra{personRules.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {personRules.map(rule => (
                      <motion.div
                        key={rule.id}
                        layout
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.45rem 0.5rem 0.45rem 0.75rem',
                          background: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--primary)',
                        }}>
                          {rule.keyword}
                        </span>
                        <button
                          onClick={() => deleteRule(rule.id, rule.keyword)}
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
                          title="Remover regra"
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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
                  <button
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', width: '100%', gap: '0.75rem', cursor: 'default', opacity: 0.8 }}
                    disabled
                  >
                    <Zap size={16} />
                    Gerenciar Regras Automáticas
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rules.length} regra{rules.length !== 1 ? 's' : ''}
                    </span>
                  </button>
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
                <button onClick={() => setConfirmDialog(null)} className="btn btn-outline">Cancelar</button>
                <button
                  onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}
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

export default function RulesPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Carregando regras...</div>}>
      <RulesPageContent />
    </Suspense>
  )
}
