'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function TelegramInit() {
  const pathname = usePathname()
  const isStartPage = pathname === '/start'

  useEffect(() => {
    const w = window as any
    const webApp = w?.Telegram?.WebApp
    const isTelegram = !!webApp
    if (isTelegram) {
      try {
        webApp.ready()
        webApp.expand()
        if (isStartPage && webApp.requestFullscreen && typeof webApp.requestFullscreen === 'function') {
          webApp.requestFullscreen()
        }
      } catch {}
      document.documentElement.classList.add('tg')
      document.body.classList.add('tg')
    } else {
      document.documentElement.classList.remove('tg')
      document.body.classList.remove('tg')
    }
  }, [isStartPage])
  return null
}


