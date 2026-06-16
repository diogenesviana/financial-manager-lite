import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Settings, X, Shield, Zap, LogOut } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { SYSTEM_VERSION } from '@/lib/constants'

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: 'USER' | 'ADMIN'
}

interface SidebarProps {
  showSettings: boolean
  setShowSettings: (val: boolean) => void
  user: User | null
  rulesCount: number
  setShowPatchNotes: (val: boolean) => void
}

export default function Sidebar({ showSettings, setShowSettings, user, rulesCount, setShowPatchNotes }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
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
              Financial Manager v{SYSTEM_VERSION} • <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setShowSettings(false); setShowPatchNotes(true); }}>Ver novidades</span>
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
  )
}
