import { getGlobalStore } from '../../../app/state/storeRef'
import { setAccessToken, setUser, setApiUser } from '../../../app/state/slices/auth'
import { openModal } from '../../../app/state/slices/ui'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dramz.fun'

export type ApiRequestConfig = {
  token?: string
  isFormData?: boolean
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return

  try {
    const store = getGlobalStore()
    if (store) {
      localStorage.removeItem('accessToken')
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      store.dispatch(setAccessToken(null))
      store.dispatch(setUser(null))
      store.dispatch(setApiUser(null))
      store.dispatch(openModal({ name: 'login' }))
    }
  } catch (error) {
    console.error('Failed to handle unauthorized error:', error)
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  config: ApiRequestConfig = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`

  const headers: Record<string, string> = {}

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, options.headers)
    }
  }

  if (!config.isFormData) {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers
    })

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`
      let errorData: any = null
      
      try {
        const text = await res.text()
        if (text) {
          errorData = JSON.parse(text) as { message?: string; error?: string; statusCode?: number }
          if (errorData && typeof errorData.message === 'string') {
            message = errorData.message
          }
        }
      } catch {
      }

      if (res.status === 401 || (errorData && (errorData.statusCode === 401 || errorData.error === 'Unauthorized'))) {
        handleUnauthorized()
        throw new Error('Unauthorized: Token expired or invalid. Please authenticate again.')
      }

      throw new Error(message)
    }

    if (res.status === 204 || res.status === 201) {
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return null as unknown as T
      }
    }

    return res.json() as Promise<T>
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${url}. Check your internet connection and API endpoint.`)
    }
    throw error
  }
}


