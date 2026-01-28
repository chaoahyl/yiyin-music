<template>
  <div class="music-player">
    <div class="info">
      <!-- 封面 -->
      <div
        class="cover-wrapper"
        :key="globalStore.playMusic?.url"
        @click="openPlayWindow"
        :class="{ playing: globalStore.isPlaying }"
      >
        <img :src="globalStore.playMusic?.cover || defaultCover" alt="封面" class="cover" />
      </div>

      <!-- 歌曲信息 -->
      <div class="text">
        <Transition name="fade-slide" mode="out-in">
          <div :key="globalStore.playMusic?.url" class="title">
            {{ globalStore.playMusic?.name || '未播放' }}
          </div>
        </Transition>
        <Transition name="fade-slide" mode="out-in">
          <div :key="globalStore.playMusic?.artist" class="artist">
            {{ globalStore.playMusic?.artist || '' }}
          </div>
        </Transition>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <SvgIcon size="25" name="before" class="control-btn" @click="prevSong" />
      <SvgIcon
        size="28"
        :name="globalStore.isPlaying ? 'pause' : 'play'"
        class="control-btn play-btn"
        @click="togglePlay"
      />
      <SvgIcon size="25" name="after" class="control-btn" @click="nextSong" />
    </div>
  </div>
</template>

<script setup lang="ts">
import defaultCover from '@renderer/assets/img/default.png'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import { useGlobalStore } from '@renderer/store'
import { useUIStore } from '@renderer/store/ui'

const globalStore = useGlobalStore()
const uiStore = useUIStore()

/** 播放/暂停 */
function togglePlay() {
  if (!globalStore.playMusic) return
  globalStore.togglePlay()
}

/** 上一首 */
function prevSong() {
  globalStore.prevSong()
}

/** 下一首 */
function nextSong() {
  globalStore.nextSong()
}

/** 点击封面打开播放窗口 */
function openPlayWindow() {
  uiStore.playWindow = true
}
</script>

<style scoped lang="less">
.music-player {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  width: 60vw;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--color-bg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);

  padding: 0 15px;
  box-sizing: border-box;
  gap: 20px;

  .info {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .cover-wrapper {
      position: relative;
      width: 50px;
      height: 50px;

      .cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 5px;
        display: block;
        transition: background-image 0.5s;
        transition: var(--transition);
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 5px;
        opacity: 0;
        transition: var(--transition);
        pointer-events: none;
        z-index: 1;
      }

      &:hover::after {
        opacity: 1;
      }
    }

    .text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
      min-width: 0;
      color: var(--color-text);
      .title {
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .artist {
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 30px;

    .control-btn {
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        transform: scale(1.2);
      }

      &:active {
        transform: scale(0.9);
      }
    }
  }
}
</style>
