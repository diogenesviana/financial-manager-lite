'use client'

import { usePathname, useRouter } from 'next/navigation'
import { fetchNotificationsCount } from '@/lib/api-client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Home, 
  Users, 
  FileText, 
  Zap, 
  Menu, 
  Share2, 
  Settings, 
  Shield, 
  LogOut,
  User as UserIcon,
  Bell,
  PieChart
} from 'lucide-react'
import { SYSTEM_VERSION } from '@/lib/constants'
import ThemeToggle from '@/components/ThemeToggle'

import DesktopSidebar from './DesktopSidebar'
import MobileBottomTabs from './MobileBottomTabs'
import NotificationsModal from './NotificationsModal'

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: 'USER' | 'ADMIN'
}

interface NavigationShellProps {
  user: User | null
  rulesCount: number
  setShowSettings: (val: boolean) => void
  setShowPatchNotes: (val: boolean) => void
}

export default function NavigationShell({ 
  user, 
  rulesCount, 
  setShowSettings,
  setShowPatchNotes 
}: NavigationShellProps) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsCount, setNotificationsCount] = useState(0)

  const fetchCount = async () => {
    try {
      const count = await fetchNotificationsCount()
      setNotificationsCount(count)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCount()
    window.addEventListener('refreshData', fetchCount)
    const interval = setInterval(fetchCount, 15000)
    return () => {
      window.removeEventListener('refreshData', fetchCount)
      clearInterval(interval)
    }
  }, [])

  const navItems = [
    { label: 'Painel', icon: Home, href: '/' },
    { label: 'Dashboard', icon: PieChart, href: '/dashboard' },
    { label: 'Integrantes', icon: Users, href: '/people' },
    { label: 'Adicionar Gastos', icon: FileText, href: '/import' },
    { label: 'Regras', icon: Zap, href: '/rules' },
  ]

  const handleLogout = async () => {
    const res = await fetch('/api/logout', { method: 'POST' })
    if (res.ok) {
      window.location.href = '/login'
    }
  }

  return (
    <>
      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      <DesktopSidebar 
        user={user} 
        navItems={navItems} 
        setShowPatchNotes={setShowPatchNotes} 
        handleLogout={handleLogout} 
        setShowNotifications={setShowNotifications}
        notificationsCount={notificationsCount}
      />

      <MobileBottomTabs 
        user={user}
        navItems={navItems} 
      />

      {/* MOBILE TOP HEADER (apenas para mostrar logo/versão e notificações) */}
      <header className="mobile-top-header hide-desktop" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Share2 size={22} strokeWidth={2.5} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.03em' }}>
            .aí
          </span>
        </Link>
        <button 
          className="icon-badge-container" 
          onClick={() => setShowNotifications(true)}
          style={{ position: 'absolute', right: '1.25rem', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.25rem' }}
        >
          <Bell size={22} />
          {notificationsCount > 0 && (
            <span className="icon-badge">{notificationsCount > 99 ? '99+' : notificationsCount}</span>
          )}
        </button>
      </header>
    </>
  )
}
