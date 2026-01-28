<template>
  <div class="settings">
    <div class="title">
      <h2 style="margin: 0">设置</h2>
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

        <template #custom-remote>
          <GlobalButtons :buttonList="buttonList.control"></GlobalButtons>
        </template>

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
      <p>版本: {{ version.version }}</p>
      <p>开发者: {{ version.developer }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox, ElNotification } from 'element-plus'

import { handleRes } from '@renderer/utils/request'
import { useGlobalStore } from '@renderer/store'
import { useUIStore } from '@renderer/store/ui'
import { setTheme } from '@renderer/utils/auth'
import GlobalButtons from '@renderer/components/global-buttons/index.vue'

import ConfigForm from './form.vue'
import ImportDialog from './import-dialog.vue'
import ControlDialog from './control-dialog.vue'
const globalStore = useGlobalStore()
const uiStore = useUIStore()

const buttonList = computed(() => ({
  path: [
    {
      style: { padding: '0', 'border-radius': '8px' },
      label: '设置路径',
      onClick: handlePath
    }
  ],
  cache: [
    {
      style: { padding: '0', 'border-radius': '8px', 'font-size': '8px' },
      label: '清除缓存',
      onClick: clearCache
    }
  ],
  control: [
    {
      style: { padding: '0', 'border-radius': '8px' },
      label: '远程控制',
      onClick: handleRemote
    }
  ],
  log: [
    {
      style: { padding: '0', 'border-radius': '8px' },
      label: '打开日志',
      onClick: handleOpenLogs
    }
  ]
}))

/** 打开日志目录 */
const handleOpenLogs = () => {
  window.api.openPath()
}

/** 表单数据 */
const formData = ref({
  mode: uiStore.themeMode,
  audioMode: 'stereo'
})

/** 表单分组 */
const formGroups = computed(() => [
  {
    title: '外观设置',
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: '模式', prop: 'mode' }]
  },
  {
    title: '存储管理',
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [
      { type: 'custom', label: '歌曲路径', prop: 'path' },
      { type: 'divider', style: `margin:5px 0; border-color: var(--color-border)` },
      { type: 'custom', label: '缓存清理', prop: 'cache' }
    ]
  },
  {
    title: '远程服务',
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: '远程控制', prop: 'remote' }]
  },
  {
    title: '系统日志',
    titleStyle: 'padding:5px',
    wrapperStyle: `background: var(--color-set-bg); padding:5px; border-radius:10px`,
    items: [{ type: 'custom', label: '运行日志', prop: 'logs' }]
  }
])

/** 版本信息 */
const version = ref({ version: '1.0.0', developer: 'nnjxka' })
const qrVisible = ref(false)
const remoteUrl = ref('')
onMounted(() => {
  window.api.getCode().then((res) => {
    if (handleRes(res)) {
      remoteUrl.value = res.data
    }
  })
})

/** 清除缓存 */
const clearCache = () => {
  ElMessageBox.confirm('确定要清除缓存吗?', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      localStorage.clear()
      globalStore.resetAll()
      ElNotification({
        title: '缓存清理完成，重启程序即可生效',
        type: 'success',
        position: 'bottom-right'
      })
    })
    .catch(() => {})
}

/** 导入进度状态 */
const importProgress = reactive({
  current: 0,
  total: 0,
  file: '',
  percent: 10
})

const handleRemote = () => {
  qrVisible.value = true
}

/** 设置路径 & 导入音乐 */
const handlePath = () => {
  window.api.openMusicFolder().then((res) => {
    if (res.code === 200) {
      const p = res.path
      window.api.setMusicFolder(p).then((_ress) => {
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

        window.api
          .importMusicFolder(p)
          .then(() => {
            localStorage.clear()
            globalStore.resetAll()
          })
          .finally(() => {
            uiStore.importVisible = false
          })
      })
    } else {
      ElNotification({ title: res.message, type: 'info', position: 'bottom-right' })
    }
  })
}

/** 模式切换 */
const handleModeChange = (mode: 'dark' | 'filter' | 'light') => {
  uiStore.themeMode = mode
  setTheme(mode)
  document.documentElement.classList.remove('dark', 'filter-mode')
  if (mode === 'dark') document.documentElement.classList.add('dark')
  else if (mode === 'filter') document.documentElement.classList.add('filter-mode')
}
const modeOptions = [
  { label: '明亮', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '沉浸', value: 'filter' }
]

const activeIndex = computed(() =>
  modeOptions.findIndex((opt) => opt.value === formData.value.mode)
)

const updateMode = (val) => {
  formData.value.mode = val
  handleModeChange(val)
}
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
