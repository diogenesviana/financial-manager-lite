'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PieChart, Lock, Mail, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import GlobalToaster from '@/components/GlobalToaster'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      if (error === 'unregistered') {
        toast.error('Este e-mail do Google não está cadastrado no sistema. Solicite acesso ao administrador.')
      } else if (error === 'google_auth_failed') {
        toast.error('Falha na autenticação com o Google.')
      } else if (error === 'server_configuration_error') {
        toast.error('Google SSO não está configurado no servidor. Configure as credenciais no painel.')
      } else {
        toast.error('Erro ao realizar login via Google SSO.')
      }
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login')
      }

      toast.success('Login realizado com sucesso! Redirecionando...')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || 'Credenciais inválidas')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* Light/Dark gradient background blobs for depth */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
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
        right: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        backgroundColor: 'var(--login-blob-2)',
        filter: 'blur(120px)',
        pointerEvents: 'none'
      }} />

      <GlobalToaster />


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="login-card"
      >
        {/* Logo e Cabeçalho */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            height: '3rem',
            width: '3rem',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), #1e40af)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            marginBottom: '1rem'
          }}>
            <PieChart size={24} />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--foreground)',
            marginBottom: '0.25rem',
            textAlign: 'center',
            letterSpacing: '-0.025em'
          }}>
            Financial <span style={{
              background: 'linear-gradient(135deg, var(--primary), #1e40af)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800
            }}>Manager</span>
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            Versão 1.2.1 • Controle Financeiro Pessoal
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              <Mail size={18} style={{
                position: 'absolute',
                left: '1rem',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="input"
                style={{
                  paddingLeft: '2.75rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem'
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
              Senha
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '1rem',
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
                  paddingLeft: '2.75rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem'
                }}
              />
            </div>
          </div>

          {/* Lembrar-me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  height: '1rem',
                  width: '1rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lembrar-me por 7 dias
              </span>
            </label>
          </div>

          {/* Botão de Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
              transition: 'all 0.2s ease',
              border: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Divisor */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0.25rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          </div>

          {/* Botão Google SSO */}
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              window.location.href = '/api/auth/google/login'
            }}
            disabled={loading}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-light)'
              e.currentTarget.style.borderColor = 'var(--primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--input-bg)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </form>

        {/* Tema Toggle no rodapé do card */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <ThemeToggle variant="pill" />
        </div>
      </motion.div>
    </div>
  )
}
