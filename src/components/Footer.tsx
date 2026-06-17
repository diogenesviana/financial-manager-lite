import { SYSTEM_VERSION, APP_NAME } from '@/lib/constants'

interface FooterProps {
  setShowPatchNotes: (val: boolean) => void
}

export default function Footer({ setShowPatchNotes }: FooterProps) {
  return (
    <footer style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
      <p>© {new Date().getFullYear()} {APP_NAME} v{SYSTEM_VERSION}. Todos os direitos reservados. • <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowPatchNotes(true)}>Novidades</span></p>
      <p style={{ marginTop: '0.25rem' }}>Desenvolvido por <a href="https://www.linkedin.com/in/diogenes-viana/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Diógenes Viana</a></p>
    </footer>
  )
}
