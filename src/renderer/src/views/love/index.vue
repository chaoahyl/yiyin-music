<template>
  <div class="home">
    <div class="title">
      <MusicHeader
        ref="musicHeaderRef"
        :cover="songs[0]?.cover"
        :songsNum="songs?.length"
        :title="'我的收藏'"
        @togglePlay="togglePlay"
        @toggleRandom="toggleRandom"
      />
      <GlobalInput @search="handleSearch" />
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
        <div>你还没有收藏的歌曲 快去添加你喜欢的音乐吧！</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus'

import SvgIcon from '@renderer/components/svg-icon/index.vue'
import MusicHeader from '@renderer/components/music-header-love/index.vue'
import GlobalInput from '@renderer/components/global-input/index.vue'
import ListCard from '@renderer/components/list-card/index.vue'
import { useGlobalStore } from '@renderer/store'
import { TSong } from '@renderer/types'

const songs = ref<TSong[]>([])
const route = useRoute()
const menuName = ref('')

const globalStore = useGlobalStore()
const togglePlay = () => {
  if (songs.value.length > 0) {
    globalStore.setPlayMode('sequence')
    const randomIndex = Math.floor(Math.random() * songs.value.length)
    globalStore.setSong(songs.value[randomIndex], songs.value)
  } else {
    ElNotification({ title: '暂无收藏歌曲', type: 'warning', position: 'bottom-right' })
  }
}

const toggleRandom = () => {
  if (songs.value.length > 0) {
    globalStore.setPlayMode('random')
    const randomIndex = Math.floor(Math.random() * songs.value.length)
    globalStore.setSong(songs.value[randomIndex], songs.value)
  } else {
    ElNotification({ title: '暂无收藏歌曲', type: 'warning', position: 'bottom-right' })
  }
}
const handleSearch = (val: string) => {
  if (val) {
    songs.value = songs.value.filter((item) => {
      const key = val.trim().toLowerCase()
      return (
        item.name?.toLowerCase().includes(key) ||
        item.artist?.toLowerCase().includes(key) ||
        item.album?.toLowerCase().includes(key)
      )
    })
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
  }
}
</style>
