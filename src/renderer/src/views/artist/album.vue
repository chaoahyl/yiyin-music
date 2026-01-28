<template>
  <div class="home">
    <div class="title">
      <MusicHeader
        ref="musicHeaderRef"
        :cover="musicList[0]?.cover"
        :songsNum="musicList?.length"
        :title="albName || '全部歌曲'"
        @togglePlay="togglePlay"
        @toggleRandom="toggleRandom"
      />
      <GlobalInput @search="handleSearch" />
    </div>
    <div class="cards">
      <ListCard
        ref="cardsRef"
        :songs="musicList"
        :activeUrl="globalStore.playMusic?.url"
        @play="handlePlay"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MusicHeader from '@renderer/components/music-header-love/index.vue'
import ListCard from '@renderer/components/list-card/index.vue'
import GlobalInput from '@renderer/components/global-input/index.vue'
import { handleRes } from '@renderer/utils/request'
import { useGlobalStore } from '@renderer/store'
import { TSong } from '@renderer/types'

const musicList = ref<TSong[]>([])

const globalStore = useGlobalStore()
const togglePlay = () => {
  if (musicList.value.length > 0) {
    globalStore.setPlayMode('sequence')
    const randomIndex = Math.floor(Math.random() * musicList.value.length)
    globalStore.setSong(musicList.value[randomIndex], musicList.value)
  }
}

const toggleRandom = () => {
  if (musicList.value.length > 0) {
    globalStore.setPlayMode('random')
    const randomIndex = Math.floor(Math.random() * musicList.value.length)
    globalStore.setSong(musicList.value[randomIndex], musicList.value)
  }
}
const handleSearch = (val: string) => {
  if (val) {
    musicList.value = musicList.value.filter((item) => {
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

const handlePlay = (music: TSong) => {
  globalStore.setSong(music, musicList.value)
}

const loading = ref(false)
const getData = () => {
  loading.value = true
  window.api
    .getSongsByArtistAlbum(artName.value, albName.value)
    .then((res) => {
      if (handleRes(res)) {
        musicList.value = res.data || []
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const artName = ref('')
const albName = ref('')
const route = useRoute()
onMounted(() => {
  artName.value = route.params.artist as string
  albName.value = route.params.name as string
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
  }
}
</style>
