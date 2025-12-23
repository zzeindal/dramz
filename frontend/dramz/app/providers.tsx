'use client'

import { Provider } from 'react-redux'
import { makeStore, AppStore } from './state/store'
import { useRef, useEffect } from 'react'
import { setUser, setAccessToken, setApiUser, setReferralCode, setInitialized, TelegramUser } from './state/slices/auth'
import { closeModal, openModal } from './state/slices/ui'
import { initializeLanguage } from './state/slices/language'
import { getAccessToken, getUserProfile } from '@/lib/api/user'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function checkAndShowTermsModal(store: AppStore) {
  if (typeof window === 'undefined') return
  const termsAccepted = localStorage.getItem('termsAccepted')
  if (!termsAccepted) {
    store.dispatch(openModal({ name: 'terms' }))
  }
}

export default function Providers({ initialUser, children }: { initialUser?: TelegramUser | null, children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) storeRef.current = makeStore()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const authenticate = async () => {
      if (!storeRef.current) return

      try {
        const w = window as any
        const webApp = w?.Telegram?.WebApp
        const isTelegram = !!webApp

        const storedToken = localStorage.getItem('accessToken')
        const cookieToken = getCookie('accessToken')

        const urlParams = new URLSearchParams(window.location.search)
        const tokenFromUrl = urlParams.get('token')
        const referralCodeFromUrl = urlParams.get('ref') || urlParams.get('referralCode')
        const earlyToken = tokenFromUrl || storedToken || cookieToken
        if (earlyToken) {
          storeRef.current.dispatch(setAccessToken(earlyToken))
        }
        
        if (tokenFromUrl) {
          storeRef.current.dispatch(setAccessToken(tokenFromUrl))
          
          try {
            const profile = await getUserProfile(tokenFromUrl)
            if (profile) {
              const user: TelegramUser = {
                id: profile.telegramId,
                username: profile.username || undefined,
                first_name: profile.displayName?.split(' ')[0] || undefined,
                last_name: profile.displayName?.split(' ').slice(1).join(' ') || undefined
              }
              storeRef.current.dispatch(setUser(user))
              storeRef.current.dispatch(setApiUser(profile))
              if (profile.referralCode) {
                storeRef.current.dispatch(setReferralCode(profile.referralCode))
              }
              
              const w = window as any
              const webApp = w?.Telegram?.WebApp
              const isTelegram = !!webApp
              
              if (!isTelegram && !profile.username) {
                storeRef.current.dispatch(openModal({ name: 'noUsername' }))
              } else {
                storeRef.current.dispatch(closeModal())
                checkAndShowTermsModal(storeRef.current)
              }
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error)
          }
          
          if (!storeRef.current.getState().ui.modal) {
            storeRef.current.dispatch(closeModal())
            checkAndShowTermsModal(storeRef.current)
          }
          
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('token')
          newUrl.searchParams.delete('ref')
          newUrl.searchParams.delete('referralCode')
          window.history.replaceState({}, '', newUrl.toString())
          
          storeRef.current.dispatch(setInitialized(true))
          return
        }

        if (referralCodeFromUrl && !tokenFromUrl) {
          localStorage.setItem('pendingReferralCode', referralCodeFromUrl)
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('ref')
          newUrl.searchParams.delete('referralCode')
          window.history.replaceState({}, '', newUrl.toString())
        }

        if (isTelegram) {
          const tgUser = webApp?.initDataUnsafe?.user
          const initData = webApp?.initData

          if (tgUser && initData) {
            if (!tokenFromUrl) {
              const user: TelegramUser = {
                id: tgUser.id,
                first_name: tgUser.first_name,
                last_name: tgUser.last_name,
                username: tgUser.username,
                photo_url: tgUser.photo_url
              }
              storeRef.current.dispatch(setUser(user))

              try {
                const referralCode = referralCodeFromUrl || localStorage.getItem('pendingReferralCode')
                const requestBody = { 
                  initData,
                  ...(referralCode ? { referralCode } : {})
                }
                const tokenData = await getAccessToken(requestBody)
                if (tokenData && tokenData.accessToken) {
                  if (referralCode) {
                    localStorage.removeItem('pendingReferralCode')
                  }
                  
                  const newUrl = new URL(window.location.href)
                  newUrl.searchParams.set('token', tokenData.accessToken)
                  if (referralCodeFromUrl) {
                    newUrl.searchParams.delete('ref')
                    newUrl.searchParams.delete('referralCode')
                  }
                  window.location.href = newUrl.toString()
                  storeRef.current.dispatch(setInitialized(true))
                  return
                } else {
                  storeRef.current.dispatch(closeModal())
                }
              } catch (error) {
                console.error('Failed to get access token:', error)
                storeRef.current.dispatch(closeModal())
              }
            } else {
              storeRef.current.dispatch(setAccessToken(tokenFromUrl))
              
              try {
                const profile = await getUserProfile(tokenFromUrl)
                if (profile) {
                  const user: TelegramUser = {
                    id: profile.telegramId,
                    username: profile.username || undefined,
                    first_name: profile.displayName?.split(' ')[0] || undefined,
                    last_name: profile.displayName?.split(' ').slice(1).join(' ') || undefined
                  }
                  storeRef.current.dispatch(setUser(user))
                  storeRef.current.dispatch(setApiUser(profile))
                  if (profile.referralCode) {
                    storeRef.current.dispatch(setReferralCode(profile.referralCode))
                  }
                  storeRef.current.dispatch(closeModal())
                  checkAndShowTermsModal(storeRef.current)
                  
                  const newUrl = new URL(window.location.href)
                  newUrl.searchParams.delete('token')
                  newUrl.searchParams.delete('ref')
                  newUrl.searchParams.delete('referralCode')
                  window.history.replaceState({}, '', newUrl.toString())
                }
              } catch (error) {
                console.error('Failed to fetch user profile:', error)
              }
            }
          } else if (initialUser) {
            storeRef.current.dispatch(setUser(initialUser))
            const cookieToken = getCookie('accessToken')
            if (cookieToken) {
              storeRef.current.dispatch(setAccessToken(cookieToken))
            }
            storeRef.current.dispatch(closeModal())
          } else {
            storeRef.current.dispatch(closeModal())
          }
        } else {
          const token = storedToken || cookieToken
          
          if (token) {
            try {
              const profile = await getUserProfile(token)
              if (profile) {
                const user: TelegramUser = {
                  id: profile.telegramId,
                  username: profile.username || undefined,
                  first_name: profile.displayName?.split(' ')[0] || undefined,
                  last_name: profile.displayName?.split(' ').slice(1).join(' ') || undefined
                }
                storeRef.current.dispatch(setUser(user))
                storeRef.current.dispatch(setAccessToken(token))
                storeRef.current.dispatch(setApiUser(profile))
                if (profile.referralCode) {
                  storeRef.current.dispatch(setReferralCode(profile.referralCode))
                }
                
                const w = window as any
                const webApp = w?.Telegram?.WebApp
                const isTelegram = !!webApp
                
                if (!isTelegram && !profile.username) {
                  storeRef.current.dispatch(openModal({ name: 'noUsername' }))
                } else {
                  storeRef.current.dispatch(closeModal())
                  checkAndShowTermsModal(storeRef.current)
                }
                storeRef.current.dispatch(setInitialized(true))
                return
              }
            } catch (error) {
              console.error('Failed to verify token:', error)
              localStorage.removeItem('accessToken')
              document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
              storeRef.current.dispatch(setAccessToken(null))
              storeRef.current.dispatch(setUser(null))
              storeRef.current.dispatch(setApiUser(null))
            }
          }
          
          storeRef.current.dispatch(openModal({ name: 'login' }))
        }
      } catch (error) {
        console.error('Authentication error:', error)
        if (storeRef.current) {
          storeRef.current.dispatch(openModal({ name: 'login' }))
        }
      }
      if (storeRef.current) {
        storeRef.current.dispatch(setInitialized(true))
      }
    }

    if ((window as any)?.Telegram?.WebApp) {
      authenticate()
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any)?.Telegram?.WebApp) {
          clearInterval(checkInterval)
          authenticate()
        }
      }, 100)
      
      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
        authenticate()
      }, 100)

      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
      }
    }
  }, [initialUser])

  useEffect(() => {
    if (!storeRef.current) return
    storeRef.current.dispatch(initializeLanguage())
  }, [])

  useEffect(() => {
    if (!storeRef.current) return
    if (typeof window === 'undefined') return

    const checkUsername = () => {
      if (!storeRef.current) return
      const state = storeRef.current.getState()
      if (!state) return

      const apiUser = state.auth.apiUser
      const accessToken = state.auth.accessToken
      const currentModal = state.ui.modal

      const w = window as any
      const webApp = w?.Telegram?.WebApp
      const isTelegram = !!webApp

      if (isTelegram) return

      if (accessToken && apiUser && !apiUser.username && currentModal !== 'login') {
        storeRef.current.dispatch(openModal({ name: 'noUsername' }))
      }
    }

    checkUsername()

    const unsubscribe = storeRef.current.subscribe(checkUsername)

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!storeRef.current) return
    if (typeof window === 'undefined') return

    let hasRefreshedProfile = false

    const checkTerms = () => {
      if (!storeRef.current) return
      const state = storeRef.current.getState()
      if (!state) return

      const accessToken = state.auth.accessToken
      const initialized = state.auth.initialized
      const currentModal = state.ui.modal

      if (!initialized || !accessToken) return

      const termsAccepted = localStorage.getItem('termsAccepted')
      if (!termsAccepted && currentModal !== 'terms' && currentModal !== 'login' && currentModal !== 'noUsername') {
        storeRef.current.dispatch(openModal({ name: 'terms' }))
      }
    }

    const refreshProfile = async () => {
      if (!storeRef.current || hasRefreshedProfile) return
      const state = storeRef.current.getState()
      if (!state) return

      const accessToken = state.auth.accessToken
      const initialized = state.auth.initialized

      if (!initialized || !accessToken) return

      hasRefreshedProfile = true

      try {
        const profile = await getUserProfile(accessToken)
        if (profile && storeRef.current) {
          const user: TelegramUser = {
            id: profile.telegramId,
            username: profile.username || undefined,
            first_name: profile.displayName?.split(' ')[0] || undefined,
            last_name: profile.displayName?.split(' ').slice(1).join(' ') || undefined
          }
          storeRef.current.dispatch(setUser(user))
          storeRef.current.dispatch(setApiUser(profile))
          if (profile.referralCode) {
            storeRef.current.dispatch(setReferralCode(profile.referralCode))
          }
        }
      } catch (error) {
        console.error('Failed to refresh user profile:', error)
        hasRefreshedProfile = false
      }
    }

    const checkAndRefresh = () => {
      checkTerms()
      refreshProfile()
    }

    checkAndRefresh()

    const unsubscribe = storeRef.current.subscribe(() => {
      checkTerms()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!storeRef.current) return null

  return <Provider store={storeRef.current}>{children}</Provider>
}


