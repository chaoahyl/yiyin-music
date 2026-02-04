<template>
  <div class="settings">
    <div class="title">
      <h2 style="margin: 0">{{ t('views.set.settings_title') }}</h2>
    </div>

    <div class="form-container">
      <ConfigForm :model="formData" :groups="formGroups">
        <!-- 主题/模式切换 -->
        <template #custom-mode>
          <div class="custom-mode-switch">
            <div
              class="mode-slider"
              :style="{
                width: `calc(100% / ${modeOptions.length} - 8px)`,
                transform: `translateX(calc(${activeIndex} * 100% + ${activeIndex * 8}px))`
              }"
            >
              <div class="slider-glow"></div>
            </div>

            <div
              v-for="option in modeOptions"
              :key="option.value"
              :class="['mode-item', { active: formData.mode === option.value }]"
              @click="updateMode(option.value)"
            >
              <span class="mode-text">{{ t(option.label) }}</span>
            </div>
          </div>
        </template>

        <!-- 语言切换 -->
        <template #custom-lang>
          <div class="custom-mode-switch">
            <div
              class="mode-slider"
              :style="{
                width: `calc(100% / ${langOptions.length} - 8px)`,
                transform: `translateX(calc(${langActiveIndex} * 100% + ${langActiveIndex * 8}px))`
              }"
            >
              <div class="slider-glow"></div>
            </div>

            <div
              v-for="option in langOptions"
              :key="option.value"
              :class="['mode-item', { active: formData.lang === option.value }]"
              @click="updateLang(option.value)"
            >
              <span class="mode-text">{{ option.label }}</span>
            </div>
          </div>
        </template>

        <!-- 清除缓存 -->
        <template #custom-cache>
          <GlobalButtons :buttonList="buttonList.cache"></GlobalButtons>
        </template>

        <!-- 设置路径 & 导入音乐 -->
        <template #custom-path>
          <GlobalButtons :buttonList="buttonList.path"></GlobalButtons>
        </template>

        <!-- 远程控制 -->
        <template #custom-remote>
          <GlobalButtons :buttonList="buttonList.control"></GlobalButtons>
        </template>

        <!-- 系统日志 -->
        <template #custom-logs>
          <GlobalButtons :buttonList="buttonList.log"></GlobalButtons>
        </template>
      </ConfigForm>
    </div>

    <!-- 导入进度弹窗 -->
    <ImportDialog v-model="uiStore.importVisible" :progress="importProgress" />

    <ControlDialog v-model="qrVisible" :url="remoteUrl" />

    <!-- 版本信息 -->
    <div class="version-info">
      <p>{{ t('views.set.version') }}: {{ version.version }}</p>
      <p>{{ t('views.set.developer') }}: {{ version.developer }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox, ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'

import { handleRes } from '@renderer/utils/request'
import { useGlobalStore } from '@renderer/store'
import { useUIStore } from '@renderer/store/ui'
import { setTheme } from '@renderer/utils/auth'
import GlobalButtons from '@renderer/components/global-buttons/index.vue'

import ConfigForm from './form.vue'
import ImportDialog from './import-dialog.vue'
import ControlDialog from './control-dialog.vue'
import { setLang } from '@renderer/lang'
import { ELANG_VALUE } from '@renderer/lang/type'

const { t } = useI18n()
const globalStore = useGlobalStore()
const uiStore = useUIStore()

const buttonList = computed(() => ({
  path: [
    {
      style: { padding: '0', 'border-radius': '8px' },
      label: t('views.set.set_path'),
      onClick: handlePath
    }
  ],
  cache: [
    {
      style: { padding: '0', 'border-radius': '8px', 'font-size': '8px' },
      label: t('views.set.clear_cache'),
      onClick: clearCache
    }
  ],
  control: [
    {
      style: { padding: '0', 'border-radius': '8px' },
      label: t('views.set.remote_control'),
      onClick: handleRemote
    }
  ],
  log: [
    {
      style: { padding: '0', 'border-radius': '8px' },
      label: t('views.set.open_logs'),
      onClick: handleOpenLogs
    }
  ]
}))

/** 打开日志目录 */
const handleOpenLogs = () => window.api.openPath()

/** 表单数据 */
const formData = ref({ mode: uiStore.themeMode, audioMode: 'stereo', lang: uiStore.lang })

/** 表单分组 */
const formGroups = computed(() => [
  {
    title: t('views.set.appearance_settings'),
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: t('views.set.mode'), prop: 'mode' }]
  },
  {
    title: t('views.set.language_settings'),
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: t('views.set.language'), prop: 'lang' }]
  },
  {
    title: t('views.set.storage_management'),
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [
      { type: 'custom', label: t('views.set.path'), prop: 'path' },
      { type: 'divider', style: `margin:5px 0; border-color: var(--color-border)` },
      { type: 'custom', label: t('views.set.cache_clear'), prop: 'cache' }
    ]
  },
  {
    title: t('views.set.remote_service'),
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: t('views.set.remote_control'), prop: 'remote' }]
  },
  {
    title: t('views.set.system_logs'),
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: t('views.set.logs'), prop: 'logs' }]
  }
])

