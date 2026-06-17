'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { Bell, Info, Check, X, UserPlus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const fetchInvites = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invites?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setInvites(Array.isArray(data) ? data.filter((i: Invite) => i.linkStatus === 'PENDING') : [])
      }
    } catch (e) {
      console.error('Erro ao buscar convites:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchInvites()
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
        ) : invites.length > 0 ? (
          invites.map(inv => (
            <div 
              key={inv.id} 
              style={{ 
                padding: '1rem', 
                borderRadius: '8px', 
                background: 'rgba(var(--primary-rgb), 0.05)',
                border: '1px solid var(--primary)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                <div style={{ padding: '0.5rem', background: 'var(--card)', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {inv.ownerAvatar ? (
                    <img src={inv.ownerAvatar} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <UserPlus size={16} color="var(--primary)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)' }}>{inv.ownerName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Convite</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Quer vincular a conta com a sua. Ao aceitar, as despesas que essa pessoa atribuir a você aparecerão no seu painel.
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => handleInviteAction(inv.id, 'ACCEPT')}
                  style={{ flex: 1, padding: '0.5rem', background: 'var(--primary)', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Check size={16} /> Aceitar
                </button>
                <button 
                  onClick={() => handleInviteAction(inv.id, 'REJECT')}
                  style={{ flex: 1, padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  <X size={16} /> Recusar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>Você não tem notificações no momento.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
