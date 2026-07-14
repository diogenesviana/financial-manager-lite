import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import DataTable from './DataTable'
import PageLoader from './PageLoader'
import Pagination from './Pagination'

interface CategoryItem {
  id: string
  name: string
  createdAt: string
}

export default function SystemCategoriesManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(data)
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar categoria')
      }

      toast.success('Categoria criada com sucesso!')
      setName('')
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Tem certeza que deseja remover a categoria "${catName}"?\nNota: Isso não apagará despesas que já utilizam essa categoria, mas ela deixará de aparecer como opção.`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()

      toast.success('Categoria removida com sucesso!')
      fetchCategories()
    } catch {
      toast.error('Erro ao remover categoria')
    } finally {
      setDeletingId(null)
    }
  }

  const paginatedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(categories.length / itemsPerPage))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Categorias Globais" maxWidth="550px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Formulário de Criação */}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Nova Categoria
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Estudos, Assinaturas..."
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
              data={paginatedCategories}
              keyExtractor={(c) => c.id}
              emptyMessage="Nenhuma categoria cadastrada."
              columns={[
                {
                  key: 'name',
                  label: 'Nome da Categoria',
                  render: (c) => (
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                  )
                },
                {
                  key: 'actions',
                  label: 'Ações',
                  align: 'right',
                  render: (c) => (
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={deletingId === c.id}
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
                      title="Excluir Categoria"
                    >
                      {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )
                }
              ]}
              renderMobileCard={(c) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={deletingId === c.id}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}
                  >
                    {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              )}
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={categories.length}
                itemsShown={paginatedCategories.length}
              />
            )}
          </div>
        )}

        <button onClick={onClose} className="btn btn-outline" style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}>
          Fechar
        </button>
      </div>
    </Modal>
  )
}
