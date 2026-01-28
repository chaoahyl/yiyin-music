<template>
  <div class="home">
    <div class="title">
      <MusicHeader
        ref="musicHeaderRef"
        :isMenu="true"
        :isSelect="isSelect"
        :title="menuName"
        :cover="songs[0]?.cover"
        :songsNum="songs?.length"
        @addMusic="addMusic"
        @removeMusic="removeMusic"
        @togglePlay="togglePlay"
        @toggleRandom="toggleRandom"
      />
      <GlobalInput @search="handleSearch" />
    </div>

    <div class="cards" ref="cardsRef">
      <ListCard
        v-if="songs.length"
        :songs="songs"
        :activeUrl="globalStore.playMusic?.url"
        :isSelect="isSelect"
        @play="handlePlay"
        @select="handleSelect"
      />
      <div v-else class="empty">
        <SvgIcon :name="'add'"></SvgIcon>
        <div>歌单里还没有歌曲 快去添加你喜欢的音乐吧！</div>
      </div>
    </div>
    <MusicDialog ref="musicDialogRef" @refresh="getData" />
  </div>
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus'

import GlobalInput from '@renderer/components/global-input/index.vue'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import ListCard from '@renderer/components/list-card/index.vue'
import MusicHeader from '@renderer/components/music-header-love/index.vue'
import { useGlobalStore } from '@renderer/store'
import { handleRes } from '@renderer/utils/request'
import { TSong } from '@renderer/types'

import MusicDialog from './music-dialog.vue'

const songs = ref<TSong[]>([])
const loading = ref(false)
const route = useRoute()
const menuName = ref('')

const globalStore = useGlobalStore()

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
  loading.value = true
  window.api
    .getMenuDetail(menuName.value)
    .then((res) => {
      if (handleRes(res)) {
        const data = res.data || {}
        songs.value = data.songs || []
      }
    })
    .finally(() => {
      loading.value = false
    })
}
const handlePlay = (music: TSong) => {
  globalStore.setSong(music, songs.value)
}
onMounted(() => {
  menuName.value = route.params.name as string
  getData()
})

const togglePlay = () => {
  if (songs.value.length > 0) {
    globalStore.setPlayMode('sequence')
    globalStore.setSong(songs.value[0], songs.value)
  } else {
    ElNotification({ title: '歌单为空', type: 'warning', position: 'bottom-right' })
  }
}

const toggleRandom = () => {
  if (songs.value.length > 0) {
    globalStore.setPlayMode('random')
    const randomIndex = Math.floor(Math.random() * songs.value.length)
    globalStore.setSong(songs.value[randomIndex], songs.value)
  } else {
    ElNotification({ title: '歌单为空', type: 'warning', position: 'bottom-right' })
  }
}
const musicDialogRef = ref()
const addMusic = () => {
  musicDialogRef.value?.openDialog(menuName.value)
}

const removeMusic = () => {
  if (isSelect.value && selectedMusic.value.length > 0) {
    const d = JSON.parse(JSON.stringify(selectedMusic.value))
    window.api.removeSong(menuName.value, d).then((res) => {
      if (handleRes(res)) {
        getData()
      }
    })
  } else {
    isSelect.value = !isSelect.value
  }
}
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
    overflow-y: auto;
  }
}
</style>
