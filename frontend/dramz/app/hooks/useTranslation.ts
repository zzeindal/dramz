'use client'

import { useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { getTranslation, type Language } from '../i18n'

export function useTranslation() {
  const language = useSelector((s: RootState) => s.language.current)
  
  const t = (key: string): string => {
    return getTranslation(language, key)
  }
  
  return { t, language }
}

