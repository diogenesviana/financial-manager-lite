import React from 'react'

// ─── Cores de marca das principais instituições financeiras brasileiras ────────
export const bankColorMap: Record<string, { bg: string; text: string; border: string; label?: string }> = {
  // Roxo Nubank
  'Nubank':           { bg: 'rgba(130, 0,   230, 0.12)', text: '#8200e6', border: 'rgba(130, 0, 230, 0.3)',   label: 'Nubank' },
  // Verde Inter
  'Inter':            { bg: 'rgba(255, 122, 0,   0.12)', text: '#ff7a00', border: 'rgba(255, 122, 0, 0.3)',   label: 'Inter' },
  // Laranja Itaú
  'Itaú':             { bg: 'rgba(255, 110, 0,   0.12)', text: '#ff6e00', border: 'rgba(255, 110, 0, 0.3)',    label: 'Itaú' },
  // Vermelho Bradesco
  'Bradesco':         { bg: 'rgba(204, 0,   0,   0.12)', text: '#cc0000', border: 'rgba(204, 0, 0, 0.3)',     label: 'Bradesco' },
  // Vermelho Santander
  'Santander':        { bg: 'rgba(236, 0,   0,   0.12)', text: '#ec0000', border: 'rgba(236, 0, 0, 0.3)',     label: 'Santander' },
  // Preto/Grafite C6 Bank
  'C6 Bank':          { bg: 'rgba(50,  50,  50,  0.12)', text: '#999999', border: 'rgba(80, 80, 80, 0.3)',    label: 'C6 Bank' },
  'C6Bank':           { bg: 'rgba(50,  50,  50,  0.12)', text: '#999999', border: 'rgba(80, 80, 80, 0.3)',    label: 'C6 Bank' },
  // Azul Caixa
  'Caixa':            { bg: 'rgba(0,   86,  148, 0.12)', text: '#005694', border: 'rgba(0, 86, 148, 0.3)',    label: 'Caixa' },
  'CEF':              { bg: 'rgba(0,   86,  148, 0.12)', text: '#005694', border: 'rgba(0, 86, 148, 0.3)',    label: 'Caixa' },
  // Amarelo Banco do Brasil
  'Banco do Brasil':  { bg: 'rgba(253, 209, 0,   0.12)', text: '#c89a00', border: 'rgba(253, 209, 0, 0.35)',  label: 'BB' },
  'BB':               { bg: 'rgba(253, 209, 0,   0.12)', text: '#c89a00', border: 'rgba(253, 209, 0, 0.35)',  label: 'BB' },
  // Roxo PicPay
  'PicPay':           { bg: 'rgba(21,  206, 101, 0.12)', text: '#15ce65', border: 'rgba(21, 206, 101, 0.3)',  label: 'PicPay' },
  // Cinza Mercado Pago
  'Mercado Pago':     { bg: 'rgba(0,   157, 227, 0.12)', text: '#009de3', border: 'rgba(0, 157, 227, 0.3)',   label: 'M. Pago' },
  // Verde BTG
  'BTG':              { bg: 'rgba(0,   150, 90,  0.12)', text: '#00965a', border: 'rgba(0, 150, 90, 0.3)',    label: 'BTG' },
  'BTG Pactual':      { bg: 'rgba(0,   150, 90,  0.12)', text: '#00965a', border: 'rgba(0, 150, 90, 0.3)',    label: 'BTG' },
  // Amarelo/Verde XP
  'XP':               { bg: 'rgba(0,   0,   0,   0.12)', text: '#aaaaaa', border: 'rgba(150, 150, 150, 0.3)', label: 'XP' },
  'XP Investimentos': { bg: 'rgba(0,   0,   0,   0.12)', text: '#aaaaaa', border: 'rgba(150, 150, 150, 0.3)', label: 'XP' },
  // Roxo Will Bank
  'Will Bank':        { bg: 'rgba(156, 39,  176, 0.12)', text: '#9c27b0', border: 'rgba(156, 39, 176, 0.3)',  label: 'Will' },
  // Azul Sicredi
  'Sicredi':          { bg: 'rgba(0,   133, 66,  0.12)', text: '#008542', border: 'rgba(0, 133, 66, 0.3)',    label: 'Sicredi' },
  // Azul Sicoob
  'Sicoob':           { bg: 'rgba(0,   86,  148, 0.12)', text: '#005694', border: 'rgba(0, 86, 148, 0.3)',    label: 'Sicoob' },
}

// Fallback genérico para bancos não mapeados
const defaultBankColor = {
  bg: 'rgba(99, 102, 241, 0.1)',
  text: '#8b95a8',
  border: 'rgba(99, 102, 241, 0.2)',
}

interface BankBadgeProps {
  bank?: string | null
  size?: 'sm' | 'md'
}

export default function BankBadge({ bank, size = 'sm' }: BankBadgeProps) {
  if (!bank) return null

  const color = bankColorMap[bank] || defaultBankColor
  const label = bankColorMap[bank]?.label || bank

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
        fontSize: size === 'md' ? '0.78rem' : '0.72rem',
        padding: size === 'md' ? '0.25rem 0.65rem' : '0.2rem 0.5rem',
        borderRadius: '20px',
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </span>
  )
}
