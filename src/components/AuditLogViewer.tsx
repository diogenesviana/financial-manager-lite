'use client'

import { useState, useEffect } from 'react'
import { Activity, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import DataTable from './DataTable'
import PageLoader from './PageLoader'
import Pagination from './Pagination'

interface AuditLog {
  id: string
  modelName: string
  recordId: string
  action: string
  oldData?: any
  newData?: any
  userId?: string | null
  createdAt: string
  user?: {
    name: string
    email: string
  } | null
}

export default function AuditLogViewer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // Filtros e Pesquisa
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [modelFilter, setModelFilter] = useState('ALL')

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Voltar para a página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, actionFilter, modelFilter])

  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/audit')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data)
    } catch {
      toast.error('Erro ao carregar os logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    let color = 'var(--text-muted)'
    let bg = 'var(--border)'
    if (action.includes('CREATE')) { color = 'var(--success)'; bg = 'rgba(34, 197, 94, 0.1)' }
    if (action.includes('UPDATE')) { color = '#3b82f6'; bg = 'rgba(59, 130, 246, 0.1)' }
    if (action.includes('DELETE')) { color = 'var(--danger)'; bg = 'rgba(239, 68, 68, 0.1)' }
    
    return (
      <span style={{ 
        backgroundColor: bg, color: color, 
        padding: '0.2rem 0.5rem', borderRadius: '4px', 
        fontSize: '0.75rem', fontWeight: 700 
      }}>
        {action}
      </span>
    )
  }

  const getModifiedFieldsSummary = (log: AuditLog) => {
    if (log.oldData && log.newData) {
      const changes: string[] = []
      const oldVal = log.oldData
      const newVal = log.newData
      
      const keysToCompare = ['description', 'amount', 'month', 'card', 'category', 'personId', 'isPaid', 'name', 'role', 'email', 'linkStatus']
      keysToCompare.forEach(key => {
        if (oldVal[key] !== newVal[key] && (oldVal[key] !== undefined || newVal[key] !== undefined)) {
          let label = key
          let from = oldVal[key] === null || oldVal[key] === undefined ? 'vazio' : String(oldVal[key])
          let to = newVal[key] === null || newVal[key] === undefined ? 'vazio' : String(newVal[key])
          
          if (key === 'month') label = 'Mês'
          if (key === 'amount') {
            label = 'Valor'
            from = `R$ ${parseFloat(from).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            to = `R$ ${parseFloat(to).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
          if (key === 'description') label = 'Descrição'
          if (key === 'category') label = 'Categoria'
          if (key === 'card') label = 'Cartão'
          if (key === 'name') label = 'Nome'
          if (key === 'role') label = 'Função'
          if (key === 'email') label = 'E-mail'
          if (key === 'linkStatus') label = 'Convite'
          if (key === 'isPaid') {
            label = 'Quitação'
            from = oldVal[key] ? 'Pago' : 'Pendente'
            to = newVal[key] ? 'Pago' : 'Pendente'
          }
          
          changes.push(`${label}: ${from} ➔ ${to}`)
        }
      })
      
      if (changes.length > 0) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
            {changes.map((c, i) => (
              <span key={i} style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                ✏️ {c}
              </span>
            ))}
          </div>
        )
      }
    }
    return null
  }

  const getLogTitleAndSubtitle = (log: AuditLog) => {
    const data = log.newData || log.oldData
    if (!data) return { title: '-', subtitle: '' }
    
    let title = ''
    let subtitle = ''
    
    if (log.modelName === 'Expense') {
      title = data.description || 'Gasto sem descrição'
      const amountStr = data.amount ? ` | R$ ${data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''
      subtitle = `Ref: ${data.month || 'Sem mês'}${amountStr}`
    } else if (log.modelName === 'Person') {
      title = `Integrante: ${data.name || 'Sem nome'}`
      subtitle = data.phone ? `WhatsApp: ${data.phone}` : ''
    } else if (log.modelName === 'User') {
      title = `Usuário: ${data.name || 'Sem nome'}`
      subtitle = data.email || ''
    } else {
      title = `${log.modelName} (ID: ${log.recordId})`
    }
    
    return { title, subtitle }
  }

  const filteredLogs = logs.filter(log => {
    // Busca textual no usuário, tabela, ação ou descrição modificada
    const { title } = getLogTitleAndSubtitle(log)
    const matchesSearch = searchTerm.trim() === '' || 
      (log.user?.name || 'Sistema').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.modelName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por tipo de Ação (CREATE, UPDATE, DELETE)
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter
    
    // Filtro por Modelo/Tabela
    const matchesModel = modelFilter === 'ALL' || log.modelName === modelFilter

    return matchesSearch && matchesAction && matchesModel
  })

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage))

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Registro de Atividades (Auditoria)" maxWidth="950px">
        {loading ? (
          <PageLoader title="Buscando logs..." description="Isso pode demorar um pouco." inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Barra de Filtros */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Buscar por usuário, ação, tabela ou detalhe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ flex: '1 1 250px', fontSize: '0.85rem', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
              />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="input"
                style={{ width: 'auto', minWidth: '150px', fontSize: '0.85rem', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="ALL">Todas as Ações</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="input"
                style={{ width: 'auto', minWidth: '150px', fontSize: '0.85rem', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="ALL">Todas as Tabelas</option>
                <option value="Expense">Despesas</option>
                <option value="Person">Integrantes</option>
                <option value="User">Usuários</option>
                <option value="CategoryRule">Regras</option>
              </select>
            </div>

            <DataTable
              data={paginatedLogs}
              keyExtractor={(l) => l.id}
              emptyMessage="Nenhum log encontrado."
              columns={[
                {
                  key: 'date',
                  label: 'Data/Hora',
                  render: (log) => (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {`${new Date(log.createdAt).toLocaleDateString('pt-BR')} - ${new Date(log.createdAt).toLocaleTimeString('pt-BR')}`}
                    </span>
                  )
                },
                {
                  key: 'user',
                  label: 'Usuário',
                  render: (log) => (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.user?.name || 'Sistema'}</div>
                      {log.user?.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user.email}</div>}
                    </div>
                  )
                },
                {
                  key: 'action',
                  label: 'Ação',
                  render: (log) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                      {getActionBadge(log.action)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tabela: {log.modelName}</span>
                    </div>
                  )
                },
                {
                  key: 'target',
                  label: 'Modificação / Alvo',
                  render: (log) => {
                    const { title, subtitle } = getLogTitleAndSubtitle(log)
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>{title}</div>
                        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>}
                        {log.action === 'UPDATE' && getModifiedFieldsSummary(log)}
                      </div>
                    )
                  }
                },
                {
                  key: 'details',
                  label: 'Detalhes',
                  align: 'right',
                  render: (log) => (
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Eye size={14} /> JSON
                    </button>
                  )
                }
              ]}
              renderMobileCard={(log) => {
                const { title, subtitle } = getLogTitleAndSubtitle(log)
                return (
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{`${new Date(log.createdAt).toLocaleDateString('pt-BR')} - ${new Date(log.createdAt).toLocaleTimeString('pt-BR')}`}</span>
                      {getActionBadge(log.action)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{log.user?.name || 'Sistema'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tabela: {log.modelName}</div>
                    
                    <div style={{ borderLeft: '3px solid var(--border)', paddingLeft: '0.75rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</div>
                      {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>}
                      {log.action === 'UPDATE' && getModifiedFieldsSummary(log)}
                    </div>

                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="btn btn-outline"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                    >
                      Ver Payload JSON
                    </button>
                  </div>
                )
              }}
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={logs.length}
                itemsShown={paginatedLogs.length}
              />
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Detalhes do Log" maxWidth="700px">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)', fontSize: '0.9rem' }}>Antes (oldData)</h4>
                <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {selectedLog.oldData ? JSON.stringify(selectedLog.oldData, null, 2) : 'N/A'}
                </pre>
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)', fontSize: '0.9rem' }}>Depois (newData)</h4>
                <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {selectedLog.newData ? JSON.stringify(selectedLog.newData, null, 2) : 'N/A'}
                </pre>
              </div>
            </div>
            <button onClick={() => setSelectedLog(null)} className="btn btn-outline" style={{ alignSelf: 'flex-end' }}>Fechar</button>
          </div>
        )}
      </Modal>
    </>
  )
}
