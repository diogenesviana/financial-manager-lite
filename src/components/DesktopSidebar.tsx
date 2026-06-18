'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Share2, Shield, LogOut, User as UserIcon, Bell } from 'lucide-react'
import { SYSTEM_VERSION, APP_NAME_PREFIX, APP_NAME_SUFFIX } from '@/lib/constants'
import ThemeToggle from '@/components/ThemeToggle'

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: 'USER' | 'ADMIN'
}

interface NavItem {
  label: string
  icon: any
  href: string
  badge?: number
}

interface DesktopSidebarProps {
  user: User | null
  navItems: NavItem[]
  setShowPatchNotes: (val: boolean) => void
  handleLogout: () => void
  setShowNotifications: (val: boolean) => void
  notificationsCount: number
}

export default function DesktopSidebar({ 
  user, 
  navItems, 
  setShowPatchNotes, 
  handleLogout,
  setShowNotifications,
  notificationsCount
}: DesktopSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="desktop-sidebar hide-mobile">
      <div className="sidebar-brand">
        <Link href="/" className="sidebar-logo-link">
          <div className="app-logo-icon">
            <Share2 size={22} strokeWidth={2.5} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="sidebar-logo-text">
            <span className="app-logo-text" style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              {APP_NAME_PREFIX}<span style={{ color: 'var(--primary)' }}>{APP_NAME_SUFFIX}</span>
            </span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="nav-badge badge-blue">{item.badge}</span>
              )}
            </Link>
          )
        })}
        
        {/* Notificações no final das rotas principais */}
        <div 
          className="sidebar-nav-item" 
          onClick={() => setShowNotifications(true)}
        >
          <div className="icon-badge-container">
            <Bell size={20} className="nav-icon" />
            {notificationsCount > 0 && (
              <span className="icon-badge">{notificationsCount > 99 ? '99+' : notificationsCount}</span>
            )}
          </div>
          <span className="nav-label">Notificações</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-nav">
          <Link href="/profile" className={`sidebar-nav-item ${pathname === '/profile' ? 'active' : ''}`}>
            <div className="nav-icon" style={{ borderRadius: '50%', overflow: 'hidden' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="user-avatar-placeholder" style={{ width: '100%', height: '100%' }}>
                  {user?.name?.charAt(0).toUpperCase() || <UserIcon size={18} />}
                </div>
              )}
            </div>
            <span className="nav-label">Meu Perfil</span>
          </Link>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className={`sidebar-nav-item ${pathname === '/admin' ? 'active' : ''}`}>
              <Shield size={20} className="nav-icon" />
              <span className="nav-label">Painel Admin</span>
            </Link>
          )}
          <div className="sidebar-theme-item">
            <div className="theme-toggle-wrapper">
              <ThemeToggle variant="circle" style={{ width: '100%', height: '100%' }} iconSize={16} />
            </div>
            <span className="nav-label">Tema do Sistema</span>
          </div>
        </div>

        <div className="sidebar-user-card" onClick={handleLogout} title="Sair da conta">
          <div className="user-info-row">
            <div className="nav-icon">
              <LogOut size={20} />
            </div>
            <div className="user-details">
              <span className="user-name" style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--danger)' }}>Sair da conta</span>
            </div>
          </div>
        </div>

        <div className="sidebar-version" onClick={() => setShowPatchNotes(true)}>
          v{SYSTEM_VERSION}
        </div>
      </div>
    </aside>
  )
}
