import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Language } from '../../i18n'

type LanguageState = {
  current: Language
  initialized: boolean
}

const initialState: LanguageState = {
  current: 'ru',
  initialized: false
}

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.current = action.payload
      state.initialized = true
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_language', action.payload)
      }
    },
    initializeLanguage(state) {
      if (!state.initialized && typeof window !== 'undefined') {
        const saved = localStorage.getItem('app_language')
        if (saved && ['ru', 'en', 'hi', 'pt', 'tr'].includes(saved)) {
          state.current = saved as Language
        }
        state.initialized = true
      }
    }
  }
})

export const { setLanguage, initializeLanguage } = languageSlice.actions
export default languageSlice.reducer