/** 版本信息 */
const version = ref({ version: '1.0.0', developer: 'nnjxka' })
const qrVisible = ref(false)
const remoteUrl = ref('')
onMounted(() => {
  window.api.getCode().then((res) => {
    if (handleRes(res)) remoteUrl.value = res.data
  })
})

/** 清除缓存 */
const clearCache = () => {
  ElMessageBox.confirm(t('views.set.confirm_clear_cache'), t('views.set.warning'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  })
    .then(() => {
      localStorage.clear()
      globalStore.resetAll()
      ElNotification({
        title: t('views.set.cache_cleared'),
        type: 'success',
        position: 'bottom-right'
      })
    })
    .catch(() => {})
}

/** 导入路径 */
const handlePath = () => {
  window.api.openMusicFolder().then((res) => {
    if (res.code === 200) {
      const p = res.path
      window.api.setMusicFolder(p).then(() => {
        uiStore.importVisible = true
        importProgress.current = 0
        importProgress.total = 0
        importProgress.percent = 0

        window.api.onImportProgress((data: { current: number; total: number; file: string }) => {
          importProgress.current = data.current
          importProgress.total = data.total
          importProgress.file = data.file
          importProgress.percent = Math.round((data.current / data.total) * 100)
        })

        window.api.importMusicFolder(p).finally(() => (uiStore.importVisible = false))
      })
    } else {
      ElNotification({ title: res.message, type: 'info', position: 'bottom-right' })
    }
  })
}

/** 主题模式切换 */
const modeOptions = computed(() => [
  { label: t('views.set.light_mode'), value: 'light' },
  { label: t('views.set.dark_mode'), value: 'dark' },
  { label: t('views.set.immersive_mode'), value: 'filter' }
])

// 语言选项
const langOptions = computed(() => [
  { label: t('views.set.lang_zh'), value: ELANG_VALUE.Zh },
  { label: t('views.set.lang_en'), value: ELANG_VALUE.En }
])

const activeIndex = computed(() =>
  modeOptions.value.findIndex((opt) => opt.value === formData.value.mode)
)
const updateMode = (val) => {
  formData.value.mode = val
  setTheme(val)
  document.documentElement.classList.remove('dark', 'filter-mode')
  if (val === 'dark') document.documentElement.classList.add('dark')
  else if (val === 'filter') document.documentElement.classList.add('filter-mode')
}

const langActiveIndex = computed(() =>
  langOptions.value.findIndex((opt) => opt.value === formData.value.lang)
)
const updateLang = (val: ELANG_VALUE) => {
  formData.value.lang = val
  setLang(val)
}

const handleRemote = () => (qrVisible.value = true)

const importProgress = reactive({ current: 0, total: 0, file: '', percent: 0 })
</script>

<style scoped lang="less">
.settings {
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
  box-sizing: border-box;
  gap: 20px;
  .title {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
  }
  .form-container {
    width: 100%;
    .custom-mode-switch {
      position: relative;
      display: flex;
      width: 320px;
      height: 100%;
      background: var(--color-bg);
      border-radius: 10px;
      user-select: none;
      border: 1px solid var(--color-border);
      transition: background-color 0.4s ease;
      overflow: hidden;

      // 滑块
      .mode-slider {
        position: absolute;
        top: 4px;
        left: 4px;
        height: calc(100% - 8px);
        background: var(--sidebar-item-active-bg);
        border-radius: 8px;
        z-index: 1;
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      // 选项单元
      .mode-item {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;

        .mode-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text);
          transition:
            color 0.3s ease,
            opacity 0.3s ease;
          opacity: 0.6;
        }
        &.active {
          .mode-text {
            opacity: 1;
          }
        }
        &:not(.active):hover {
          .mode-text {
            opacity: 0.9;
          }
        }

        &:active {
          opacity: 0.8;
          transform: none;
        }
      }
    }
    :deep(html.filter-mode) {
      .custom-mode-switch {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(15px);

        .mode-slider {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  .version-info {
    padding-bottom: 20px;
    text-align: center;
    font-size: 14px;
    color: var(--color-text);
    p {
      margin: 5px 0;
    }
  }
}

.form {
  padding: 0 !important;
  :deep(.el-form-item) {
    padding: 5px !important;
    margin: 0 !important;
  }
  :deep(.el-form-item__content) {
    justify-content: flex-end !important;
  }
}
</style>
