'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StartPage() {
  const router = useRouter()

  useEffect(() => {
    const w = window as any
    const webApp = w?.Telegram?.WebApp
    const isTelegram = !!webApp

    if (isTelegram) {
      try {
        webApp.ready()
        webApp.expand()
        const urlParams = new URLSearchParams(window.location.search)
        const mode = urlParams.get('mode')
        if (mode === 'fullscreen' && webApp.requestFullscreen && typeof webApp.requestFullscreen === 'function') {
          webApp.requestFullscreen()
        }
      } catch (error) {
        console.error('Failed to expand to fullscreen:', error)
      }
    }

    const timer = setTimeout(() => {
      router.replace('/')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return null
}

