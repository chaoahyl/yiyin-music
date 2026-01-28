<template>
  <el-config-provider :locale="locale">
    <router-view />
    <UpdateDialog></UpdateDialog>
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import UpdateDialog from '@renderer/layout/cpms/update-dialog/index.vue'

import { setTheme } from '@renderer/utils/auth'

import { useGlobalStore } from './store'
import { useUIStore } from './store/ui'

const locale = zhCn
const globalStore = useGlobalStore()
const uiStore = useUIStore()

// 初始化主题
onMounted(() => {
  if (uiStore.themeMode === '') {
    uiStore.themeMode = 'light'
    setTheme('light')
    applyTheme('light')
  } else {
    applyTheme(uiStore.themeMode)
  }
  globalStore.initPlay()
})

// 应用主题函数
const applyTheme = (mode: string) => {
  document.documentElement.classList.remove('dark', 'filter-mode')

  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (mode === 'filter') {
    document.documentElement.classList.add('filter-mode')
  }
}

// 监听全局主题变化
watch(
  () => uiStore.themeMode,
  (mode) => {
    if (mode.length > 0) {
      applyTheme(mode)
      setTheme(mode)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
* {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

#app {
  width: 100vw;
  height: 100vh;
}
</style>
