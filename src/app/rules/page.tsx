'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Trash2, Zap, Search, Settings, X, PieChart, LogOut, Shield, Users } from 'lucide-react'
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

function RulesPageContent() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [rules, setRules] = useState<AssignmentRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)
  const [selectedPersonForRule, setSelectedPersonForRule] = useState<Person | null>(null)
  const [ruleKeyword, setRuleKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([])
  const [deletingBulk, setDeletingBulk] = useState(false)

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
          // Delete sequentially or via Promise.all
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
    <MainLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Regras Automáticas</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configure regras de auto-atribuição de despesas a partir de palavras-chave da fatura.</p>
      </div>

      {/* How it works banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-glass flex-row gap-4"
        style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}
      >
        <div style={{ background: 'linear-gradient(135deg, var(--primary), #a855f7)', padding: '0.6rem', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
          <Zap size={20} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--foreground)' }}>Como funciona?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Cadastre uma <strong>palavra-chave</strong> e vincule a uma <strong>pessoa</strong>. Quando você importar um PDF de fatura,
            toda despesa cuja descrição contenha essa palavra será atribuída automaticamente à pessoa vinculada.
            <br />
            <span style={{ opacity: 0.8 }}>Ex: a regra <code style={{ background: 'var(--background)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>uber</code> → Maria fará com que "UBER *TRIP" seja atribuído à Maria.</span>
          </p>
        </div>
      </motion.div>

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
          <div className="members-horizontal-bar">
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
                {/* Optional: we could show rule count here instead of total amount */}
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
        <PageLoader title="Carregando regras..." description="Buscando as regras de atribuição de gastos." />
      ) : rules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card flex-col flex-center"
          style={{ padding: '4rem 2rem', textAlign: 'center' }}
        >
          <Zap size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
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
          <div className="flex-row gap-4" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="card card-glass flex-col gap-1" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total de Regras
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                {rules.length}
              </div>
            </div>
            <div className="card card-glass flex-col gap-1" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              )})}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Bulk Actions */}
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm()
        }}
        message={confirmDialog?.message || ''}
      />

      {/* Add Rule Modal */}
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
