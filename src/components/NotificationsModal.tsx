'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { Bell, Info, Check, X, UserPlus, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Button from './Button'

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Invite {
  id: string
  name: string
  inviteEmail: string
  linkStatus: string
  ownerName: string
  ownerEmail: string
  ownerAvatar: string | null
}

interface Notification {
  id: string
  title: string
  message: string
  createdAt: string
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [invites, setInvites] = useState<Invite[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resInvites, resNotifs] = await Promise.all([
        fetch(`/api/invites?t=${Date.now()}`),
        fetch(`/api/notifications?t=${Date.now()}`)
      ])
      
      if (resInvites.ok) {
        const data = await resInvites.json()
        setInvites(Array.isArray(data) ? data.filter((i: Invite) => i.linkStatus === 'PENDING') : [])
      }
      if (resNotifs.ok) {
        const notifs = await resNotifs.json()
        setNotifications(Array.isArray(notifs) ? notifs : [])
      }
    } catch (e) {
      console.error('Erro ao buscar notificações:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const handleInviteAction = async (personId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, action })
      })
      if (res.ok) {
        toast.success(action === 'ACCEPT' ? 'Convite aceito!' : 'Convite recusado!')
        // Remover da lista local
        setInvites(prev => prev.filter(i => i.id !== personId))
        // Notificar o resto da aplicação para recarregar (se estiverem ouvindo)
        window.dispatchEvent(new Event('refreshData'))
        router.refresh()
      } else {
        toast.error('Erro ao processar convite')
      }
    } catch {
      toast.error('Erro de conexão')
    }
  }

  const formatMessage = (title: string, message: string) => {
    // Splits the message to bold quoted strings, names, and dates
    const quoteRegex = /("[^"]+")/g
    const marcouIndex = message.indexOf(' marcou ')

    if (marcouIndex !== -1) {
      const creditorName = message.substring(0, marcouIndex)
      const rest = message.substring(marcouIndex)
      const dateRegex = /(\d{2}\/\d{4})/g

      return (
        <span>
          <strong>{creditorName}</strong>
          {rest.split(quoteRegex).map((part, idx) => {
            if (part.startsWith('"') && part.endsWith('"')) {
              return <strong key={idx} style={{ color: 'var(--primary)' }}>{part}</strong>
            }
            return (
              <span key={idx}>
                {part.split(dateRegex).map((subpart, subidx) => {
                  if (subpart.match(/\d{2}\/\d{4}/)) {
                    return <strong key={subidx} style={{ color: 'var(--foreground)', fontWeight: 700 }}>{subpart}</strong>
                  }
                  return subpart
                })}
              </span>
            )
          })}
        </span>
      )
    }

    return <span>{message}</span>
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} color="var(--primary)" />
          <span>Notificações</span>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={24} className="spin" color="var(--primary)" />
          </div>
        ) : invites.length > 0 || notifications.length > 0 ? (
          <>
            {invites.map(inv => (
              <div 
                key={inv.id} 
                style={{ 
                  padding: '1.25rem 1rem', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, rgba(255, 26, 119, 0.06) 0%, rgba(255, 26, 119, 0.01) 100%)',
                  border: '1px solid rgba(255, 26, 119, 0.2)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  boxShadow: '0 4px 12px rgba(255, 26, 119, 0.03)'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                  <div style={{ 
                    padding: inv.ownerAvatar ? '0px' : '0.5rem', 
                    background: 'rgba(255, 26, 119, 0.12)', 
                    borderRadius: '50%', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}>
                    {inv.ownerAvatar ? (
                      <img src={inv.ownerAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UserPlus size={16} color="var(--primary)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>{inv.ownerName}</span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        color: 'var(--primary)', 
                        backgroundColor: 'rgba(255, 26, 119, 0.1)', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Convite
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                      Quer conectar com você. Ao aceitar, as despesas que <strong>{inv.ownerName}</strong> atribuir a você aparecerão automaticamente no seu painel.
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
                  <button 
                    onClick={() => handleInviteAction(inv.id, 'ACCEPT')}
                    style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', height: '36px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Check size={14} /> Aceitar
                  </button>
                  <button 
                    onClick={() => handleInviteAction(inv.id, 'REJECT')}
                    style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', height: '36px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <X size={14} /> Recusar
                  </button>
                </div>
              </div>
            ))}

            {notifications.map(notif => {
              const isPayment = notif.title === 'Gasto Pago' || notif.title === 'Fatura Paga'
              
              const cardBg = isPayment 
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.01) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.01) 100%)'
              
              const cardBorder = isPayment
                ? '1px solid rgba(34, 197, 94, 0.2)'
                : '1px solid rgba(59, 130, 246, 0.15)'
              
              const iconBg = isPayment ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)'
              const iconColor = isPayment ? '#22c55e' : '#3b82f6'
              const IconComponent = isPayment ? CheckCircle2 : Info

              return (
                <div 
                  key={notif.id} 
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '10px', 
                    background: cardBg,
                    border: cardBorder,
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'flex-start' }}>
                    <div style={{ 
                      padding: '0.5rem', 
                      background: iconBg, 
                      borderRadius: '50%', 
                      color: iconColor, 
                      marginTop: '0.15rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {notif.title}
                          {isPayment && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                        {formatMessage(notif.title, notif.message)}
                      </p>
                    </div>
                  </div>
                  <button
                    title="Marcar como lido"
                    onClick={async () => {
                      try {
                        await fetch('/api/notifications', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: notif.id })
                        })
                        setNotifications(prev => prev.filter(n => n.id !== notif.id))
                        window.dispatchEvent(new Event('refreshData'))
                      } catch (e) {
                        console.error(e)
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      alignSelf: 'center',
                      outline: 'none',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    <Check size={18} />
                  </button>
                </div>
              )
            })}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.15, margin: '0 auto 1rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Você não tem notificações no momento.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
