<template>
  <div class="home">
    <div class="title">
      <MusicHeader
        ref="musicHeaderRef"
        :artDetail="{ cover, artName, albumsNum: albums.length, mode, songsNum: songs.length }"
        @toggle-play="togglePlay"
        @handle-mode="toggleMode"
      />
      <GlobalInput :placeholder="'搜索专辑'" @search="handleSearch" />
    </div>

    <div class="cards" ref="cardsRef">
      <GridCard :songs="albums" v-if="mode === 'grid'" :activeUrl="globalStore.playMusic?.url">
        <template #item="{ item }">
          <div class="music-card" @click="handleAlb(item)">
            <img class="cover" :src="item.cover || defaultBg" alt="cover" />
            <div class="info">
              <div class="title">{{ item.album }}</div>
            </div>
          </div>
        </template>
      </GridCard>

      <ListCard
        :activeUrl="globalStore.playMusic?.url"
        :songs="songs"
        @play="handlePlay"
        v-else
      ></ListCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import defaultBg from '@renderer/assets/img/default.png'
import GlobalInput from '@renderer/components/global-input/index.vue'
import GridCard from '@renderer/components/grid-card/index.vue'
import ListCard from '@renderer/components/list-card/index.vue'
import MusicHeader from '@renderer/components/music-header/index.vue'
import { useGlobalStore } from '@renderer/store'
import { TSong } from '@renderer/types'
import { handleRes } from '@renderer/utils/request'

const albums = ref<any[]>([])
const songs = ref<TSong[]>([])
const loading = ref(false)
const route = useRoute()
const artName = ref('')

const mode = ref<'grid' | 'list'>((localStorage.getItem('viewMode') as any) || 'list')

const globalStore = useGlobalStore()
const toggleMode = () => {
  mode.value = mode.value === 'grid' ? 'list' : 'grid'
  localStorage.setItem('viewMode', mode.value)
}
const togglePlay = () => {
  globalStore.setSong(songs.value[0], songs.value)
}

const handlePlay = (music: TSong) => {
  globalStore.setSong(music, songs.value)
}
const handleSearch = (val: string) => {
  if (val) {
    albums.value = albums.value.filter((item) => {
      const key = val.trim().toLowerCase()
      return item.album?.toLowerCase().includes(key)
    })
    songs.value = songs.value.filter((item) => {
      const key = val.trim().toLowerCase()
      return item.name?.toLowerCase().includes(key)
    })
  } else {
    getData()
  }
}

const router = useRouter()
const handleAlb = (alb: any) => {
  router.push({ name: 'Album', params: { name: alb.album, artist: artName.value } })
}

const getData = () => {
  loading.value = true
  window.api
    .getAlbumsByArtist(artName.value)
    .then((res: any) => {
      if (handleRes(res)) {
        songs.value = res.songs
        albums.value = res.data
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const cover = ref('')
onMounted(() => {
  cover.value = route.params.cover as string
  artName.value = route.params.name as string
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
    overflow-y: auto;
  }
}
</style>
