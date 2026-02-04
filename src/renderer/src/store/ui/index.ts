import { defineStore } from 'pinia'
import type { TGlobalSore } from './type'
import { getTheme } from '@renderer/utils/auth'
import { ELANG_VALUE } from '@renderer/lang/type'

export const useUIStore = defineStore('ui', {
  state: (): TGlobalSore => {
    return {
      importVisible: false,
      playWindow: false,
      themeMode: getTheme(),
      lang: ELANG_VALUE.Zh
    }
  }
})
