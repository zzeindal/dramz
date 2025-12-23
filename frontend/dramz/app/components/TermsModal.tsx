'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { closeModal } from '../state/slices/ui'
import { useTranslation } from '../hooks/useTranslation'
import { useIsIOS } from '../hooks/useIsIOS'

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function TermsModal() {
  const dispatch = useDispatch()
  const [agreementChecked, setAgreementChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const { t } = useTranslation()
  const isIOS = useIsIOS()

  const handleConfirm = () => {
    if (agreementChecked && privacyChecked) {
      localStorage.setItem('termsAccepted', 'true')
      dispatch(closeModal())
    }
  }

  const isButtonEnabled = agreementChecked && privacyChecked

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div 
        className="w-full max-w-[440px] rounded-[16px] text-white overflow-hidden" 
        style={isIOS ? {
          backgroundColor: 'rgba(13, 9, 32, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        } : {
          backgroundColor: 'rgba(13, 9, 32, 0.898)',
        }}
      >
        <div className="px-4 py-5">
          <h2 className="text-[24px] font-semibold mb-4 text-center">{t('terms.title')}</h2>
          
          <p className="text-white mb-6 text-center leading-relaxed">
            {t('terms.description')}
          </p>

          <div className="space-y-4 mb-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setAgreementChecked(!agreementChecked)}
            >
              <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                agreementChecked ? 'bg-[#704ED7]' : 'bg-white'
              }`}>
                {agreementChecked && <CheckIcon />}
              </div>
              <span className="underline">{t('terms.userAgreement')}</span>
            </div>

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setPrivacyChecked(!privacyChecked)}
            >
              <div className={`w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
                privacyChecked ? 'bg-[#704ED7]' : 'bg-white'
              }`}>
                {privacyChecked && <CheckIcon />}
              </div>
              <span className="underline">{t('terms.privacyPolicy')}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!isButtonEnabled}
            className={`w-full h-12 rounded-[8px] font-medium transition-opacity ${
              isButtonEnabled
                ? 'bg-[#8F37FF] text-white opacity-100'
                : 'bg-[#8F37FF] text-white opacity-50 cursor-not-allowed'
            }`}
          >
            {t('terms.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

