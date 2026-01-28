import { defineStore } from 'pinia'
import type { TGlobalSore } from './type'
import { getTheme } from '@renderer/utils/auth'

export const useUIStore = defineStore('ui', {
  state: (): TGlobalSore => {
    return {
      importVisible: false,
      playWindow: false,
      themeMode: getTheme()
    }
  }
})
