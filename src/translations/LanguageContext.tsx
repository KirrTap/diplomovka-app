import React, { createContext, useContext, useState } from 'react'
import { languages } from './translations'
import type { LanguageKey } from './translations'

type LanguageContextType = {
  lang: LanguageKey
  setLang: (lang: LanguageKey) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LanguageKey>('sk')

  const t = (key: string) => {
    const translations = languages[lang].translations as Record<string, string>
    return translations[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}