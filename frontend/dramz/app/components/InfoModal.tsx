'use client'

import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'

export default function InfoModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'info')
  const data = useSelector((s: RootState) => s.ui.modalData)
  const dispatch = useDispatch()
  return (
    <Modal open={open} onClose={() => dispatch(closeModal())} title="">
      <div className="text-center px-2">
        <div className="text-lg font-semibold">Сериал</div>
        <div className="text-base mt-1">"{data?.title || 'Название сериала'}"</div>
        <div className="text-sm text-white/80 mt-2">уже доступен для вас бесплатно!</div>
        <button onClick={() => dispatch(closeModal())} className="w-full h-12 rounded-xl primary mt-4">Отлично !</button>
      </div>
    </Modal>
  )
}


