<template>
  <div class="right-panel">
    <ListCard :songs="globalStore.playList" :activeUrl="globalStore.playMusic?.url">
      <template #item="{ item }">
        <div
          class="music-item"
          :class="{ active: globalStore.playMusic?.url === item.url }"
          @click="handlePlay(item)"
        >
          <div class="cover">
            <SvgIcon size="20" name="playing" class="control-btn" />
            <img :src="item.cover || defaultBg" alt="封面" />
          </div>
          <div class="info">
            <div class="title">{{ item.name }}</div>
            <div class="artist-album">{{ item.artist }} - {{ item.album }}</div>
          </div>
          <div class="duration">{{ formatDuration(item.duration) }}</div>
        </div>
      </template>
    </ListCard>
  </div>
</template>

<script setup lang="ts">
import defaultBg from '@renderer/assets/img/default.png'
import ListCard from '@renderer/components/list-card/index.vue'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import { formatDuration } from '@renderer/utils/music'
import { useGlobalStore } from '@renderer/store'
import { TSong } from '@renderer/types'
const globalStore = useGlobalStore()

const handlePlay = (music: TSong) => {
  globalStore.setSong(music, globalStore.playList)
}
</script>

<style scoped lang="less">
.right-panel {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  overflow-y: auto;
  .music-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 60px;
    padding: 10px 15px;
    cursor: pointer;
    transition: var(--transition);
    color: rgba(255, 255, 255, 0.5);

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .cover {
      width: 55px;
      height: 55px;
      border-radius: 5px;
      position: relative;
      overflow: hidden;
      flex: 0 0 55px;
      .control-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
        transition: all 0.25s ease;
        z-index: 5;
        pointer-events: none;
        color: #ffffff;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        border-radius: 5px;
        transition: transform 0.3s ease;
      }
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 5px;
        background: rgba(0, 0, 0, 0.35);
        opacity: 0;
        transition: opacity 0.25s ease;
        pointer-events: none;
        z-index: 2;
      }
    }

    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;

      .title {
        color: #ffffff;
        font-size: 16px;
      }

      .artist-album {
        color: #ffffff;
        font-size: 14px;
      }
    }

    .duration {
      width: 60px;
      font-size: 14px;
    }
    &.active {
      .cover {
        img {
          transform: scale(1.05);
        }
        .control-btn {
          opacity: 1;
          animation: pulseIcon 1.6s ease-in-out infinite;
        }
        &::after {
          opacity: 1;
        }
      }
    }
  }
} /* 🌟 呼吸放大缩小动画 */
@keyframes pulseIcon {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.25);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
