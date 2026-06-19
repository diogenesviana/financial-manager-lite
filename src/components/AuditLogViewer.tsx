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

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage))

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Registro de Atividades (Auditoria)" maxWidth="900px">
        {loading ? (
          <PageLoader title="Buscando logs..." description="Isso pode demorar um pouco." inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
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
              renderMobileCard={(log) => (
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                    {getActionBadge(log.action)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{log.user?.name || 'Sistema'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tabela: {log.modelName}</div>
                  <button 
                    onClick={() => setSelectedLog(log)}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                  >
                    Ver Payload JSON
                  </button>
                </div>
              )}
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
