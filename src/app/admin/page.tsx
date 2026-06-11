'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UserPlus, Trash2, Mail, User as UserIcon, Lock, Shield, Loader2, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'

interface UserItem {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAdminId, setCurrentAdminId] = useState<string>('')

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null)

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
    // Tenta ler o cookie ou payload básico (o ID do admin logado)
    // Para simplificar, o backend retorna erro se o admin tentar se deletar.
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      toast.success('Usuário criado com sucesso!')
      setName('')
      setEmail('')
      setPassword('')
      setRole('USER')
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, var(--login-blob-1), transparent 45%), radial-gradient(circle at bottom left, var(--login-blob-2), transparent 45%), var(--background)',
      fontFamily: 'var(--font-inter), sans-serif',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem 1.5rem'
    }}>
      <Toaster position="bottom-right" />

      {/* Círculos de fundo blur */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        backgroundColor: 'var(--login-blob-1)',
        filter: 'blur(120px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        backgroundColor: 'var(--login-blob-2)',
        filter: 'blur(120px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/')}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                height: '2.5rem',
                width: '2.5rem',
                padding: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--foreground)',
                  letterSpacing: '-0.025em',
                  margin: 0
                }}>
                  Painel de Controle
                </h1>
                <span className="badge badge-blue">
                  Admin
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Gerenciamento de usuários e controle de acessos
              </p>
            </div>
          </div>
          <ThemeToggle variant="circle" />
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          alignItems: 'start'
        }}>
          {/* Formulário de Criação */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{
              flex: '1 1 350px',
              padding: '2rem',
              backgroundColor: 'var(--card)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.75rem'
            }}>
              <UserPlus size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Novo Usuário</h2>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  Nome Completo
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <UserIcon size={16} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Diógenes Viana"
                    className="input"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.6rem',
                      paddingBottom: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  E-mail
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="input"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.6rem',
                      paddingBottom: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  Senha Temporária
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.6rem',
                      paddingBottom: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  Nível de Acesso (Cargo)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Shield size={16} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="input"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '0.75rem',
                      paddingTop: '0.6rem',
                      paddingBottom: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      width: '100%',
                      outline: 'none',
                      backgroundColor: 'var(--input-bg)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="USER">Usuário Comum (USER)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    Adicionar Usuário
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Listagem de Usuários */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{
              flex: '2 1 500px',
              padding: '2rem',
              backgroundColor: 'var(--card)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.75rem'
            }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Usuários Cadastrados ({users.length})</h2>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem' }}>Carregando lista...</p>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                <p>Nenhum usuário cadastrado.</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem' }}>Nome / E-mail</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Cargo</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Data de Criação</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{user.email}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
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
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Excluir Usuário"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-users-list">
                  {users.map((user) => (
                    <div key={user.id} className="user-mobile-card">
                      <div className="user-mobile-card-header">
                        <div className="flex-col" style={{ gap: '0.2rem' }}>
                          <span className="user-mobile-card-name">{user.name}</span>
                          <span className="user-mobile-card-email">{user.email}</span>
                        </div>
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
                      </div>
                      <div className="user-mobile-card-footer">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Excluir Usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

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
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm()
                    setConfirmDialog(null)
                  }}
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
    </div>
  )
}
