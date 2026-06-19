'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserPlus, Trash2, Mail, User as UserIcon, Lock, Shield, Loader2, Users, Key, Search, ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import GlobalToaster from '@/components/GlobalToaster'
import ConfirmModal from '@/components/ConfirmModal'
import ThemeToggle from '@/components/ThemeToggle'
import PageLoader from '@/components/PageLoader'
import DangerZone from '@/components/DangerZone'
import Modal from '@/components/Modal'
import Pagination from '@/components/Pagination'
import DataTable, { Column } from '@/components/DataTable'
import MainLayout from '@/components/MainLayout'
import AuditLogViewer from '@/components/AuditLogViewer'
import { Activity } from 'lucide-react'

interface UserItem {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  forcePasswordReset?: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAdminId, setCurrentAdminId] = useState<string>('')
  
  // Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAuditViewerOpen, setIsAuditViewerOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
  const [submitting, setSubmitting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)

  // Filtros e Paginação
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Fetch Users and Current Admin Info
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data)
    } catch {
      toast.error('Erro ao carregar lista de usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    
    // Obter o admin logado para evitar auto-exclusão
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) {
        setCurrentAdminId(data.user.id)
      }
    }).catch(() => {})
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error('Preencha todos os campos')
      return
    }

    setSubmitting(true)
    setGeneratedPassword(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      toast.success('Usuário criado com sucesso!')
      setName('')
      setEmail('')
      setRole('USER')
      setIsCreateModalOpen(false)
      setGeneratedPassword(data.generatedPassword)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string, userName: string) => {
    setConfirmDialog({
      message: `Tem certeza que deseja excluir o usuário "${userName}"? \nATENÇÃO: Isso apagará permanentemente todos os gastos, pessoas e regras associados a esta conta!`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
          })

          const data = await res.json()
          if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir usuário')
          }

          toast.success('Usuário excluído com sucesso!')
          fetchUsers()
        } catch (err: any) {
          toast.error(err.message)
        }
      }
    })
  }

  const handleWipeSystem = () => {
    setConfirmDialog({
      message: 'ATENÇÃO CRÍTICA: Você está prestes a apagar TODOS os usuários (exceto você), todos os gastos, integrantes e regras automáticas. Essa ação é IRREVERSÍVEL. Tem certeza?',
      onConfirm: async () => {
        try {
          setLoading(true)
          const res = await fetch('/api/admin/wipe', { method: 'POST' })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erro ao limpar sistema')
          toast.success('Sistema limpo com sucesso!')
          fetchUsers()
        } catch (err: any) {
          toast.error(err.message)
          setLoading(false)
        }
      }
    })
  }

  const handleRegeneratePassword = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: 'POST'
      })
      const data = await res.json()
      if (res.ok) {
        setGeneratedPassword(data.newPassword)
        fetchUsers() // Refresh list just in case
      } else {
        toast.error(data.error || 'Erro ao gerar nova senha')
      }
    } catch (err) {
      toast.error('Erro de conexão')
    }
  }

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const roleMatch = roleFilter === 'ALL' || user.role === roleFilter
    return searchMatch && roleMatch
  })

  // Paginar usuários
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Voltar para a página 1 ao alterar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  return (
    <MainLayout>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            Lista de Usuários
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gerencie os usuários e permissões do sistema.
          </p>
        </div>
      </div>



        {/* Form Modal */}
        <Modal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          title="Adicionar Novo Usuário"
          maxWidth="450px"
        >
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Nome Completo</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Diógenes Viana"
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>E-mail</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Nível de Acesso</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Shield size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', outline: 'none', backgroundColor: 'var(--input-bg)', cursor: 'pointer' }}
                >
                  <option value="USER">Usuário Comum</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <> <UserPlus size={16} /> Adicionar Usuário </>}
            </button>
          </form>
        </Modal>

        {/* Password Modal */}
        <Modal 
          isOpen={!!generatedPassword} 
          onClose={() => setGeneratedPassword(null)} 
          title="Senha Gerada com Sucesso!"
          maxWidth="400px"
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Copie a senha temporária abaixo e envie ao usuário. Por questões de segurança, ele será obrigado a trocá-la no primeiro acesso.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <code style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: 'var(--background)', borderRadius: '8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', userSelect: 'all', border: '1px solid var(--border)' }}>
                {generatedPassword}
              </code>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(generatedPassword!); toast.success('Senha copiada!'); }}
                className="btn btn-primary"
                style={{ padding: '0.75rem', borderRadius: '8px' }}
                title="Copiar senha"
              >
                Copiar
              </button>
            </div>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setGeneratedPassword(null)}>
              Fechar
            </button>
          </div>
        </Modal>

        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          alignItems: 'start'
        }}>
          {/* Listagem de Usuários */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{
              flex: '2 1 500px',
              maxWidth: '100%',
              padding: '2rem',
              backgroundColor: 'var(--card)'
            }}
          >
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: '1 1 250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '2.5rem', padding: '0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ position: 'relative', width: 'auto', minWidth: '150px' }}>
                <Filter size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'USER')}
                  className="input"
                  style={{ width: '100%', paddingLeft: '2.5rem', padding: '0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', cursor: 'pointer', backgroundColor: 'var(--input-bg)' }}
                >
                  <option value="ALL">Todos os Cargos</option>
                  <option value="ADMIN">Admins</option>
                  <option value="USER">Usuários</option>
                </select>
              </div>
            </div>

            {loading ? (
              <PageLoader title="Carregando lista..." description="Buscando usuários cadastrados no sistema." inline={true} />
            ) : (
              <>
                <div id="admin-table-container">
                <DataTable
                  data={paginatedUsers}
                  keyExtractor={(u) => u.id}
                  emptyMessage="Nenhum usuário encontrado."
                  columns={[
                    {
                      key: 'user',
                      label: 'Usuário',
                      render: (user) => (
                        <>
                          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{user.email}</div>
                        </>
                      )
                    },
                    {
                      key: 'role',
                      label: 'Cargo',
                      render: (user) => (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <span className={user.role === 'ADMIN' ? "badge badge-blue" : "badge"} style={{
                            backgroundColor: user.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--border)',
                            color: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {user.role}
                          </span>
                          {user.forcePasswordReset && (
                            <span className="badge" style={{
                              backgroundColor: 'rgba(234, 179, 8, 0.1)',
                              color: '#eab308',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              Pendente
                            </span>
                          )}
                        </div>
                      )
                    },
                    {
                      key: 'createdAt',
                      label: 'Criado em',
                      render: (user) => <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                    },
                    {
                      key: 'lastLogin',
                      label: 'Último Acesso',
                      render: (user: any) => (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca acessou'}
                        </span>
                      )
                    },
                    {
                      key: 'actions',
                      label: 'Ações',
                      align: 'right',
                      render: (user) => (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {user.forcePasswordReset && (
                            <button
                              onClick={() => handleRegeneratePassword(user.id, user.name)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Gerar nova senha temporária"
                            >
                              <Key size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.id === currentAdminId}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: user.id === currentAdminId ? 'var(--text-muted)' : 'var(--danger)',
                              opacity: user.id === currentAdminId ? 0.3 : 1,
                              cursor: user.id === currentAdminId ? 'not-allowed' : 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={user.id === currentAdminId ? "Você não pode excluir a sua própria conta" : "Excluir Usuário"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                    }
                  ]}
                  renderMobileCard={(user) => (
                    <div className="user-mobile-card">
                      <div className="user-mobile-card-header">
                        <div className="flex-col" style={{ gap: '0.2rem' }}>
                          <span className="user-mobile-card-name">{user.name}</span>
                          <span className="user-mobile-card-email">{user.email}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          <span className={user.role === 'ADMIN' ? "badge badge-blue" : "badge"} style={{
                            backgroundColor: user.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--border)',
                            color: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {user.role}
                          </span>
                          {user.forcePasswordReset && (
                            <span className="badge" style={{
                              backgroundColor: 'rgba(234, 179, 8, 0.1)',
                              color: '#eab308',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}>
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="user-mobile-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {user.forcePasswordReset && (
                            <button
                              onClick={() => handleRegeneratePassword(user.id, user.name)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Gerar nova senha temporária"
                            >
                              <Key size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.id === currentAdminId}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: user.id === currentAdminId ? 'var(--text-muted)' : 'var(--danger)',
                              opacity: user.id === currentAdminId ? 0.3 : 1,
                              cursor: user.id === currentAdminId ? 'not-allowed' : 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={user.id === currentAdminId ? "Você não pode excluir a sua própria conta" : "Excluir Usuário"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                />

                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      const tableContainer = document.getElementById('admin-table-container');
                      if (tableContainer) {
                        const y = tableContainer.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }}
                    totalItems={filteredUsers.length}
                    itemsShown={paginatedUsers.length}
                    style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}
                  />
                )}
                </div>
              </>
            )}
          </motion.div>

          <div style={{ flex: '1 1 350px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Botão Novo Usuário (Card) */}
            <div 
              onClick={() => setIsCreateModalOpen(true)}
              className="card card-glass clickable-card import-option-card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center', 
                gap: '1rem',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="import-option-card-icon-wrapper" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
              }}>
                <UserPlus size={28} className="import-icon" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
                  Novo Usuário
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Adicione manualmente um novo membro com permissões de acesso ao sistema.
                </p>
              </div>
            </div>

            {/* Botão Registro de Atividades (Card) */}
            <div 
              onClick={() => setIsAuditViewerOpen(true)}
              className="card card-glass clickable-card import-option-card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center', 
                gap: '1rem',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="import-option-card-icon-wrapper" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
              }}>
                <Activity size={28} className="import-icon" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
                  Registro de Atividades
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Acesse os logs de auditoria para ver quem modificou dados no sistema.
                </p>
              </div>
            </div>

            {/* Danger Zone Component */}
            <DangerZone>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                  onClick={handleWipeSystem}
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--danger)',
                    borderColor: 'var(--danger)',
                    fontWeight: 600,
                    padding: '0.75rem 1.25rem'
                  }}
                >
                  <Trash2 size={18} />
                  Limpar Sistema Todo
                </button>
              </div>
            </DangerZone>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => {
            if (confirmDialog) confirmDialog.onConfirm()
          }}
          message={confirmDialog?.message || ''}
        />

        <AuditLogViewer 
          isOpen={isAuditViewerOpen} 
          onClose={() => setIsAuditViewerOpen(false)} 
        />
      </MainLayout>
    )
}
