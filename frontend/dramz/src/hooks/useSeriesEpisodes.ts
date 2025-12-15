'use client'

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getSeriesEpisodes } from '@/lib/api/series'
import type { SeriesEpisodesResponse } from '@/types/api'
import type { RootState } from '../../app/state/store'

export function useSeriesEpisodes(seriesId: string | null) {
  const [data, setData] = useState<SeriesEpisodesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)

  useEffect(() => {
    if (!seriesId) return

    const id = seriesId
    const token = accessToken || undefined
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getSeriesEpisodes(id, token)
        if (active) {
          setData(result)
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Failed to load episodes')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [seriesId, accessToken])

  return {
    data,
    loading,
    error
  }
}


