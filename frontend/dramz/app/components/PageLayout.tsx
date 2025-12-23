'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../state/store'
import Header from './Header'
import BottomNav from './BottomNav'
import Modal from './Modal'
import { useTranslation } from '../hooks/useTranslation'

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isRewards = pathname === '/rewards'
  const isProfile = pathname === '/profile'
  const isProfileTransactions = pathname === '/profile/transactions' || pathname === '/profile/settings/name' || pathname === '/profile/settings/language' || pathname === '/profile/referrals/links' || pathname === '/profile/referrals/all'
  const isGame = pathname === '/game'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const user = useSelector((s: RootState) => s.auth.user)
  const apiUser = useSelector((s: RootState) => s.auth.apiUser)
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const authInitialized = useSelector((s: RootState) => s.auth.initialized)
  const { t } = useTranslation()
  
  const showAuthPopup = authInitialized && !accessToken
  const enableSwipeBack = !isGame && pathname !== '/'

  useEffect(() => {
    const checkFullscreen = () => {
      const w = window as any
      const webApp = w?.Telegram?.WebApp
      if (webApp) {
        const isExpanded = webApp.isExpanded
        const viewportHeight = webApp.viewportHeight
        const windowHeight = window.innerHeight
        const isFullscreenMode = isExpanded && viewportHeight >= windowHeight * 0.98
        setIsFullscreen(isFullscreenMode)
      } else {
        setIsFullscreen(false)
      }
    }

    checkFullscreen()
    const interval = setInterval(checkFullscreen, 500)
    window.addEventListener('resize', checkFullscreen)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', checkFullscreen)
    }
  }, [])

  useEffect(() => {
    if (!enableSwipeBack) return

    let startX = 0
    let startY = 0
    let tracking = false

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      tracking = startX < 40
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      const dx = touch.clientX - startX
      const dy = Math.abs(touch.clientY - startY)
      if (dx > 60 && dy < 40) {
        tracking = false
        router.back()
      }
    }

    const handleTouchEnd = () => {
      tracking = false
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enableSwipeBack, router])

  return (
    <div className={`flex flex-col min-h-screen overflow-y-auto app-frame ${isFullscreen ? 'safe-top-fullscreen' : 'safe-top'}`} style={isRewards || isProfileTransactions ? {
      backgroundImage: 'url(/bg-rewards.png)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center top',
      backgroundSize: 'cover',
    } : isProfile ? {
      backgroundImage: 'url(/profile-bg.png)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center top',
      backgroundSize: 'cover',
    } : {
      backgroundColor: 'var(--bg-app, #0f0b1d)'
    }}>
      {!isGame && <Header isFullscreen={isFullscreen} />}
      <div className={`flex-1 ${isGame ? '' : 'pb-20'} app-frame`}>
        {children}
      </div>
      {!isGame && <BottomNav />}
      
      <Modal
        open={showAuthPopup}
        onClose={() => {}}
        title=""
        closable={false}
      >
        <div className="text-center px-2">
          <div className="text-lg font-semibold text-white mb-2">{t('profile.authRequired')}</div>
          <div className="text-sm text-white/80 mb-4">{t('profile.authDescription')}</div>
          <a
            href="https://t.me/dramztestbot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl primary mt-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8F37FF 0%, #AC6BFF 100%)',
              boxShadow: '0 4px 20px rgba(143, 55, 255, 0.4)'
            }}
          >
            {t('profile.goToTelegram')}
          </a>
        </div>
      </Modal>
    </div>
  )
}

