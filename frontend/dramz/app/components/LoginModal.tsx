'use client'

import { useEffect, useState } from 'react'
import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { useTranslation } from '../hooks/useTranslation'

function ActionButton({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return <button onClick={onClick} className="w-full h-12 rounded-xl primary text-white font-medium">{children}</button>
}

export default function LoginModal() {
  const modalOpen = useSelector((s: RootState) => s.ui.modal === 'login')
  const user = useSelector((s: RootState) => s.auth.user)
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const dispatch = useDispatch()
  const [isTelegram, setIsTelegram] = useState(false)

  useEffect(() => {
    const w = window as any
    const webApp = w?.Telegram?.WebApp
    setIsTelegram(!!webApp)
    
    if (webApp && webApp.initDataUnsafe?.user) {
      dispatch(closeModal())
    }
  }, [dispatch])

  useEffect(() => {
    if (user && accessToken) {
      dispatch(closeModal())
    }
  }, [user, accessToken, dispatch])

  const handleTelegramAuth = () => {
    const botUsername = process.env.NEXT_PUBLIC_TG_BOT || 'dramztestbot'
    const url = `https://t.me/${botUsername}`
    window.open(url, '_blank')
  }

  if (isTelegram) {
    return null
  }

  const shouldShow = modalOpen && !user && !accessToken
  const { t } = useTranslation()

  return (
    <Modal open={shouldShow} onClose={() => {}} title={t('modals.notAuthorized')}>
      <div className="space-y-4">
        <p className="text-white/80 text-center text-sm">
          {t('modals.goToTelegramAndLogin')}
        </p>
        <ActionButton onClick={handleTelegramAuth}>
          {t('modals.goToTelegram')}
        </ActionButton>
      </div>
    </Modal>
  )
}


