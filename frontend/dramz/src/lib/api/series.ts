import { apiFetch } from './client'
import type {
  ApiSeries,
  SeriesEpisodesResponse,
  LikeSeriesResponse,
  BookmarkSeriesResponse,
  SeriesStatusResponse,
  PurchaseSeriesResponse,
  EpisodeInfoResponse,
  RecordEpisodeViewResponse
} from '@/types/api'

export async function getSeriesList() {
  return apiFetch<ApiSeries[]>('/series', {
    method: 'GET'
  })
}

export async function getSeriesById(id: string) {
  return apiFetch<ApiSeries>(`/series/${id}`, {
    method: 'GET'
  })
}

export async function getSeriesEpisodes(id: string, token?: string) {
  return apiFetch<SeriesEpisodesResponse>(`/series/${id}/episodes`, {
    method: 'GET'
  }, token ? { token } : {})
}

export async function likeSeries(seriesId: string, token: string) {
  return apiFetch<LikeSeriesResponse>(`/user/series/${seriesId}/like`, {
    method: 'POST'
  }, { token })
}

export async function bookmarkSeries(seriesId: string, token: string) {
  return apiFetch<BookmarkSeriesResponse>(`/user/series/${seriesId}/bookmark`, {
    method: 'POST'
  }, { token })
}

export async function getLikedSeries(token: string) {
  return apiFetch<ApiSeries[]>('/user/series/liked', {
    method: 'GET'
  }, { token })
}

export async function getBookmarkedSeries(token: string) {
  return apiFetch<ApiSeries[]>('/user/series/bookmarked', {
    method: 'GET'
  }, { token })
}

export async function getSeriesStatus(seriesId: string, token: string) {
  return apiFetch<SeriesStatusResponse>(`/user/series/${seriesId}/status`, {
    method: 'GET'
  }, { token })
}

export async function purchaseSeries(seriesId: string, token: string) {
  return apiFetch<PurchaseSeriesResponse>(`/series/${seriesId}/purchase`, {
    method: 'POST'
  }, { token })
}

export async function getEpisode(seriesId: string, episodeNumber: number, token?: string) {
  return apiFetch<EpisodeInfoResponse>(`/series/${seriesId}/episodes/${episodeNumber}`, {
    method: 'GET'
  }, token ? { token } : {})
}

export async function recordEpisodeView(seriesId: string, episodeNumber: number, token: string) {
  return apiFetch<RecordEpisodeViewResponse>(`/series/${seriesId}/episodes/${episodeNumber}/view`, {
    method: 'POST'
  }, { token })
}

