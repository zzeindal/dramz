import { configureStore } from '@reduxjs/toolkit'
import auth from './slices/auth'
import ui from './slices/ui'
import language from './slices/language'
import tasks from './slices/tasks'

export const makeStore = () =>
  configureStore({
    reducer: { auth, ui, language, tasks }
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']


