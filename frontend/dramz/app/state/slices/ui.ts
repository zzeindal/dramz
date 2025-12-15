import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ModalName = 'faq' | 'purchase' | 'info' | 'repost' | 'login' | 'allSeries' | 'changeLanguage' | 'changeName' | 'noUsername'

type UIState = {
  modal: ModalName | null
  modalData: any
}

const initialState: UIState = {
  modal: null,
  modalData: null
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<{ name: ModalName, data?: any }>) {
      state.modal = action.payload.name
      state.modalData = action.payload.data
    },
    closeModal(state) {
      state.modal = null
      state.modalData = null
    }
  }
})

export const { openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer


