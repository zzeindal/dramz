import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { GetTokenResponseUser, UserProfile } from '@/types/api'

export type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

export type AuthState = {
  user: TelegramUser | null
  accessToken: string | null
  apiUser: (GetTokenResponseUser | UserProfile) | null
  displayName: string | null
  referralCode: string | null
  initialized: boolean
}

const getInitialDisplayName = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('display_name')
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  apiUser: null,
  displayName: getInitialDisplayName(),
  referralCode: null,
  initialized: false
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<TelegramUser | null>) {
      state.user = action.payload
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload
      if (action.payload) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', action.payload)
          document.cookie = `accessToken=${action.payload}; path=/`
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }
    },
    setApiUser(state, action: PayloadAction<(GetTokenResponseUser | UserProfile) | null>) {
      state.apiUser = action.payload
    },
    setDisplayName(state, action: PayloadAction<string | null>) {
      state.displayName = action.payload
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('display_name', action.payload)
        } else {
          localStorage.removeItem('display_name')
        }
      }
    },
    setReferralCode(state, action: PayloadAction<string | null>) {
      state.referralCode = action.payload
    },
    setInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.apiUser = null
      state.displayName = null
      state.referralCode = null
      state.initialized = true
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('display_name')
        document.cookie = 'tgUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    }
  }
})

export const { setUser, setAccessToken, setApiUser, setDisplayName, setReferralCode, setInitialized, logout } = authSlice.actions
export default authSlice.reducer


