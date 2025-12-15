'use client'

import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { setDisplayName } from '../state/slices/auth'
import { useTranslation } from '../hooks/useTranslation'

export default function ChangeNameModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'changeName')
  const modalData = useSelector((s: RootState) => s.ui.modalData)
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const fromName = modalData?.from as string
  const toName = modalData?.to as string

  const handleConfirm = () => {
    if (toName) {
      dispatch(setDisplayName(toName))
    }
    dispatch(closeModal())
  }

  if (!fromName || !toName) return null

  return (
    <Modal 
      open={open} 
      onClose={() => dispatch(closeModal())} 
      title={t('settings.changeName')}
    >
      <div className="flex flex-col items-center">
        <div className="text-white text-center mb-6">
          {t('settings.changeNameQuestion')}
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'rgba(143, 55, 255, 0.3)' }}
          >
            {fromName}
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div 
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'rgba(143, 55, 255, 0.3)' }}
          >
            {toName}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full h-12 rounded-xl text-white font-medium"
          style={{
            background: 'linear-gradient(135deg, #8F37FF 0%, #AC6BFF 100%)',
            boxShadow: '0 4px 20px rgba(143, 55, 255, 0.4)'
          }}
        >
          {t('settings.changeNameButton')}
        </button>
      </div>
    </Modal>
  )
}

