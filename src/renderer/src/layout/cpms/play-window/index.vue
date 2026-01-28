<template>
  <el-drawer v-model="uiStore.playWindow" direction="btt" size="100%" :with-header="false">
    <div class="player-container">
      <!-- 流体背景组件 -->
      <FluidBackground :colors="bgColors" />

      <!-- 上方悬浮按钮 -->
      <div class="top-controls">
        <SvgIcon size="35" :name="'line'" class="custom-ico" @click="drawerClose" />
      </div>

      <!-- 左侧封面区 -->
      <div style="width: 50%; padding: 5% 0">
        <Info @open-update="openUpdate"></Info>
      </div>
      <!-- 右侧歌词自动渲染区 -->
      <div style="width: 50%; padding: 5% 0; position: relative">
        <transition name="slide-right-left">
          <LyricsPlayer
            v-show="showLyrics && showLeft === 'lyric'"
            key="lyric"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 5% 5vw"
            @update:playTime="(val) => globalStore.seek(val)"
          />
        </transition>
        <transition name="slide-right-left">
          <List
            v-show="showLyrics && showLeft === 'list'"
            key="list"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 5% 0"
          />
        </transition>
      </div>

      <!-- 右下角悬浮按钮 -->
      <div class="floating" style="right: 60px">
        <SvgIcon
          size="25"
          name="lyric"
          class="close-btn"
          :class="{ active: showLeft === 'lyric' }"
          @click="showLeft = 'lyric'"
        />
      </div>
      <div class="floating" style="right: 10px">
        <SvgIcon
          size="25"
          name="list"
          class="close-btn"
          :class="{ active: showLeft === 'list' }"
          @click="showLeft = 'list'"
        />
      </div>
    </div>
    <UpdateDialog ref="updateDialogRef"></UpdateDialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { Vibrant } from 'node-vibrant/browser'

import SvgIcon from '@renderer/components/svg-icon/index.vue'
import { useGlobalStore } from '@renderer/store'
import { useUIStore } from '@renderer/store/ui'

import LyricsPlayer from './lyric.vue'
import Info from './info.vue'
import List from './list.vue'
import UpdateDialog from './update.vue'
import FluidBackground from './fluid-bg.vue'

const globalStore = useGlobalStore()

const uiStore = useUIStore()
const showLyrics = ref(false)

const showLeft = ref<'lyric' | 'list'>('lyric')

const bgColors = ref({
  c1: { r: 255, g: 130, b: 150 }, // Vibrant 主光色
  c2: { r: 200, g: 80, b: 120 }, // DarkVibrant 阴影/波动
  c3: { r: 100, g: 100, b: 100 } // Muted 背景层
})

// 颜色提取函数：提取所有可用颜色
async function extractAndSetColors(coverUrl?: string) {
  if (!coverUrl) return

  try {
    const palette = await Vibrant.from(coverUrl).getPalette()

    // 主色 → 选柔和色
    const main = palette.Muted || palette.Vibrant
    // 阴影色 → 深色柔和
    const shadow = palette.DarkMuted || palette.DarkVibrant
    // 高光/波动色 → 亮色点缀
    const highlight = palette.LightVibrant || palette.Vibrant

    if (main && shadow && highlight) {
      const [r1, g1, b1] = main.rgb
      const [r2, g2, b2] = shadow.rgb
      const [r3, g3, b3] = highlight.rgb
      bgColors.value = {
        c1: { r: r1, g: g1, b: b1 },
        c2: { r: r2, g: g2, b: b2 },
        c3: { r: r3, g: g3, b: b3 }
      }
    } else {
      // fallback
      bgColors.value = {
        c1: { r: 255, g: 130, b: 150 },
        c2: { r: 200, g: 80, b: 120 },
        c3: { r: 100, g: 100, b: 100 }
      }
    }
  } catch (error) {
    console.error('Color extraction failed:', error)
  }
}

// 监听音乐变化，提取新封面颜色
watch(
  () => globalStore.playMusic?.cover,
  (cover) => {
    extractAndSetColors(cover)
  },
  { immediate: true }
)

let playWindowTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => uiStore.playWindow,
  (val) => {
    if (val) {
      showLeft.value = 'lyric' // 默认选歌词
      showLyrics.value = false // 先隐藏组件

      // 清理旧的定时器
      if (playWindowTimer) clearTimeout(playWindowTimer)

      // 0.5 秒后显示歌词
      playWindowTimer = setTimeout(() => {
        showLyrics.value = true
        extractAndSetColors(globalStore.playMusic?.cover)
        playWindowTimer = null
      }, 500)
    } else {
      // 关闭时清理定时器
      if (playWindowTimer) {
        clearTimeout(playWindowTimer)
        playWindowTimer = null
      }
    }
  }
)

onBeforeUnmount(() => {
  if (playWindowTimer) clearTimeout(playWindowTimer)
})

const drawerClose = () => (uiStore.playWindow = false)

const updateDialogRef = ref()
const openUpdate = () => {
  updateDialogRef.value.openDialog()
}
</script>

<style lang="less" scoped>
.player-container {
  display: flex;
  width: 100%;
  height: 100vh;
  position: relative;
}

.left-panel,
.right-panel {
  -webkit-app-region: no-drag !important;
  position: relative;
  z-index: 2;
}

.top-controls {
  position: absolute;
  -webkit-app-region: no-drag !important;
  top: 20px;
  right: 50%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 3;
  color: #ffffff;
}
.floating {
  -webkit-app-region: no-drag !important;
  position: absolute;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 3;
  color: #ffffff;
  .close-btn {
    padding: 5px;
    border-radius: 5px;
    cursor: pointer;
    transition: var(--transition);

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(0.9);
    }
    &.active {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}
</style>

<style lang="less">
.el-drawer__body {
  overflow: hidden;
  padding: 0 !important;
}
.slide-right-left-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.slide-right-left-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.slide-right-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.slide-right-left-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

.slide-right-left-enter-active,
.slide-right-left-leave-active {
  transition: all 0.35s ease;
}
</style>
