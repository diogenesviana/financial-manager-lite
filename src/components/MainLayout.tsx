'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { PieChart, Users, Zap, Settings, X, Shield, Trash2, LogOut, PlusCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'

interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  phone?: string | null
  avatar?: string | null
}

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(null)
  const [rulesCount, setRulesCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showPatchNotes, setShowPatchNotes] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  // Profile editing states
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '')
      setProfilePhone(user.phone || '')
      setPhoneInput(user.phone || '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    if (profilePhone.length < 10) {
      toast.error('Telefone inválido. Digite DDD + Número.')
      return
    }
    setSavingProfile(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone })
      })
      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!')
        await fetchGlobalData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao salvar perfil')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSavingProfile(false)
    }
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

  const handleSavePhone = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Telefone inválido. Digite DDD + Número.')
      return
    }
    setSavingPhone(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      })
      if (res.ok) {
        toast.success('WhatsApp configurado com sucesso!')
        await fetchGlobalData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao salvar telefone')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSavingPhone(false)
    }
  }

  const fetchGlobalData = async () => {
    try {
      const t = Date.now()
      const [userRes, rulesRes] = await Promise.all([
        fetch(`/api/auth/me?t=${t}`),
        fetch(`/api/rules?t=${t}`)
      ])
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRulesCount(Array.isArray(rulesData) ? rulesData.length : 0)
      }
    } catch (error) {
      console.error('Erro ao carregar dados globais:', error)
    }
  }

  useEffect(() => {
    fetchGlobalData()
  }, [pathname]) // Re-run when navigation happens

  // Auto-open settings if redirected with ?settings=true
  useEffect(() => {
    if (searchParams.get('settings') === 'true') {
      setShowSettings(true)
    }
  }, [searchParams])

  // Auto-open patch notes on first login/access of a new version
  useEffect(() => {
    const CURRENT_VERSION = '1.2.2'
    const lastSeenVersion = localStorage.getItem('seen-patch-notes-version')
    if (lastSeenVersion !== CURRENT_VERSION) {
      setShowPatchNotes(true)
    }
  }, [])

  const handleClosePatchNotes = () => {
    localStorage.setItem('seen-patch-notes-version', '1.2.2')
    setShowPatchNotes(false)
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
      onConfirm: async () => {
        try {
          const res = await fetch('/api/clear-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
          })
          if (res.ok) {
            toast.success('Dados apagados com sucesso!')
            setShowSettings(false)
            // Force reload to refresh children data
            window.location.reload()
          } else {
            toast.error('Erro ao limpar dados')
          }
        } catch (error) {
          toast.error('Erro de conexão')
        }
      }
    })
  }

  return (
    <main className="container">
      {/* Modal de Telefone Obrigatório */}
      <AnimatePresence>
        {user && !user.phone && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="card card-glass"
              style={{ 
                width: '90%', 
                maxWidth: '440px', 
                padding: '2.5rem 2rem', 
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '3.5rem', 
                height: '3.5rem', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(37, 211, 102, 0.15)', 
                color: '#25D366', 
                marginBottom: '1.5rem' 
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                Configure seu WhatsApp
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '2rem' }}>
                Para acessar o sistema, é obrigatório cadastrar seu WhatsApp. Isso permite a auto-atribuição de despesas e o envio correto de faturas compartilhadas.
              </p>

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número do Celular</label>
                <input 
                  type="tel"
                  className="input" 
                  placeholder="Ex: (11) 99999-9999" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSavePhone()}
                  style={{ padding: '0.75rem 1rem', fontSize: '1rem' }}
                  autoFocus
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Digite DDD + Número. Exemplo: (11) 99999-9999.
                </span>
              </div>

              <button 
                onClick={handleSavePhone}
                disabled={savingPhone || phoneInput.replace(/\D/g, '').length < 10}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.95rem' }}
              >
                {savingPhone ? 'Salvando...' : 'Confirmar e Acessar'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Cabeçalho Global */}
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo-group">
            <div className="app-logo-icon">
              <PieChart size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-row gap-2" style={{ alignItems: 'baseline' }}>
              <span className="app-logo-text">
                Financial <span className="app-logo-text-accent">Manager</span>
              </span>
              <Tooltip content="Ver novidades da versão">
                <span 
                  className="app-version" 
                  style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                  onClick={() => setShowPatchNotes(true)}
                >
                  v1.2.2
                </span>
              </Tooltip>
            </div>
          </div>
          <p className="app-subtitle">Controle de gastos compartilhados</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
            <span className="hide-mobile">Configurações</span>
          </button>
        </div>
      </header>

      {/* Tabs Globais de Navegação */}
      <div className="nav-tabs">
        <Link href="/" className={`nav-tab ${pathname === '/' ? 'active' : ''}`}>
          <PieChart size={18} />
          <span>Painel<span className="hide-mobile"> Geral</span></span>
        </Link>
        <Link href="/import" className={`nav-tab ${pathname === '/import' ? 'active' : ''}`}>
          <PlusCircle size={18} />
          <span><span className="hide-mobile">Importar & </span>Lançar</span>
        </Link>
        <Link href="/people" className={`nav-tab ${pathname === '/people' ? 'active' : ''}`}>
          <Users size={18} />
          <span>Pessoas<span className="hide-mobile"> (Gastos)</span></span>
        </Link>
        <Link href="/rules" className={`nav-tab ${pathname === '/rules' ? 'active' : ''}`}>
          <Zap size={18} />
          <span>Regras<span className="hide-mobile"> Automáticas</span></span>
        </Link>
      </div>

      {/* Conteúdo da Página */}
      {children}

      {/* Sidebar de Configurações Global */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="sidebar-overlay"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="sidebar-container"
            >
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Settings size={20} />
                  Configurações
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-col gap-6" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1rem' }}>
                {/* Minha Conta */}
                <div>
                  <h4 className="sidebar-section-title">Minha Conta</h4>
                  <Link
                    href="/profile"
                    className="card card-interactive flex-between"
                    style={{ padding: '1rem', textDecoration: 'none', border: '1px solid var(--border)' }}
                    onClick={() => setShowSettings(false)}
                  >
                    <div className="flex-row gap-3 flex-y-center">
                      <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                        <Settings size={16} />
                      </div>
                      <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Editar Perfil</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nome, WhatsApp e dados</span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Administração (se admin) */}
                {user?.role === 'ADMIN' && (
                  <div>
                    <h4 className="sidebar-section-title">Administração</h4>
                    <Link
                      href="/admin"
                      className="card card-interactive flex-between"
                      style={{ padding: '1rem', textDecoration: 'none', border: '1px solid var(--border)' }}
                      onClick={() => setShowSettings(false)}
                    >
                      <div className="flex-row gap-3 flex-y-center">
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                          <Shield size={16} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Painel Admin</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gerenciar usuários e permissões</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Automação */}
                <div>
                  <h4 className="sidebar-section-title">Automação</h4>
                  {pathname === '/rules' ? (
                    <div
                      className="card flex-between"
                      style={{ 
                        padding: '1rem', 
                        border: '1px solid var(--border)', 
                        background: 'var(--card)',
                        opacity: 0.85
                      }}
                    >
                      <div className="flex-row gap-3 flex-y-center">
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                          <Zap size={16} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Gerenciar Regras</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Você já está nesta tela</span>
                        </div>
                      </div>
                      <span className="badge badge-blue">
                        {rulesCount} regra{rulesCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/rules"
                      className="card card-interactive flex-between"
                      style={{ padding: '1rem', textDecoration: 'none', border: '1px solid var(--border)' }}
                      onClick={() => setShowSettings(false)}
                    >
                      <div className="flex-row gap-3 flex-y-center">
                        <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                          <Zap size={16} />
                        </div>
                        <div className="flex-col">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Gerenciar Regras</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automação de faturas</span>
                        </div>
                      </div>
                      <span className="badge badge-blue">
                        {rulesCount} regra{rulesCount !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  )}
                </div>

                {/* Aparência */}
                <div>
                  <h4 className="sidebar-section-title">Aparência</h4>
                  <div className="card flex-between" style={{ padding: '0.85rem 1.25rem', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>Tema do Sistema</span>
                    <ThemeToggle variant="circle" />
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                Financial Manager v1.2.2 • <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setShowSettings(false); setShowPatchNotes(true); }}>Ver novidades</span>
              </div>
              
              {user && (
                <div className="flex-row gap-3" style={{ 
                  alignItems: 'center',
                  marginTop: '1.25rem', 
                  borderTop: '1px solid var(--border)', 
                  paddingTop: '1.25rem',
                  justifyContent: 'space-between'
                }}>
                  <div className="flex-row gap-3" style={{ alignItems: 'center', overflow: 'hidden' }}>
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        style={{
                          height: '2.2rem',
                          width: '2.2rem',
                          minWidth: '2.2rem',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        height: '2.2rem',
                        width: '2.2rem',
                        minWidth: '2.2rem',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-col" style={{ overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.email}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      gap: '0.3rem',
                      alignItems: 'center',
                      borderColor: 'var(--border)',
                      color: 'var(--danger)',
                      cursor: 'pointer'
                    }}
                    onClick={async () => {
                      const res = await fetch('/api/logout', { method: 'POST' })
                      if (res.ok) {
                        router.push('/login')
                        router.refresh()
                      }
                    }}
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            padding: '0.75rem 1.25rem',
            maxWidth: '450px',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--card)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--card)',
            },
          },
        }}
      />


      {/* Confirm Modal Global */}
      <AnimatePresence>
        {confirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              className="modal-backdrop"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="card modal-card"
              style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', zIndex: 10000 }}
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

      <footer style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>© {new Date().getFullYear()} Financial Manager v1.2.1. Todos os direitos reservados. • <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowPatchNotes(true)}>Novidades</span></p>
        <p style={{ marginTop: '0.25rem' }}>Desenvolvido por <a href="https://www.linkedin.com/in/diogenes-viana/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Diógenes Viana</a></p>
      </footer>

      {/* Patch Notes Modal Global */}
      <AnimatePresence>
        {showPatchNotes && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={handleClosePatchNotes}
               className="modal-backdrop"
               style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="card modal-card"
               style={{ position: 'relative', width: '90%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '2rem', zIndex: 10000, overflowY: 'auto' }}
            >
              <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)' }}>
                  <Zap size={18} style={{ color: 'var(--primary)' }} />
                  Novidades da Versão 1.2.1
                </h3>
                <button 
                  onClick={handleClosePatchNotes}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-col gap-4" style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--foreground)' }}>
                <div>
                  <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>✍️ Lançamento manual de gastos aprimorado</h4>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Trouxemos o mesmo fluxo dinâmico e simplificado para o registro manual de gastos. O formulário agora inicia fechado sob um botão limpo e te ajuda a escolher o integrante primeiro antes de preencher os valores.</p>
                </div>

                <div>
                  <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>🧑‍🤝‍🧑 Adicionar integrante ficou muito mais fácil</h4>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Fluxo passo a passo mais inteligente. Perguntamos se a pessoa tem e-mail para buscar a conta dela no sistema, ou criamos um perfil local de forma simples e rápida.</p>
                </div>

                <div>
                  <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>🔍 Reconhecimento automático de convites</h4>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Busca automática por e-mail para validar e confirmar a foto e nome do integrante que você está convidando.</p>
                </div>
              </div>

              <button 
                onClick={handleClosePatchNotes}
                className="btn btn-primary"
                style={{ marginTop: '2rem', alignSelf: 'flex-end', padding: '0.5rem 1.5rem' }}
              >
                Entendi!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader title="Carregando painel..." description="Preparando o layout principal." />}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  )
}
