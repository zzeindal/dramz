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

export default function NoUsernameModal() {
  const modalOpen = useSelector((s: RootState) => s.ui.modal === 'noUsername')
  const apiUser = useSelector((s: RootState) => s.auth.apiUser)
  const dispatch = useDispatch()
  const [isTelegram, setIsTelegram] = useState(false)

  useEffect(() => {
    const w = window as any
    const webApp = w?.Telegram?.WebApp
    setIsTelegram(!!webApp)
  }, [])

  useEffect(() => {
    if (apiUser?.username) {
      dispatch(closeModal())
    }
  }, [apiUser?.username, dispatch])

  const botUsername = process.env.NEXT_PUBLIC_TG_BOT || 'dramztestbot'
  const telegramBotUrl = `https://t.me/${botUsername}`

  if (isTelegram) {
    return null
  }

  const shouldShow = !!(modalOpen && apiUser && !apiUser.username)
  const { t } = useTranslation()

  return (
    <Modal open={shouldShow} onClose={() => {}} title={t('modals.loginViaTelegram')}>
      <div className="space-y-4">
        <p className="text-white/80 text-center text-sm">
          {t('modals.authMessage')} <b>/start</b>
        </p>
        <p className="text-white/60 text-center text-xs">
          {t('modals.botWillSend')}
        </p>
        <a
          href={telegramBotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <ActionButton onClick={() => {}}>
            {t('modals.goToTelegram')}
          </ActionButton>
        </a>
      </div>
    </Modal>
  )
}

