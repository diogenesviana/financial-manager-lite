'use client'

import { Toaster } from 'react-hot-toast'

export default function GlobalToaster() {
  return (
    <Toaster 
      position="top-center" 
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 500,
          boxShadow: 'var(--shadow-lg)',
          padding: '0.75rem 1.25rem',
          maxWidth: '450px',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--card)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'var(--card)',
          },
        },
      }}
    />
  )
}
