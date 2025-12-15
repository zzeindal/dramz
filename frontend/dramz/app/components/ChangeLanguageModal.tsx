'use client'

import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { setLanguage } from '../state/slices/language'
import { useTranslation } from '../hooks/useTranslation'
import { languageNames, type Language } from '../i18n'

export default function ChangeLanguageModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'changeLanguage')
  const modalData = useSelector((s: RootState) => s.ui.modalData)
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const fromLang = modalData?.from as Language
  const toLang = modalData?.to as Language

  const handleConfirm = () => {
    if (toLang) {
      dispatch(setLanguage(toLang))
    }
    dispatch(closeModal())
  }

  if (!fromLang || !toLang) return null

  return (
    <Modal 
      open={open} 
      onClose={() => dispatch(closeModal())} 
      title={t('settings.changeLanguage')}
    >
      <div className="flex flex-col items-center">
        <div className="text-white text-center mb-6">
          {t('settings.changeLanguageQuestion')}
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'rgba(143, 55, 255, 0.3)' }}
          >
            {languageNames[fromLang]}
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div 
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: 'rgba(143, 55, 255, 0.3)' }}
          >
            {languageNames[toLang]}
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
          {t('settings.changeLanguageButton')}
        </button>
      </div>
    </Modal>
  )
}

