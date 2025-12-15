import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { ApiTask, TaskCompletion } from '@/types/api'
import { getActiveUserTasks, completeUserTask, getUserTaskHistory } from '@/lib/api/tasks'

export type TasksState = {
  active: ApiTask[]
  loadingActive: boolean
  activeError: string | null
  history: TaskCompletion[]
  loadingHistory: boolean
  historyError: string | null
  completing: Record<string, boolean>
  completeError: string | null
  lastCompletedTaskId: string | null
}

const initialState: TasksState = {
  active: [],
  loadingActive: false,
  activeError: null,
  history: [],
  loadingHistory: false,
  historyError: null,
  completing: {},
  completeError: null,
  lastCompletedTaskId: null
}

export const fetchActiveTasks = createAsyncThunk(
  'tasks/fetchActive',
  async ({ token }: { token: string }) => {
    const res = await getActiveUserTasks(token)
    return res.tasks
  }
)

export const fetchTaskHistory = createAsyncThunk(
  'tasks/fetchHistory',
  async ({ token, limit }: { token: string, limit?: number }) => {
    const res = await getUserTaskHistory(token, limit)
    return res.completions
  }
)

export const completeTask = createAsyncThunk(
  'tasks/complete',
  async ({ token, taskId, link }: { token: string, taskId: string, link?: string }) => {
    const res = await completeUserTask(token, taskId, link ? { link } : {})
    return { taskId, res }
  }
)

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksErrors(state) {
      state.activeError = null
      state.historyError = null
      state.completeError = null
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActiveTasks.pending, state => {
        state.loadingActive = true
        state.activeError = null
      })
      .addCase(fetchActiveTasks.fulfilled, (state, action: PayloadAction<ApiTask[]>) => {
        state.loadingActive = false
        state.active = action.payload
      })
      .addCase(fetchActiveTasks.rejected, (state, action) => {
        state.loadingActive = false
        state.activeError = action.error.message || 'Failed to load tasks'
      })
      .addCase(fetchTaskHistory.pending, state => {
        state.loadingHistory = true
        state.historyError = null
      })
      .addCase(fetchTaskHistory.fulfilled, (state, action: PayloadAction<TaskCompletion[]>) => {
        state.loadingHistory = false
        state.history = action.payload
      })
      .addCase(fetchTaskHistory.rejected, (state, action) => {
        state.loadingHistory = false
        state.historyError = action.error.message || 'Failed to load task history'
      })
      .addCase(completeTask.pending, (state, action) => {
        const taskId = action.meta.arg.taskId
        state.completing[taskId] = true
        state.completeError = null
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        const { taskId } = action.payload
        delete state.completing[taskId]
        state.lastCompletedTaskId = taskId
      })
      .addCase(completeTask.rejected, (state, action) => {
        const taskId = action.meta.arg.taskId
        delete state.completing[taskId]
        state.completeError = action.error.message || 'Failed to complete task'
      })
  }
})

export const { clearTasksErrors } = tasksSlice.actions
export default tasksSlice.reducer


