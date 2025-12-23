'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Logo from './Logo'

export default function Header({ isFullscreen = false }: { isFullscreen?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isRewards = pathname === '/rewards'
  const isProfile = pathname === '/profile'
  const showBackButton = !isHome && !isRewards && !isProfile

  useEffect(() => {
    const w = window as any
    const webApp = w?.Telegram?.WebApp
    if (webApp && webApp.BackButton) {
      const handleBack = () => {
        router.back()
      }
      if (showBackButton) {
        webApp.BackButton.show()
        webApp.BackButton.onClick(handleBack)
      } else {
        webApp.BackButton.hide()
        webApp.BackButton.offClick(handleBack)
      }
      return () => {
        if (webApp && webApp.BackButton) {
          webApp.BackButton.offClick(handleBack)
        }
      }
    }
  }, [showBackButton, router])

  return (
    <header 
      className={`py-2 px-4 flex items-center justify-center z-50 w-full`}
      style={{ 
        paddingTop: isFullscreen ? 'calc(env(safe-area-inset-top, 0px) + 8px)' : 'calc(env(safe-area-inset-top, 0px) + 10px)',
      }}
    >
      <div className='w-full mt-4 flex justify-center items-center'>
        <Logo />
      </div>
    </header>
  )
}

