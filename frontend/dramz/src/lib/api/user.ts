import { apiFetch } from './client'
import type {
  CrownExchangeRate,
  GetTokenRequest,
  GetTokenResponse,
  PurchaseCrownsRequest,
  PurchaseCrownsResponse,
  ReferralsResponse,
  RegisterUserRequest,
  SessionResponse,
  UserBalance,
  UserProfile
} from '@/types/api'

export async function getAccessToken(body: GetTokenRequest) {
  console.log('[API] POST /user/token REQUEST:', JSON.stringify(body, null, 2))
  const response = await apiFetch<GetTokenResponse>('/user/token', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  console.log('[API] POST /user/token RESPONSE:', JSON.stringify(response, null, 2))
  return response
}

export async function getUserBalance(token: string) {
  return apiFetch<UserBalance>('/user/balance', {
    method: 'GET'
  }, { token })
}

export async function getUserProfile(token: string) {
  return apiFetch<UserProfile>('/user/profile', {
    method: 'GET'
  }, { token })
}

export async function getCrownExchangeRate() {
  return apiFetch<CrownExchangeRate>('/user/crowns/exchange-rate', {
    method: 'GET'
  })
}

export async function purchaseCrowns(token: string, body: PurchaseCrownsRequest) {
  return apiFetch<PurchaseCrownsResponse>('/user/crowns/purchase', {
    method: 'POST',
    body: JSON.stringify(body)
  }, { token })
}

export async function registerUser(body: RegisterUserRequest) {
  return apiFetch<void>('/user/register', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function getUserReferrals(token: string) {
  return apiFetch<ReferralsResponse>('/user/referrals', {
    method: 'GET'
  }, { token })
}

export async function getSession() {
  return apiFetch<SessionResponse>('/user/session', {
    method: 'GET'
  })
}

export function createSSEConnection(sessionId: string): EventSource {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dramz.fun'
  return new EventSource(`${API_BASE_URL}/user/sse/${sessionId}`)
}

