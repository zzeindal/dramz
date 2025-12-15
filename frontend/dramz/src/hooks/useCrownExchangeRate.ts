'use client'

import { useEffect, useState } from 'react'
import { getCrownExchangeRate } from '@/lib/api/user'
import type { CrownExchangeRate } from '@/types/api'

export function useCrownExchangeRate() {
  const [data, setData] = useState<CrownExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rate = await getCrownExchangeRate()
        if (active) {
          setData(rate)
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Failed to load exchange rate')
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
  }, [])

  return {
    data,
    loading,
    error
  }
}


