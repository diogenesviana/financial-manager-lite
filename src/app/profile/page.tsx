'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Shield, Trash2, UserCheck, Plus, LogOut, Phone, Mail, User as UserIcon, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import MainLayout from '@/components/MainLayout'
import ConfirmModal from '@/components/ConfirmModal'
import PageLoader from '@/components/PageLoader'
import DangerZone, { DangerZoneItem } from '@/components/DangerZone'
import Tooltip from '@/components/Tooltip'
import ThemeToggle from '@/components/ThemeToggle'
import PageHeader from '@/components/PageHeader'
import Skeleton from '@/components/Skeleton'

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Hero Skeleton */}
      <div className="card card-glass" style={{ padding: '1.75rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Skeleton circle width={80} height={80} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <Skeleton width="180px" height="1.25rem" />
          <Skeleton width="220px" height="0.85rem" />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Skeleton width="70px" height="22px" style={{ borderRadius: '9999px' }} />
            <Skeleton width="90px" height="22px" style={{ borderRadius: '9999px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form Skeleton */}
        <div className="card card-glass" style={{ padding: '1.75rem', border: '1px solid var(--border)' }}>
          <Skeleton width="45%" height="1rem" style={{ marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Skeleton width="30%" height="0.65rem" />
                <Skeleton width="100%" height="44px" style={{ borderRadius: 'var(--radius-md)' }} />
              </div>
            ))}
            <Skeleton width="100%" height="46px" style={{ borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }} />
          </div>
        </div>

        {/* Settings & Danger Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card card-glass" style={{ padding: '1.75rem', border: '1px solid var(--border)' }}>
            <Skeleton width="40%" height="1rem" style={{ marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width="100%" height="52px" style={{ borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          </div>
          <div className="card card-glass" style={{ padding: '1.75rem', border: '1px solid var(--border)' }}>
            <Skeleton width="35%" height="1rem" style={{ marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width="100%" height="44px" style={{ borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
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
        await fetchUser()
        window.dispatchEvent(new Event('refreshGlobalUser'))
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
        <div className="flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0.5rem 0 2rem 0' }}>
        
        {/* Header da Página */}
        <PageHeader
          title="Minha Conta & Ajustes"
          description="Gerencie seus dados pessoais, preferências e configurações de conta."
          backHref="/"
        />

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Hero / Header Card do Perfil (Mobile-First) */}
            <div className="card card-glass" style={{ 
              padding: '1.5rem', 
              border: '1px solid var(--border)', 
              borderRadius: '16px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.25rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                position: 'relative', 
                width: '84px', 
                height: '84px', 
                borderRadius: '50%', 
                padding: '3px', 
                background: 'linear-gradient(135deg, var(--primary), #10b981)', 
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
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
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    border: '2px dashed var(--border)'
                  }}>
                    {name.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <label 
                  htmlFor="avatar-upload-hero" 
                  className="btn btn-primary" 
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    minHeight: '32px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    border: '2px solid var(--card)'
                  }}
                  title="Alterar foto de perfil"
                >
                  <Plus size={16} />
                </label>
                <input 
                  id="avatar-upload-hero" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground)', margin: 0, lineHeight: 1.2 }}>
                    {name || 'Usuário'}
                  </h2>
                  <span className={user?.role === 'ADMIN' ? "badge badge-blue" : "badge"} style={{
                    backgroundColor: user?.role === 'ADMIN' ? 'var(--primary-light)' : 'var(--border)',
                    color: user?.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {user?.role === 'ADMIN' ? 'ADMINISTRADOR' : 'USUÁRIO'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                  <Mail size={14} style={{ flexShrink: 0 }} />
                  {user?.email}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={13} />
                  Conta Ativa
                </div>
              </div>
            </div>
          
            {/* Grid Principal (Mobile-First: 1 Coluna em Mobile, 2 Colunas em Desktop) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            
              {/* Card 1: Form Cadastro */}
              <div className="card card-glass" style={{ padding: '1.75rem', border: '1px solid var(--border)', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                  <UserCheck size={18} className="color-primary" />
                  Editar Cadastro
                </h3>
                
                <form onSubmit={handleSaveProfile} className="flex-col gap-4">
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'block' }}>Nome Completo</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <UserIcon size={16} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input 
                        type="text" 
                        className="input" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Seu nome"
                        required
                        style={{ paddingLeft: '2.5rem', minHeight: '44px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'block' }}>E-mail (SSO / Login)</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input 
                        type="email" 
                        className="input" 
                        value={user?.email || ''} 
                        disabled
                        style={{ paddingLeft: '2.5rem', minHeight: '44px', width: '100%', borderRadius: '10px', fontSize: '0.9rem', opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--input-bg)' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      Gerido pelo login. Não pode ser alterado diretamente.
                    </span>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'block' }}>WhatsApp / Celular</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <input 
                        type="tel" 
                        className="input" 
                        value={phone} 
                        onChange={(e) => setPhone(formatPhone(e.target.value))} 
                        placeholder="DDD + Número (ex: (11) 99999-9999)"
                        required
                        style={{ paddingLeft: '2.5rem', minHeight: '44px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      Necessário para notificações e regras de automação.
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={saving || !name.trim() || phone.replace(/\D/g, '').length < 10}
                    style={{ 
                      width: '100%', 
                      minHeight: '46px',
                      fontWeight: 700, 
                      marginTop: '0.5rem', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      borderRadius: '10px',
                      fontSize: '0.95rem'
                    }}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </form>
              </div>

              {/* Coluna Direita: Configurações + Danger Zone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Configurações do Sistema */}
                <div className="card card-glass" style={{ padding: '1.75rem', border: '1px solid var(--border)', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                    <Settings size={18} className="color-primary" />
                    Preferências do Sistema
                  </h3>
                  
                  <div className="flex-col gap-3">
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '52px' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.1rem' }}>Tema do Sistema</label>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Alternar entre claro e escuro</span>
                      </div>
                      <ThemeToggle variant="circle" />
                    </div>

                    {user?.role === 'ADMIN' && (
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '52px' }}>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.1rem' }}>Painel Administrativo</label>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Gerenciar usuários e logs</span>
                        </div>
                        <Link href="/admin" className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Shield size={14} /> Acessar
                        </Link>
                      </div>
                    )}

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(225, 29, 72, 0.05)', borderRadius: '12px', border: '1px solid rgba(225, 29, 72, 0.2)', minHeight: '52px' }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', display: 'block', marginBottom: '0.1rem' }}>Encerrar Sessão</label>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Sair da sua conta</span>
                      </div>
                      <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <LogOut size={14} /> Sair
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone (Modal Interativo Dedicado) */}
                <DangerZone 
                  title="Zona de Perigo & Manutenção"
                  description="Ações sensíveis de limpeza de dados. Acesse o painel dedicado para gerenciar."
                  modalTitle="Gerenciar Zona de Perigo"
                >
                  <DangerZoneItem 
                    title="Desatribuir Todos os Gastos"
                    description="Remove o vínculo entre as despesas e os integrantes da conta. Os gastos continuam salvos, porém voltam para a lista como pendentes de dono."
                    impactLevel="MODERADO"
                    buttonText="Desatribuir"
                    buttonIcon={<Trash2 size={15} />}
                    onClick={() => handleClearData('unassign_all')}
                  />

                  <DangerZoneItem 
                    title="Apagar Todas as Despesas"
                    description="Exclui permanentemente todo o histórico de compras e despesas cadastradas no sistema. Integrantes e regras são preservados."
                    impactLevel="ALTO"
                    buttonText="Apagar Gastos"
                    buttonIcon={<Trash2 size={15} />}
                    onClick={() => handleClearData('all_expenses')}
                  />

                  <DangerZoneItem 
                    title="Apagar Todos os Integrantes"
                    description="Deleta todos os integrantes vinculados à conta. O seu próprio usuário ativo (login) é totalmente preservado."
                    impactLevel="ALTO"
                    buttonText="Apagar Pessoas"
                    buttonIcon={<Trash2 size={15} />}
                    onClick={() => handleClearData('all_people')}
                  />

                  <DangerZoneItem 
                    title="Apagar Todas as Regras"
                    description="Exclui todas as regras de atribuição automática cadastradas para o seu usuário. Novas faturas não receberão categorias nem pessoas automáticas."
                    impactLevel="MODERADO"
                    buttonText="Apagar Regras"
                    buttonIcon={<Trash2 size={15} />}
                    onClick={() => handleClearData('all_rules')}
                  />

                  <DangerZoneItem 
                    title="Reset Total do Sistema"
                    description="Ação mais crítica: remove todas as despesas, pessoas e regras cadastradas. Seu login é mantido, mas a conta volta ao estado inicial limpo."
                    impactLevel="CRÍTICO"
                    buttonText="Resetar Tudo"
                    buttonIcon={<Trash2 size={15} />}
                    variant="danger-solid"
                    onClick={() => handleClearData('reset_all')}
                  />
                </DangerZone>

              </div>
            </div>
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
