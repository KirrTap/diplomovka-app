import sk from './sk.json'
import en from './en.json'

export const languages = {
  sk: {
    label: 'SK',
    countryCode: 'SK',
    translations: sk,
  },
  en: {
    label: 'EN',
    countryCode: 'GB',
    translations: en,
  },
}

export type LanguageKey = keyof typeof languages