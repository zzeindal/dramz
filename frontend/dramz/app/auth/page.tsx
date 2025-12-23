'use client'

import { useEffect } from 'react'
import { useTranslation } from '../hooks/useTranslation'

export default function AuthPage() {
  const { t } = useTranslation()
  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TG_BOT || 'dramztestbot'
    const mainDomain = process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://dramz.tv'
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || mainDomain
    const authUrl = new URL('/api/tg-auth', window.location.origin)
    authUrl.searchParams.set('redirect', redirectUrl)

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-auth-url', authUrl.toString())
    script.setAttribute('data-request-access', 'write')

    const container = document.getElementById('telegram-widget')
    if (container) {
      container.appendChild(script)
    }

    return () => {
      if (container && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0f0b1d]">
      <div className="text-center">
        <h1 className="text-white text-2xl font-semibold mb-6">{t('modals.loginViaTelegram')}</h1>
        <div id="telegram-widget" className="flex justify-center"></div>
      </div>
    </div>
  )
}

