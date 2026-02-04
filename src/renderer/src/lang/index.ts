import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'
import { useUIStore } from '@renderer/store/ui'
import { ELANG_VALUE, TElangs } from './type'

export const setLang = (lang: ELANG_VALUE) => {
  const LANG_KEY = import.meta.env.VITE_APP_LANG
  const uiStore = useUIStore()
  const $had = ([ELANG_VALUE.En, ELANG_VALUE.Zh] as TElangs[]).includes(lang)
  uiStore.lang = $had && lang ? lang : ELANG_VALUE.Zh
  i18n.global.locale.value = uiStore.lang
  localStorage.setItem(LANG_KEY, uiStore.lang)
}

export const getLang = () => {
  try {
    const LANG_KEY = import.meta.env.VITE_APP_LANG
    const languageStore = localStorage.getItem(LANG_KEY)
    if (languageStore) {
      return (languageStore as ELANG_VALUE) ?? ELANG_VALUE.Zh
    } else if (window.navigator.language) {
      return window.navigator.language == ELANG_VALUE.En ? ELANG_VALUE.En : ELANG_VALUE.Zh
    }
    return ELANG_VALUE.Zh
  } catch (error) {
    return ELANG_VALUE.Zh
  }
}
export const i18n = createI18n({
  legacy: false,
  locale: getLang(), // 设置默认语言
  messages: {
    [ELANG_VALUE.Zh]: zh,
    [ELANG_VALUE.En]: en
  }
})
