'use client'

import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../state/store'
import { setLanguage } from '../../../state/slices/language'
import { openModal } from '../../../state/slices/ui'
import { useTranslation } from '../../../hooks/useTranslation'
import { languageNames, type Language } from '../../../i18n'

const languages: Language[] = ['ru', 'en', 'hi', 'pt', 'tr']

export default function LanguageSelectionPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const currentLanguage = useSelector((s: RootState) => s.language.current)
  const { t } = useTranslation()

  const handleLanguageSelect = (lang: Language) => {
    if (lang !== currentLanguage) {
      dispatch(openModal({ 
        name: 'changeLanguage', 
        data: { from: currentLanguage, to: lang } 
      }))
    }
  }

  return (
    <main className="w-full relative min-h-screen app-frame">
      <section className="px-8 mt-20 relative z-10">
        <div className="text-white text-2xl font-semibold mb-6">
          {t('profile.appLanguage')}
        </div>
        
        <div className="space-y-0">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageSelect(lang)}
              className="w-full flex items-center justify-between py-4 border-b border-[#261f3f] last:border-0 text-left"
            >
              <span className="text-white text-base">{languageNames[lang]}</span>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

