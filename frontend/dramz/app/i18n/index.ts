import ru from './ru.json'
import en from './en.json'
import hi from './hi.json'
import pt from './pt.json'
import tr from './tr.json'

export type Language = 'ru' | 'en' | 'hi' | 'pt' | 'tr'

export const translations = {
  ru,
  en,
  hi,
  pt,
  tr
}

export const getTranslation = (lang: Language, key: string): string => {
  const keys = key.split('.')
  let value: any = translations[lang]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }
  
  return typeof value === 'string' ? value : key
}

export const languageNames: Record<Language, string> = {
  ru: 'Русский',
  en: 'English',
  hi: 'हिंदी',
  pt: 'Português',
  tr: 'Türkçe'
}

