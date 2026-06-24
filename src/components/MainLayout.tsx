'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { PieChart, Users, Zap, Settings, X, Shield, Trash2, LogOut, PlusCircle, Lock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import GlobalToaster from '@/components/GlobalToaster'
import ThemeToggle from '@/components/ThemeToggle'
import PageLoader from '@/components/PageLoader'
import Tooltip from '@/components/Tooltip'
import ConfirmModal from '@/components/ConfirmModal'
import Modal from '@/components/Modal'
import { SYSTEM_VERSION } from '@/lib/constants'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import NavigationShell from '@/components/NavigationShell'

interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  forcePasswordReset?: boolean
  role: 'USER' | 'ADMIN'
}

let globalCachedUser: User | null = null;
let globalCachedRulesCount = 0;
let globalLastFetchTime = 0;

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<User | null>(globalCachedUser)
  const [checkingAuth, setCheckingAuth] = useState(!globalCachedUser)
  const [rulesCount, setRulesCount] = useState(globalCachedRulesCount)
  const [showSettings, setShowSettings] = useState(false)
  const [showPatchNotes, setShowPatchNotes] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Force Password Reset states
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

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
        await fetchGlobalData(true)
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
        await fetchGlobalData(true)
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

  const handleForcePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      toast.error('A senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial.')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      if (res.ok) {
        toast.success('Senha atualizada com sucesso!')
        setNewPassword('')
        setConfirmNewPassword('')
        await fetchGlobalData(true)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao alterar senha.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setChangingPassword(false)
    }
  }

  const fetchGlobalData = async (force = false) => {
    try {
      if (!force && globalCachedUser && Date.now() - globalLastFetchTime < 5 * 60 * 1000) {
        setUser(globalCachedUser);
        setRulesCount(globalCachedRulesCount);
        setCheckingAuth(false);
        return;
      }
      
      const t = Date.now()
      const [userRes, rulesRes] = await Promise.all([
        fetch(`/api/auth/me?t=${t}`),
        fetch(`/api/rules?t=${t}`)
      ])
      if (userRes.ok) {
        const userData = await userRes.json()
        if (userData.user) {
          globalCachedUser = userData.user;
          globalLastFetchTime = Date.now();
          setUser(userData.user)
          setCheckingAuth(false)
        } else {
          globalCachedUser = null;
          router.push('/login')
          return
        }
      } else {
        globalCachedUser = null;
        router.push('/login')
        return
      }
      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        const count = Array.isArray(rulesData) ? rulesData.length : 0;
        globalCachedRulesCount = count;
        setRulesCount(count)
      }
    } catch (error) {
      console.error('Erro ao carregar dados globais:', error)
    }
  }

  useEffect(() => {
    fetchGlobalData()
  }, [pathname]) // Re-run when navigation happens

  // Custom event to force a global refresh from other components
  useEffect(() => {
    const handleRefresh = () => fetchGlobalData(true)
    window.addEventListener('refreshGlobalUser', handleRefresh)
    return () => window.removeEventListener('refreshGlobalUser', handleRefresh)
  }, [])

  // Auto-open settings if redirected with ?settings=true
  useEffect(() => {
    if (searchParams.get('settings') === 'true') {
      setShowSettings(true)
    }
  }, [searchParams])

  // Auto-open patch notes on first login/access of a new version
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('seen-patch-notes-version')
    if (lastSeenVersion !== SYSTEM_VERSION) {
      setShowPatchNotes(true)
    }
  }, [])

  const handleClosePatchNotes = () => {
    localStorage.setItem('seen-patch-notes-version', SYSTEM_VERSION)
    setShowPatchNotes(false)
  }

  if (checkingAuth || !user) {
    return <PageLoader title="Verificando sessão..." description="Aguarde um momento." />
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
    <div className="app-shell-layout">
      {/* NOVO MENU LATERAL / BOTTOM TABS */}
      <NavigationShell 
        user={user}
        rulesCount={rulesCount}
        setShowSettings={setShowSettings}
        setShowPatchNotes={setShowPatchNotes}
      />

      <div className="app-shell-content">
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
      
      {/* ANTIGO CABEÇALHO E TABS (COMENTADOS PARA ROLLBACK FÁCIL) */}
      {/* 
      <Header setShowSettings={setShowSettings} setShowPatchNotes={setShowPatchNotes} />
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
      */}

      {/* Conteúdo da Página */}
      {children}

      {/* Sidebar de Configurações Global */}
      <Sidebar 
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        user={user}
        rulesCount={rulesCount}
        setShowPatchNotes={setShowPatchNotes}
      />

      <GlobalToaster />


      {/* Confirm Modal Global */}
      <ConfirmModal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (confirmDialog) confirmDialog.onConfirm()
        }}
        message={confirmDialog?.message || ''}
      />

      <Footer setShowPatchNotes={setShowPatchNotes} />

      {/* Patch Notes Modal Global */}
      <Modal 
        isOpen={showPatchNotes} 
        onClose={handleClosePatchNotes} 
        title={`Novidades da Versão ${SYSTEM_VERSION}`}
        maxWidth="500px"
      >
        <div className="flex-col gap-4" style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--foreground)' }}>
          <div>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>🏷️ Regras de Categorização de Gastos</h4>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Nova aba na tela de Regras Automáticas! Agora você pode criar regras por palavra-chave para categorizar seus gastos automaticamente ao importar faturas. Funciona igual às regras de integrantes: basta clicar na categoria desejada e cadastrar a palavra-chave.</p>
          </div>

          <div>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>✏️ Edição de Categoria e Cartão</h4>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Na edição de gastos, agora é possível alterar a categoria (via dropdown) e o cartão de gastos manuais. Mais controle para você organizar suas finanças do jeito certo!</p>
          </div>

          <div>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>🤖 IA como Fallback Inteligente</h4>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>As regras manuais de categoria agora têm prioridade sobre a sugestão da IA. A inteligência artificial continua categorizando automaticamente, mas apenas quando não existe uma regra cadastrada por você.</p>
          </div>
        </div>

        <button 
          onClick={handleClosePatchNotes}
          className="btn btn-primary"
          style={{ marginTop: '2rem', width: '100%', padding: '0.75rem' }}
        >
          Entendi!
        </button>
      </Modal>

      {/* Modal de Forçar Troca de Senha */}
      <Modal 
        isOpen={!!user?.forcePasswordReset} 
        onClose={() => {}} 
        title="Segurança da Conta"
        maxWidth="400px"
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Shield size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Por motivos de segurança, você precisa redefinir sua senha temporária antes de continuar usando o sistema.
          </p>
        </div>

        <form onSubmit={handleForcePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', textAlign: 'left' }}>Nova Senha</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input"
                style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', textAlign: 'left' }}>Confirmar Nova Senha</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className="input"
                style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.6rem', paddingBottom: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', outline: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', marginTop: '0.5rem', cursor: 'pointer', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--danger)', color: 'white' }}
          >
            {changingPassword ? <Loader2 size={18} className="animate-spin" /> : 'Atualizar Senha'}
          </button>
        </form>
      </Modal>
        </main>
      </div>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader title="Carregando painel..." description="Preparando o layout principal." />}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  )
}
