<template>
  <div class="left-panel">
    <img
      v-if="globalStore.playMusic?.cover"
      class="cover"
      :key="globalStore.playMusic?.url"
      :src="globalStore.playMusic?.cover"
      :class="{ paused: !globalStore.isPlaying }"
    />

    <div class="song-info">
      <div class="info">
        <Transition name="fade-slide" mode="out-in">
          <div :key="globalStore.playMusic?.url" class="title" :title="globalStore.playMusic?.name">
            {{ globalStore.playMusic?.name || '未播放' }}
          </div>
        </Transition>

        <Transition name="fade-slide" mode="out-in">
          <div
            :key="globalStore.playMusic?.artist"
            class="artist"
            :title="globalStore.playMusic?.artist"
            @click="handleToArt"
          >
            {{ globalStore.playMusic?.artist || '' }}
          </div>
        </Transition>
      </div>
      <SvgIcon
        size="30"
        :name="isLoved ? 'lovefill' : 'love'"
        class="control-btn"
        @click="globalStore.toggleLove(globalStore.playMusic as TSong)"
      />
      <SvgIcon size="30" name="more" class="control-btn" @click="openUpdate" />
    </div>
    <div class="control-panel">
      <div class="progress-wrapper">
        <ProgressBar
          :value="globalStore.playTime"
          :isPlay="true"
          :max="globalStore.playMusic?.duration || 0"
          @change="globalStore.seek"
        />
        <div class="time-wrapper">
          <span class="time">{{ formatTime(globalStore.playTime) }}</span>
          <span class="type">{{ globalStore.playMusic?.audioType }}</span>
          <span class="time">{{ formatTime(globalStore.playMusic?.duration || 0) }}</span>
        </div>
      </div>

      <div class="controls">
        <SvgIcon
          size="25"
          name="random"
          class="control-btn"
          :class="{ active: globalStore.playMode === 'random' }"
          @click="toggleRandom"
        />
        <SvgIcon size="25" name="before" class="control-btn" @click="prevSong" />
        <SvgIcon
          size="25"
          :name="globalStore.isPlaying ? 'pause' : 'play'"
          class="control-btn"
          @click="togglePlay"
        />
        <SvgIcon size="25" name="after" class="control-btn" @click="nextSong" />
        <SvgIcon
          size="25"
          name="loop"
          class="control-btn"
          :class="{ active: globalStore.playMode === 'loop' }"
          @click="toggleLoop"
        />
      </div>

      <div class="extra-controls">
        <SvgIcon size="25" :name="'silent'" class="control-btn" @click="muteVolume" />
        <ProgressBar
          :value="globalStore.playVolume"
          :isPlay="true"
          :max="1"
          :step="0.01"
          @change="globalStore.setVolume"
        />

        <SvgIcon size="25" :name="'sound'" class="control-btn" @click="maxVolume" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import ProgressBar from '@renderer/components/progress-bar/index.vue'
import { formatTime } from '@renderer/utils/music'
import { useGlobalStore } from '@renderer/store'
import { useUIStore } from '@renderer/store/ui'
import { TSong } from '@renderer/types'

const globalStore = useGlobalStore()
const uiStore = useUIStore()

const emits = defineEmits(['openUpdate'])

const openUpdate = () => {
  emits('openUpdate')
}

const isLoved = computed(() => {
  const song = globalStore.playMusic
  if (!song) return false
  return globalStore.loveList.some((s) => s.url === song.url && s.name === song.name)
})

const router = useRouter()
const handleToArt = () => {
  uiStore.playWindow = false
  router.push({ name: 'ArtistDetail', params: { name: globalStore.playMusic?.artist } })
}

function togglePlay() {
  if (!globalStore.playMusic) return
  globalStore.togglePlay()
}

function prevSong() {
  globalStore.prevSong()
}
function nextSong() {
  globalStore.nextSong()
}
function toggleRandom() {
  if (globalStore.playMode === 'random') {
    globalStore.setPlayMode('sequence') // 已经是随机 → 切换顺序
  } else {
    globalStore.setPlayMode('random')
  }
}

function toggleLoop() {
  if (globalStore.playMode === 'loop') {
    globalStore.setPlayMode('sequence') // 已经是单曲循环 → 切换顺序
  } else {
    globalStore.setPlayMode('loop')
  }
}

const prevVolume = ref(1)
function muteVolume() {
  if (globalStore.playVolume > 0) {
    prevVolume.value = globalStore.playVolume
    globalStore.setVolume(0)
  }
}
function maxVolume() {
  prevVolume.value = globalStore.playVolume
  globalStore.setVolume(1)
}
</script>
<style lang="less" scoped>
.left-panel {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5%;
  gap: 20px;
  justify-content: center;
  position: relative;
  color: #ffffff;
  .close-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    cursor: pointer;
    transition: var(--transition);

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(0.9);
    }
  }

  .cover {
    width: 65%;
    aspect-ratio: 1 / 1; /* 保持正方形 */
    object-fit: cover;
    border-radius: 10px;
    display: block;
    transition: background-image 0.5s;
    transition: var(--transition);
    box-shadow: var(--box-shadow-light);
    &.paused {
      transform: scale(0.8);
    }

    &:not(.paused) {
      transform: scale(1);
    }
  }

  .song-info {
    width: 65%;
    height: 15%;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;

    .info {
      width: 60%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;

      .title {
        font-size: 3.5vh;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .artist {
        font-size: 2.5vh;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

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
  .control-panel {
    width: 65%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3.5vh;

    .extra-controls {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      flex: 1;

      select {
        width: 60px;
      }
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

    .controls {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;

      .control-btn {
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
    .progress-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 5px;
      flex: 1;

      .time-wrapper {
        width: 65%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex: 1;

        .type {
          font-size: 1.5vh;
          background: rgba(255, 255, 255, 0.3);
          padding: 5px;
          border-radius: 5px;
          font-weight: bold;
        }

        .time {
          font-size: 2.5vh;
          font-weight: bold;
          text-align: center;
        }
      }
    }
  }
}
</style>
