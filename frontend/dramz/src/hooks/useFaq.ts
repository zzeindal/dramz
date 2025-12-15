'use client'

import { useEffect, useState } from 'react'
import { getFaqList } from '@/lib/api/faq'
import type { ApiFaqItem } from '@/types/api'

export function useFaq() {
  const [data, setData] = useState<ApiFaqItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const items = await getFaqList()
        if (active) {
          setData(items)
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Failed to load FAQ')
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


