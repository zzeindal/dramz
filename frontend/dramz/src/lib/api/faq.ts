import { apiFetch } from './client'
import type { ApiFaqItem } from '@/types/api'

export async function getFaqList() {
  return apiFetch<ApiFaqItem[]>('/faq', {
    method: 'GET'
  })
}


