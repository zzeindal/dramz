'use client'

import { useEffect, useState, useRef } from 'react'
import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { useTranslation } from '../hooks/useTranslation'
import { getSession, createSSEConnection } from '@/lib/api/user'
import { setUser, setAccessToken, setApiUser, setReferralCode, TelegramUser } from '../state/slices/auth'
import { getUserProfile } from '@/lib/api/user'

function ActionButton({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className="w-full h-12 rounded-xl primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

export default function LoginModal() {
  const modalOpen = useSelector((s: RootState) => s.ui.modal === 'login')
  const user = useSelector((s: RootState) => s.auth.user)
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const dispatch = useDispatch()
  const [isTelegram, setIsTelegram] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const sseRef = useRef<EventSource | null>(null)

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
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
      setIsConnecting(false)
      dispatch(closeModal())
    }
  }, [user, accessToken, dispatch])
  
  useEffect(() => {
    if (!modalOpen && sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
      setIsConnecting(false)
    }
  }, [modalOpen])

  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
        sseRef.current = null
      }
    }
  }, [])

  const handleTelegramAuth = async () => {
    if (isConnecting) return
    
    try {
      setIsConnecting(true)
      
      const sessionData = await getSession()
      const sessionId = sessionData.sessionId
      
      const botUsername = process.env.NEXT_PUBLIC_TG_BOT || 'dramztestbot'
      const telegramUrl = `https://t.me/${botUsername}?start=${sessionId}`
      
      window.open(telegramUrl, '_blank')
      
      const eventSource = createSSEConnection(sessionId)
      sseRef.current = eventSource
      
      console.log('[SSE] Connecting to SSE with sessionId:', sessionId)
      
      const handleToken = async (data: any) => {
        console.log('[SSE] Received token data:', data)
        const token = data.accessToken || data.token
        
        if (token) {
          console.log('[SSE] Token received, closing connection')
          eventSource.close()
          sseRef.current = null
          setIsConnecting(false)
          
          dispatch(setAccessToken(token))
          
          try {
            const profile = await getUserProfile(token)
            if (profile) {
              const user: TelegramUser = {
                id: profile.telegramId,
                username: profile.username || undefined,
                first_name: profile.displayName?.split(' ')[0] || undefined,
                last_name: profile.displayName?.split(' ').slice(1).join(' ') || undefined
              }
              dispatch(setUser(user))
              dispatch(setApiUser(profile))
              if (profile.referralCode) {
                dispatch(setReferralCode(profile.referralCode))
              }
              dispatch(closeModal())
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error)
          }
        }
      }
      
      eventSource.onopen = () => {
        console.log('[SSE] Connection opened')
      }
      
      eventSource.onmessage = async (event) => {
        console.log('[SSE] Message received:', event.data)
        try {
          const data = JSON.parse(event.data)
          await handleToken(data)
        } catch (error) {
          console.error('Failed to parse SSE message:', error, 'Data:', event.data)
        }
      }
      
      eventSource.addEventListener('token', async (event: any) => {
        console.log('[SSE] Token event received:', event.data)
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
          await handleToken(data)
        } catch (error) {
          console.error('Failed to parse SSE token event:', error, 'Data:', event.data)
        }
      })
      
      eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error, 'ReadyState:', eventSource.readyState)
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('[SSE] Connection closed')
          eventSource.close()
          sseRef.current = null
          setIsConnecting(false)
        }
      }
      
      setTimeout(() => {
        if (sseRef.current) {
          sseRef.current.close()
          sseRef.current = null
          setIsConnecting(false)
        }
      }, 5 * 60 * 1000)
    } catch (error) {
      console.error('Failed to start authentication:', error)
      setIsConnecting(false)
    }
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
        <ActionButton onClick={handleTelegramAuth} disabled={isConnecting}>
          {isConnecting ? t('modals.connecting') || 'Connecting...' : t('modals.goToTelegram')}
        </ActionButton>
        {isConnecting && (
          <p className="text-white/60 text-center text-xs">
            {t('modals.waitingForAuth') || 'Waiting for authentication...'}
          </p>
        )}
      </div>
    </Modal>
  )
}


