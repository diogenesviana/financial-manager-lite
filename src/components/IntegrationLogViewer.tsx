'use client'

import { useState, useEffect } from 'react'
import { Cpu, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import DataTable from './DataTable'
import PageLoader from './PageLoader'
import Pagination from './Pagination'

interface IntegrationLog {
  id: string
  serviceName: string
  operation: string
  status: 'SUCCESS' | 'ERROR'
  requestData?: any
  responseData?: any
  errorMessage?: string | null
  durationMs: number
  userId?: string | null
  createdAt: string
  user?: {
    name: string
    email: string
  } | null
}

export default function IntegrationLogViewer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null)

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
      const res = await fetch('/api/admin/integration-logs')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data)
    } catch {
      toast.error('Erro ao carregar os logs de integração')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: 'SUCCESS' | 'ERROR') => {
    let color = 'var(--text-muted)'
    let bg = 'var(--border)'
    if (status === 'SUCCESS') {
      color = 'var(--success)'
      bg = 'rgba(34, 197, 94, 0.1)'
    } else if (status === 'ERROR') {
      color = 'var(--danger)'
      bg = 'rgba(239, 68, 68, 0.1)'
    }
    
    return (
      <span style={{ 
        backgroundColor: bg, color: color, 
        padding: '0.2rem 0.5rem', borderRadius: '4px', 
        fontSize: '0.75rem', fontWeight: 700 
      }}>
        {status}
      </span>
    )
  }

  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage))

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Logs de Integrações Externas" maxWidth="950px">
        {loading ? (
          <PageLoader title="Buscando logs de integração..." description="Isso pode demorar um pouco." inline />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <DataTable
              data={paginatedLogs}
              keyExtractor={(l) => l.id}
              emptyMessage="Nenhum log de integração encontrado."
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
                  key: 'service',
                  label: 'Serviço / Operação',
                  render: (log) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                        {log.serviceName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.operation}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'duration',
                  label: 'Duração',
                  render: (log) => (
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      color: log.durationMs > 5000 ? 'var(--warning-text, #eab308)' : 'var(--text-muted)'
                    }}>
                      {log.durationMs} ms
                    </span>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (log) => getStatusBadge(log.status)
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
                      <Eye size={14} /> Payload
                    </button>
                  )
                }
              ]}
              renderMobileCard={(log) => (
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {`${new Date(log.createdAt).toLocaleDateString('pt-BR')} - ${new Date(log.createdAt).toLocaleTimeString('pt-BR')}`}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{log.serviceName} ({log.operation})</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Duração: {log.durationMs} ms | Solicitante: {log.user?.name || 'Sistema'}
                  </div>
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

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Payload do Log de Integração" maxWidth="800px">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Serviço:</strong> {selectedLog.serviceName} | <strong>Operação:</strong> {selectedLog.operation}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Duração:</strong> {selectedLog.durationMs} ms | <strong>Executado em:</strong> {new Date(selectedLog.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>

            {selectedLog.status === 'ERROR' && selectedLog.errorMessage && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--danger)', 
                padding: '1rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '0.85rem',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                <strong>Erro Retornado:</strong>
                <div style={{ marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {selectedLog.errorMessage}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)', fontSize: '0.9rem' }}>Envio (requestData)</h4>
                <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedLog.requestData ? JSON.stringify(selectedLog.requestData, null, 2) : 'N/A'}
                </pre>
              </div>
              <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)', fontSize: '0.9rem' }}>Retorno (responseData)</h4>
                <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedLog.responseData ? JSON.stringify(selectedLog.responseData, null, 2) : 'N/A'}
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
