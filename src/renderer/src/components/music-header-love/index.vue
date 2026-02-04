<template>
  <div class="music-header">
    <!-- 左侧封面 -->
    <img class="cover" :src="props.cover || defaultImg" alt="cover" />

    <!-- 右侧信息区 -->
    <div class="info">
      <div class="text-wrap">
        <div class="title">{{ props.title }}</div>
        <div class="sub-title">{{ t('layout.btn.song_num') }} {{ props.songsNum }}</div>
        <GlobalButtons :buttonList="buttonList"></GlobalButtons>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import defaultImg from '@renderer/assets/img/default.png'
import GlobalButtons from '@renderer/components/global-buttons/index.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({
  title: { type: String, default: '--' },
  cover: { type: String, default: '' },
  isMenu: { type: Boolean, default: false },
  songsNum: { type: Number, default: 0 },
  isSelect: { type: Boolean, default: false }
})
const emits = defineEmits(['togglePlay', 'toggleRandom', 'addMusic', 'removeMusic'])

const buttonList = computed(() => [
  {
    icon: 'play',
    label: t('layout.btn.play'),
    onClick: togglePlay
  },
  {
    icon: 'random',
    label: t('layout.btn.random'),
    onClick: toggleRandom
  },
  ...(props.isMenu
    ? [
        {
          icon: 'add',
          label: t('layout.btn.add_song'),
          onClick: addMusic
        },
        {
          icon: 'random',
          label: t('layout.btn.remove_song'),
          onClick: removeMusic
        }
      ]
    : [])
])

const togglePlay = () => emits('togglePlay')
const toggleRandom = () => emits('toggleRandom')
const addMusic = () => emits('addMusic')
const removeMusic = () => emits('removeMusic')
</script>

<style lang="less" scoped>
.music-header {
  display: flex;
  width: 100%;
  height: 30vh;
  min-height: 150px;
  max-height: 260px;
  box-sizing: border-box;
  align-items: center;
  gap: 5%;
  padding: 0 2%;

  .cover {
    width: 25%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 12px;
    transition: var(--transition);
    flex-shrink: 0;
    max-width: 220px;
    min-width: 100px;
    max-height: 100%;
    transition: var(--transition);
    box-shadow: var(--box-shadow-hover);
  }

  .info {
    width: calc(75% - 16px);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;

    .text-wrap {
      display: flex;
      height: 100%;
      flex-direction: column;
      justify-content: space-around;
      align-items: flex-start;
      width: 100%;
      padding: 0 5%;
      overflow: hidden;

      .title {
        font-size: clamp(1.75rem, 2.5vw + 1rem, 2.5rem);
        font-weight: 700;
        color: var(--color-text);
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .sub-title {
        font-size: clamp(1rem, 1.2vw + 0.5rem, 1.125rem);
        font-weight: 400;
        color: #919191;
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .music-header {
    flex-direction: column;
    height: auto;
    padding: 12px;

    .cover {
      width: 50%;
      max-width: 160px;
      margin-bottom: 10px;
    }

    .info {
      width: 100%;
      gap: 6px;
    }
  }
}
</style>
