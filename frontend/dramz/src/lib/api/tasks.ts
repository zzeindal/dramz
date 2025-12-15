import { apiFetch } from './client'
import type {
  ActiveTasksResponse,
  CompleteTaskRequest,
  CompleteTaskResponse,
  TaskHistoryResponse
} from '@/types/api'

export async function getActiveUserTasks(token: string) {
  return apiFetch<ActiveTasksResponse>('/user/tasks', { method: 'GET' }, { token })
}

export async function completeUserTask(token: string, taskId: string, body: CompleteTaskRequest = {}) {
  return apiFetch<CompleteTaskResponse>(`/user/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify(body)
  }, { token })
}

export async function getUserTaskHistory(token: string, limit?: number) {
  const query = typeof limit === 'number' ? `?limit=${limit}` : ''
  return apiFetch<TaskHistoryResponse>(`/user/tasks/history${query}`, { method: 'GET' }, { token })
}


