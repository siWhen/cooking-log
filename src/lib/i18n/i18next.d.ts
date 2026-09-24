import 'i18next'
import type { Resources } from './locales/zh'

// 让 t('...') 的 key 有类型检查和自动补全
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Resources }
  }
}
