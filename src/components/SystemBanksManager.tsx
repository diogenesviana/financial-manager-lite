import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import DataTable from './DataTable'
import PageLoader from './PageLoader'
import Pagination from './Pagination'
import ConfirmModal from './ConfirmModal'

interface BankItem {
  id: string
  name: string
  createdAt: string
}

export default function SystemBanksManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [banks, setBanks] = useState<BankItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    if (isOpen) {
      fetchBanks()
    }
  }, [isOpen])

  const fetchBanks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/banks')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBanks(data)
    } catch {
      toast.error('Erro ao carregar bancos/cartões')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar banco/cartão')
      }

      toast.success('Banco/Cartão criado com sucesso!')
      setName('')
      fetchBanks()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string, bankName: string) => {
    setDeleteConfirm({ id, name: bankName })
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    const id = deleteConfirm.id
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/banks/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()

      toast.success('Banco/Cartão removido com sucesso!')
      fetchBanks()
    } catch {
      toast.error('Erro ao remover banco/cartão')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const paginatedBanks = banks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(banks.length / itemsPerPage))

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Bancos e Cartões" maxWidth="550px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Formulário de Criação */}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Novo Banco ou Cartão
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Caju, Flash, Alelo..."
                className="input"
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', fontSize: '0.9rem' }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Adicionar
            </button>
          </form>

          {/* Listagem */}
          {loading ? (
            <PageLoader title="Carregando..." description="" inline />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <DataTable
                data={paginatedBanks}
                keyExtractor={(b) => b.id}
                emptyMessage="Nenhum banco/cartão cadastrado."
                columns={[
                  {
                    key: 'name',
                    label: 'Nome do Banco / Cartão',
                    render: (b) => (
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</span>
                    )
                  },
                  {
                    key: 'actions',
                    label: 'Ações',
                    align: 'right',
                    render: (b) => (
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        disabled={deletingId === b.id}
                        className="btn btn-outline"
                        style={{ 
                          padding: '0.35rem 0.5rem', 
                          borderColor: 'rgba(239, 68, 68, 0.2)', 
                          color: 'var(--danger)', 
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Excluir Banco/Cartão"
                      >
                        {deletingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    )
                  }
                ]}
                renderMobileCard={(b) => (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</span>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      disabled={deletingId === b.id}
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}
                    >
                      {deletingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                )}
              />

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={banks.length}
                  itemsShown={paginatedBanks.length}
                />
              )}
            </div>
          )}

          <button onClick={onClose} className="btn btn-outline" style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
            Fechar
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
        title="Remover Banco/Cartão"
        message={`Tem certeza que deseja remover o banco/cartão "${deleteConfirm?.name}"?\nNota: Isso não apagará despesas que já utilizam esse banco/cartão, mas ele deixará de aparecer como opção.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}
