'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Shield, Trash2, ArrowLeft, UserCheck, MessageSquare, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  phone?: string | null
}

function ProfilePageContent() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; type: string; onConfirm: () => void } | null>(null)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) {
      return numbers
    }
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    }
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setName(data.user.name || '')
        setPhone(formatPhone(data.user.phone || ''))
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err)
      toast.error('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Telefone inválido. Digite DDD + Número.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      })

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!')
        // Force refresh user context
        await fetchUser()
        // Reload page header
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao atualizar perfil')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

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
      type,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
          })
          if (res.ok) {
            toast.success('Dados limpos com sucesso!')
            if (type === 'reset_all') {
              router.push('/')
              window.location.reload()
            } else {
              fetchUser()
            }
          } else {
            toast.error('Erro ao limpar dados')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
  }

  if (loading) {
    return <PageLoader title="Carregando perfil..." description="Carregando dados da sua conta." />
  }

  return (
    <MainLayout>
      <div className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
        
        {/* Header da Página */}
        <div className="flex-row flex-y-center gap-3">
          <Link href="/" className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-col">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
              Minha Conta & Ajustes
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Gerencie seus dados pessoais, automações e preferências do sistema.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Card Principal: Meu Perfil */}
          <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
              <UserCheck size={18} className="color-primary" />
              Editar Cadastro
            </h3>
            
            <form onSubmit={handleSaveProfile} className="flex-col gap-4">
              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome Completo</label>
                <input 
                  type="text" 
                  className="input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail (SSO / Login)</label>
                <input 
                  type="email" 
                  className="input" 
                  value={user?.email || ''} 
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--input-bg)' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  O e-mail é gerido pelo login e não pode ser alterado diretamente.
                </span>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp / Celular</label>
                <input 
                  type="tel" 
                  className="input" 
                  value={phone} 
                  onChange={(e) => setPhone(formatPhone(e.target.value))} 
                  placeholder="DDD + Número (ex: (11) 99999-9999)"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Necessário para notificações e regras de automação de despesas.
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving || !name.trim() || phone.replace(/\D/g, '').length < 10}
                style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', fontWeight: 700 }}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>

          {/* Card Administração (se admin) */}
          {user?.role === 'ADMIN' && (
            <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                <Shield size={18} className="color-primary" />
                Painel Administrativo
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Você possui privilégios de administrador. Use o painel para gerenciar os usuários cadastrados e permissões do sistema.
              </p>
              <Link href="/admin" className="btn btn-outline" style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}>
                Acessar Painel Admin
              </Link>
            </div>
          )}

          {/* Danger Zone (Zona de Perigo) */}
          <div className="card" style={{ padding: '2rem', border: '1px solid rgba(225, 29, 72, 0.25)', backgroundColor: 'rgba(225, 29, 72, 0.01)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertTriangle size={18} />
              Zona de Perigo
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Ações irreversíveis de limpeza de banco de dados. Passe o mouse sobre cada botão para ver os detalhes.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Tooltip style={{ width: '100%' }} content="Apaga todas as despesas que ainda não foram associadas a nenhum integrante (ex: importações recentes sem dono).">
                <button 
                  onClick={() => handleClearData('unassigned')}
                  className="sidebar-btn-danger"
                  style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <Trash2 size={14} />
                  Deletar Despesas Pendentes
                </button>
              </Tooltip>
              
              <Tooltip style={{ width: '100%' }} content="Deleta todas as despesas que já foram atribuídas a algum integrante do sistema.">
                <button 
                  onClick={() => handleClearData('assigned')}
                  className="sidebar-btn-danger"
                  style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <Trash2 size={14} />
                  Deletar Despesas Atribuídas
                </button>
              </Tooltip>
              
              <Tooltip style={{ width: '100%' }} content="Remove absolutamente todas as transações cadastradas, deixando o histórico de faturas vazio.">
                <button 
                  onClick={() => handleClearData('all_expenses')}
                  className="sidebar-btn-danger"
                  style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <Trash2 size={14} />
                  Limpar Todas as Despesas
                </button>
              </Tooltip>
              
              <Tooltip style={{ width: '100%' }} content="ATENÇÃO: Deleta todas as despesas e também todas as pessoas/integrantes cadastrados, reiniciando o sistema do zero.">
                <button 
                  onClick={() => handleClearData('reset_all')}
                  className="sidebar-btn-danger-solid"
                  style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%' }}
                >
                  <Trash2 size={14} />
                  Resetar Todo o Sistema
                </button>
              </Tooltip>
            </div>
          </div>

        </div>
      </div>

      {/* Diálogo de Confirmação local */}
      <AnimatePresence>
        {confirmDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(5px)'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card card-glass"
              style={{ width: '90%', maxWidth: '440px', padding: '2rem' }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>Confirmação</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
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
      <Toaster position="bottom-right" />
    </MainLayout>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageLoader title="Carregando perfil..." description="Carregando dados da sua conta." />}>
      <ProfilePageContent />
    </Suspense>
  )
}
