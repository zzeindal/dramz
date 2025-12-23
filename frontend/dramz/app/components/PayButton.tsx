'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { useTranslation } from '../hooks/useTranslation'

interface PayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  amount: number | string
  currency?: string
  children?: ReactNode
  className?: string
}

export default function PayButton({ 
  amount, 
  currency = 'USDT',
  children,
  className = '',
  ...props 
}: PayButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      className={`w-full h-12 text-white font-medium shadow-lg hover:shadow-xl transition-all ${className}`}
      style={{
        background: 'linear-gradient(135deg, #8F37FF 0%, #AC6BFF 100%)',
        boxShadow: '0 4px 20px rgba(143, 55, 255, 0.4)'
      }}
      {...props}
    >
      {children || t('modals.pay').replace('{amount}', amount.toString()).replace('{currency}', currency)}
    </button>
  )
}

