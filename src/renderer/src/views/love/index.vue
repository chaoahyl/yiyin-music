<template>
  <div class="home">
    <div class="title">
      <MusicHeader
        ref="musicHeaderRef"
        :cover="songs[0]?.cover"
        :songsNum="songs?.length"
        :title="t('views.love.my_love')"
        @togglePlay="togglePlay"
        @toggleRandom="toggleRandom"
      />
      <GlobalInput :placeholder="t('views.love.search_placeholder')" @search="handleSearch" />
    </div>

    <div class="cards" ref="cardsRef">
      <ListCard
        v-if="songs.length > 0"
        :songs="songs"
        :activeUrl="globalStore.playMusic?.url"
        :isSelect="isSelect"
        @play="handlePlay"
        @select="handleSelect"
      />
      <div v-else class="empty">
        <SvgIcon :name="'add'"></SvgIcon>
        <div>{{ t('views.love.love_empty') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'

import SvgIcon from '@renderer/components/svg-icon/index.vue'
import MusicHeader from '@renderer/components/music-header-love/index.vue'
import GlobalInput from '@renderer/components/global-input/index.vue'
import ListCard from '@renderer/components/list-card/index.vue'
import { useGlobalStore } from '@renderer/store'
import { TSong } from '@renderer/types'

const { t } = useI18n()

const songs = ref<TSong[]>([])
const route = useRoute()
const menuName = ref('')

const globalStore = useGlobalStore()

const togglePlay = () => {
  if (songs.value.length > 0) {
    globalStore.setPlayMode('sequence')
    globalStore.setSong(songs.value[0], songs.value)
  } else {
    ElNotification({
      title: t('views.love.love_empty'),
      type: 'warning',
      position: 'bottom-right'
    })
  }
}

const toggleRandom = () => {
  if (songs.value.length > 0) {
    globalStore.setPlayMode('random')
    const randomIndex = Math.floor(Math.random() * songs.value.length)
    globalStore.setSong(songs.value[randomIndex], songs.value)
  } else {
    ElNotification({
      title: t('views.love.love_empty'),
      type: 'warning',
      position: 'bottom-right'
    })
  }
}

const handleSearch = (val: string) => {
  if (val) {
    const key = val.trim().toLowerCase()
    songs.value = songs.value.filter(
      (item) =>
        item.name?.toLowerCase().includes(key) ||
        item.artist?.toLowerCase().includes(key) ||
        item.album?.toLowerCase().includes(key)
    )
  } else {
    getData()
  }
}

const isSelect = ref(false)
const selectedMusic = ref<TSong[]>([])
const handleSelect = (music: TSong[]) => {
  selectedMusic.value = music
}

const getData = () => {
  songs.value = globalStore.loveList
}

const handlePlay = (music: TSong) => {
  globalStore.setSong(music, songs.value)
}

onMounted(() => {
  menuName.value = route.params.name as string
  getData()
})
</script>

<style lang="less" scoped>
.home {
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
    align-items: center;
    gap: 20px;
  }

  .cards {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
  }
}
</style>
