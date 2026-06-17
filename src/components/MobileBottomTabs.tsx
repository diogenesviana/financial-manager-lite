'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User as UserIcon } from 'lucide-react'

interface NavItem {
  label: string
  icon: any
  href: string
  badge?: number
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: 'USER' | 'ADMIN'
}

interface MobileBottomTabsProps {
  navItems: NavItem[]
  user: User | null
}

export default function MobileBottomTabs({ navItems, user }: MobileBottomTabsProps) {
  const pathname = usePathname()

  return (
    <nav className="mobile-bottom-tabs hide-desktop">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            <div className="tab-icon-wrapper">
              <item.icon size={24} className="tab-icon" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="tab-badge">{item.badge > 9 ? '9+' : item.badge}</span>
              )}
            </div>
          </Link>
        )
      })}
      {/* Aba de Perfil */}
      <Link 
        href="/profile"
        className={`mobile-tab-item ${pathname === '/profile' ? 'active' : ''}`}
      >
        <div className="tab-icon-wrapper">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt="Avatar" 
              style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <div className="user-avatar-placeholder" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
              {user?.name?.charAt(0).toUpperCase() || <UserIcon size={16} />}
            </div>
          )}
        </div>
      </Link>
    </nav>
  )
}
