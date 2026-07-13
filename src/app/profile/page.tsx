'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Shield, Trash2, ArrowLeft, UserCheck, MessageSquare, AlertTriangle, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'
import ConfirmModal from '@/components/ConfirmModal'
import PageLoader from '@/components/PageLoader'
import DangerZone from '@/components/DangerZone'
import Tooltip from '@/components/Tooltip'
import ThemeToggle from '@/components/ThemeToggle'
import PageHeader from '@/components/PageHeader'
import Skeleton from '@/components/Skeleton'
import { LogOut } from 'lucide-react'

function ProfileSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
      {/* Card Perfil */}
      <div className="card card-glass" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
        <Skeleton width="45%" height="1rem" style={{ marginBottom: '1.5rem' }} />
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Skeleton circle width={96} height={96} />
          <Skeleton width="120px" height="0.75rem" />
        </div>
        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Skeleton width="30%" height="0.65rem" />
              <Skeleton width="100%" height="42px" style={{ borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
          <Skeleton width="100%" height="44px" style={{ borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }} />
        </div>
      </div>

      {/* Card Configurações / Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card card-glass" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
          <Skeleton width="40%" height="1rem" style={{ marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <Skeleton width="140px" height="0.85rem" />
                  <Skeleton width="100px" height="0.65rem" />
                </div>
                <Skeleton width="42px" height="24px" style={{ borderRadius: '9999px' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="card card-glass" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
          <Skeleton width="35%" height="1rem" style={{ marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2].map((i) => (
              <Skeleton key={i} width="100%" height="40px" style={{ borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  phone?: string | null
  avatar?: string | null
}

function ProfilePageContent() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; type: string; onConfirm: () => void } | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      toast.error('Imagem muito grande. Limite de 1MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

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
        if (data.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setPhone(formatPhone(data.user.phone || ''))
          setAvatar(data.user.avatar || null)
        } else {
          router.push('/login')
        }
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
        body: JSON.stringify({ name, phone, avatar })
      })

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!')
        // Force refresh user context locally and globally
        await fetchUser()
        window.dispatchEvent(new Event('refreshGlobalUser'))
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
    if (type === 'unassign_all') {
      confirmMsg = 'Tem certeza que deseja desatribuir todos os gastos? Eles voltarão a ficar sem integrantes associados.'
    } else if (type === 'all_expenses') {
      confirmMsg = 'Tem certeza que deseja apagar todos os gastos? Essa ação é definitiva e removerá todo o histórico de compras.'
    } else if (type === 'all_people') {
      confirmMsg = 'Tem certeza que deseja apagar todos os integrantes? O seu perfil próprio (usuário ativo) será preservado.'
    } else if (type === 'all_rules') {
      confirmMsg = 'Tem certeza que deseja apagar todas as regras de atribuição automática?'
    } else if (type === 'reset_all') {
      confirmMsg = 'ATENÇÃO CRÍTICA: Isso apagará todas as despesas, todas as regras e todos os integrantes. O seu usuário (login) NÃO será apagado. Deseja redefinir todo o sistema?'
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

  const handleLogout = async () => {
    const res = await fetch('/api/logout', { method: 'POST' })
    if (res.ok) {
      window.location.href = '/login'
    }
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 0' }}>
        
        {/* Header da Página */}
        <PageHeader
          title="Minha Conta & Ajustes"
          description="Gerencie seus dados pessoais, automações e preferências do sistema."
          backHref="/"
        />

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Card Principal: Meu Perfil */}
          <div className="card card-glass" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
              <UserCheck size={18} className="color-primary" />
              Editar Cadastro
            </h3>
            
            <form onSubmit={handleSaveProfile} className="flex-col gap-4">
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Foto de Perfil</label>
                <div style={{ 
                  position: 'relative', 
                  width: '96px', 
                  height: '96px', 
                  borderRadius: '50%', 
                  padding: '3px', 
                  background: 'linear-gradient(135deg, var(--primary), var(--success))', 
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card)' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 800,
                      border: '2px dashed var(--border)'
                    }}>
                      {name.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <label 
                    htmlFor="avatar-upload" 
                    className="btn btn-primary" 
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-md)',
                      border: '2px solid var(--card)'
                    }}
                    title="Alterar foto"
                  >
                    <Plus size={16} />
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>

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
                style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', fontWeight: 700, marginTop: '0.5rem' }}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>

          {/* Configurações do Sistema (Substitui o antigo Menu Hamburguer no mobile) */}
          <div className="card card-glass" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
              <Settings size={18} className="color-primary" />
              Configurações
            </h3>
            
            <div className="flex-col gap-4">
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.2rem' }}>Tema do Sistema</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alternar entre claro e escuro</span>
                </div>
                <ThemeToggle variant="circle" />
              </div>

              {user?.role === 'ADMIN' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.2rem' }}>Painel Administrativo</label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gerenciar usuários e permissões</span>
                  </div>
                  <Link href="/admin" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Shield size={16} /> Acessar
                  </Link>
                </div>
              )}

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(225, 29, 72, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)', display: 'block', marginBottom: '0.2rem' }}>Encerrar Sessão</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sair da sua conta de usuário</span>
                </div>
                <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone (Zona de Perigo) */}
          <DangerZone description="Ações irreversíveis de limpeza de banco de dados. Passe o mouse sobre cada botão para ver os detalhes.">
            <Tooltip style={{ width: '100%' }} content="Desvincula todos os gastos associados a integrantes, fazendo-os voltar a ficar sem dono (pendentes).">
              <button 
                onClick={() => handleClearData('unassign_all')}
                className="sidebar-btn-danger"
                style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
                Desatribuir Todos os Gastos
              </button>
            </Tooltip>
            
            <Tooltip style={{ width: '100%' }} content="Apaga permanentemente todas as despesas cadastradas no sistema.">
              <button 
                onClick={() => handleClearData('all_expenses')}
                className="sidebar-btn-danger"
                style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
                Apagar Todas as Despesas
              </button>
            </Tooltip>
            
            <Tooltip style={{ width: '100%' }} content="Deleta todos os integrantes cadastrados no sistema, exceto a sua própria conta de usuário ativo.">
              <button 
                onClick={() => handleClearData('all_people')}
                className="sidebar-btn-danger"
                style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
                Apagar Todos os Integrantes
              </button>
            </Tooltip>

            <Tooltip style={{ width: '100%' }} content="Apaga permanentemente todas as regras automáticas de atribuição de despesas.">
              <button 
                onClick={() => handleClearData('all_rules')}
                className="sidebar-btn-danger"
                style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
                Apagar Todas as Regras
              </button>
            </Tooltip>
            
            <Tooltip style={{ width: '100%' }} content="ATENÇÃO MÁXIMA: Deleta todas as despesas, regras e integrantes. Sua conta de usuário (login) NÃO será excluída.">
              <button 
                onClick={() => handleClearData('reset_all')}
                className="sidebar-btn-danger-solid"
                style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
                Reset Total do Sistema
              </button>
            </Tooltip>
          </DangerZone>
        </div>
      )}
      </div>
      </motion.div>
      {/* Diálogo de Confirmação local */}
      <ConfirmModal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm()
        }}
        message={confirmDialog?.message || ''}
      />
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
