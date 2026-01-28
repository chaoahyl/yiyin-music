<template>
  <div class="layout">
    <div v-if="uiStore.themeMode === 'filter'" class="layout-glass-container">
      <div class="glass-bg" :style="{ backgroundImage: bgStyle }" />

      <div class="glass-overlay"></div>

      <div class="glass-noise"></div>
    </div>

    <WindowsControl />

    <!-- 主内容区域 -->
    <div class="layout-content" id="target">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" ref="routerViewRef" />
        </transition>
      </router-view>
    </div>

    <!-- 音乐播放器 -->
    <transition name="fade">
      <MusicPlayer
        v-if="globalStore.playMusic"
        :isPlaying="globalStore.isPlaying"
        :currentTime="globalStore.playTime"
        @togglePlay="togglePlay"
        @nextSong="nextSong"
        @prevSong="prevSong"
        @seek="seek"
      />
    </transition>
    <PlayWindow />
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@renderer/store'
import { useUIStore } from '@renderer/store/ui'
import WindowsControl from '@renderer/layout/cpms/window-control/index.vue'

import MusicPlayer from './cpms/music-player/index.vue'
import PlayWindow from './cpms/play-window/index.vue'

const globalStore = useGlobalStore()
const uiStore = useUIStore()

const currentCover = ref(globalStore.playMusic?.cover)

const bgStyle = computed(() => (currentCover.value ? `url(${currentCover.value})` : 'none'))

let preloadImg: HTMLImageElement | null = null

watch(
  () => [globalStore.playMusic?.cover, uiStore.themeMode],
  ([newCover, mode]) => {
    if (mode !== 'filter' || !newCover) {
      currentCover.value = ''
      return
    }

    // 释放旧 Image
    if (preloadImg) {
      preloadImg.onload = null
      preloadImg.onerror = null
      preloadImg.src = ''
      preloadImg = null
    }

    const img = new Image()
    preloadImg = img
    img.src = newCover

    img.onload = () => {
      currentCover.value = newCover
    }

    img.onerror = () => {
      currentCover.value = ''
    }
  },
  { immediate: true }
)

// 播放 / 暂停切换
const togglePlay = () => {
  globalStore.togglePlay()
}

// 播放下一首
const nextSong = () => {
  globalStore.nextSong()
}

// 播放上一首
const prevSong = () => {
  globalStore.prevSong()
}

// 拖动进度条跳转
const seek = (time: number) => {
  globalStore.seek(time)
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  position: relative;
  color: var(--color-text);
  overflow: hidden;
}

.layout-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 80px;
  z-index: 1;
  overflow: hidden;
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 0 3vw;
  box-sizing: border-box;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* --- 过滤模式背景容器 --- */
.layout-glass-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-color: #000;
}

.glass-bg {
  position: absolute;
  inset: -15%; /* 增加冗余范围，彻底消除模糊边缘的白边 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(50px) saturate(150%) brightness(0.9);
  transform: scale(1.1);
}

.glass-overlay {
  position: absolute;
  inset: 0;
  /* 径向遮罩，中心较亮突出内容，边缘较深产生沉浸感 */
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%);
}

.glass-noise {
  position: absolute;
  inset: 0;
  opacity: 0.015;
  pointer-events: none;
  /* 动态生成的噪点 SVG */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
