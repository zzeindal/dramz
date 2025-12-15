const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dramz.fun'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

type RequestOptions = {
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined | null>
  body?: any
  isMultipart?: boolean
}

export class RequestError extends Error {
  status: number
  data: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'RequestError'
    this.status = status
    this.data = data
  }
}

type AuthState = {
  accessToken: string | null
  admin: { id: string; username: string } | null
}

const AUTH_TOKEN_KEY = 'admin_token'
const AUTH_ADMIN_KEY = 'admin_info'

const encodeQuery = (params?: RequestOptions['query']) => {
  if (!params) return ''
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return q ? `?${q}` : ''
}

export const getAuth = (): AuthState => {
  if (typeof window === 'undefined') return { accessToken: null, admin: null }
  const accessToken = localStorage.getItem(AUTH_TOKEN_KEY)
  const adminRaw = localStorage.getItem(AUTH_ADMIN_KEY)
  const admin = adminRaw ? JSON.parse(adminRaw) : null
  return { accessToken, admin }
}

export const setAuth = (accessToken: string, admin: { id: string; username: string }) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
  localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(admin))
  document.cookie = `admin_token=${accessToken}; path=/; SameSite=Lax`
}

export const clearAuth = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_ADMIN_KEY)
  document.cookie = `admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

const request = async <T>(method: HttpMethod, path: string, options: RequestOptions = {}) => {
  const { accessToken } = getAuth()
  const headers: Record<string, string> = {}
  if (!options.isMultipart) headers['Content-Type'] = 'application/json'
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  if (options.headers) Object.assign(headers, options.headers)
  const url = `${BASE_URL}${path}${encodeQuery(options.query)}`
  const res = await fetch(url, {
    method,
    headers,
    body: options.isMultipart ? options.body : options.body ? JSON.stringify(options.body) : undefined
  })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error || data.errorMessage)) ||
      (typeof data === 'string' && data) ||
      'Request failed'
    throw new RequestError(message, res.status, data)
  }
  return data as T
}

export const apiGet = async <T>(path: string, query?: RequestOptions['query']) =>
  request<T>('GET', path, { query })

export const apiPost = async <T>(path: string, body?: any) =>
  request<T>('POST', path, { body })

export const apiPut = async <T>(path: string, body?: any) =>
  request<T>('PUT', path, { body })

export const apiDelete = async <T>(path: string) =>
  request<T>('DELETE', path)

export const apiUpload = async <T>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') => {
  const { accessToken } = getAuth()
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method,
    headers,
    body: formData
  })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error || data.errorMessage)) ||
      (typeof data === 'string' && data) ||
      'Upload failed'
    throw new RequestError(message, res.status, data)
  }
  return data as T
}


