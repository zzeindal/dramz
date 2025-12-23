import { apiFetch } from './client'
import type {
  GameState,
  PlayGameResponse,
  GameRewardsHistoryResponse
} from '@/types/api'

export async function getGameState(token: string) {
  return apiFetch<GameState>('/game/state', {
    method: 'GET'
  }, { token })
}

export async function playGame(token: string) {
  return apiFetch<PlayGameResponse>('/game/play', {
    method: 'POST'
  }, { token })
}

export async function getGameRewardsHistory(token: string, limit?: number) {
  const query = typeof limit === 'number' ? `?limit=${limit}` : ''
  return apiFetch<GameRewardsHistoryResponse>(`/game/rewards/history${query}`, {
    method: 'GET'
  }, { token })
}

