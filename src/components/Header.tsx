import { PieChart, Settings } from 'lucide-react'
import Tooltip from '@/components/Tooltip'
import { SYSTEM_VERSION } from '@/lib/constants'

interface HeaderProps {
  setShowSettings: (val: boolean) => void
  setShowPatchNotes: (val: boolean) => void
}

export default function Header({ setShowSettings, setShowPatchNotes }: HeaderProps) {
  return (
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
                v{SYSTEM_VERSION}
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
  )
}
