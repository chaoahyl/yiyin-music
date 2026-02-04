<template>
  <div class="home" ref="homeRef">
    <div class="title">
      <div style="display: flex; justify-content: space-between; width: 100%">
        <h2 style="margin: 0">{{ $t('views.home.title') }}</h2>

        <div>
          <GlobalButtons :buttonList="buttonList"></GlobalButtons>
        </div>
      </div>
      <GlobalInput @search="handleSearch" />
    </div>
    <div class="cards">
      <component
        v-if="musicList.length"
        :is="mode === 'grid' ? GridCard : ListCard"
        ref="cardsRef"
        :songs="musicList"
        :gridItems="5"
        :activeUrl="globalStore.playMusic?.url"
        @play="handlePlay"
      ></component>
      <div v-else class="empty">
        <SvgIcon :name="'add'"></SvgIcon>
        <div>{{ $t('views.home.empty') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ListCard from '@renderer/components/list-card/index.vue'
import GridCard from '@renderer/components/grid-card/index.vue'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import GlobalInput from '@renderer/components/global-input/index.vue'
import GlobalButtons from '@renderer/components/global-buttons/index.vue'
import { handleRes } from '@renderer/utils/request'
import { useGlobalStore } from '@renderer/store'
import { TSong } from '@renderer/types'

const mode = ref<'grid' | 'list'>((localStorage.getItem('homeView') as any) || 'list')

const buttonList = computed(() => [
  {
    icon: mode.value === 'grid' ? 'list' : 'grid',
    label: mode.value === 'grid' ? '列表模式' : '网格模式',
    onClick: toggleMode
  },
  {
    icon: 'location',
    label: '定位',
    onClick: handleLocation
  }
])

const toggleMode = () => {
  mode.value = mode.value === 'grid' ? 'list' : 'grid'
  localStorage.setItem('homeView', mode.value)
}

const cardsRef = ref()
const handleLocation = () => {
  cardsRef.value.location()
}

const musicList = ref<TSong[]>([])

const globalStore = useGlobalStore()

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
    .getMusicList()
    .then((res) => {
      if (handleRes(res)) {
        musicList.value = res.data || []
      }
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
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
    align-items: flex-start;
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
