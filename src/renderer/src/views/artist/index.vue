<template>
  <div class="home" ref="homeRef">
    <div class="title">
      <h2 style="margin: 0">{{ t('views.artist.artist_title') }}</h2>
      <GlobalInput :placeholder="t('views.artist.search_artist')" @search="handleSearch" />
    </div>

    <div class="cards" ref="cardsRef">
      <GridCard :gridItems="4" :songs="artList" v-if="artList.length">
        <template #item="{ item }">
          <div class="music-card art" @click="handleArt(item)">
            <img class="cover" :src="item.cover || defaultBg" alt="cover" />
            <div class="titles">{{ item.artist }}</div>
          </div>
        </template>
      </GridCard>
      <div v-else class="empty">
        <SvgIcon :name="'add'"></SvgIcon>
        <div>{{ t('views.artist.artist_empty') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import defaultBg from '@renderer/assets/img/default.png'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import GlobalInput from '@renderer/components/global-input/index.vue'
import GridCard from '@renderer/components/grid-card/index.vue'
import { TArt } from '@renderer/types'
import { handleRes } from '@renderer/utils/request'

const { t } = useI18n()

const artList = ref<TArt[]>([])
const loading = ref(false)
const router = useRouter()

const getData = () => {
  loading.value = true
  window.api
    .getAllArtists()
    .then((res) => {
      if (handleRes(res)) {
        artList.value = res.data || []
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const handleSearch = (val: string) => {
  if (val) {
    const key = val.trim().toLowerCase()
    artList.value = artList.value.filter((item) => item.artist?.toLowerCase().includes(key))
  } else {
    getData()
  }
}

const handleArt = (art: TArt) => {
  router.push({ name: 'ArtistDetail', params: { name: art.artist, cover: art.cover } })
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

  .create-menu {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-end;
  }

  .cards {
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    overflow-y: auto;
  }
}
</style>
