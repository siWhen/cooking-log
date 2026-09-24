import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh'

// 第一版只提供简体中文；ja、en 预留，之后新增 locales/ja.ts、locales/en.ts 并在这里注册即可
export const supportedLocales = ['zh'] as const
export type Locale = (typeof supportedLocales)[number]

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false }, // React 已经会转义
})

export default i18n
