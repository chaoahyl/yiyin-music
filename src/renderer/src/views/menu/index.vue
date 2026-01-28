<template>
  <div class="home" ref="homeRef">
    <div class="title">
      <h2 style="margin: 0">我的歌单</h2>
      <GlobalInput :placeholder="'搜索歌单'" @search="handleSearch" />
    </div>

    <!-- 新建歌单 -->
    <div class="create-menu">
      <GlobalButtons :buttonList="buttonList"></GlobalButtons>
    </div>

    <div class="cards" ref="cardsRef">
      <GridCard
        v-if="musicMenuList.length"
        :keyField="'name'"
        :gridItems="5"
        :songs="musicMenuList"
      >
        <template #item="{ item }">
          <div class="music-card" @click="handleMenu(item)">
            <img class="cover" :src="item?.songs[0]?.cover || defaultBg" alt="cover" />
            <div class="info">
              <div class="titles">{{ item.name }}</div>
            </div>
            <div class="action" v-if="isSelect" @click.stop="handleRemoveMenu(item)">
              <SvgIcon size="20" name="remove" />
            </div>
          </div>
        </template>
      </GridCard>
      <div v-else class="empty">
        <SvgIcon :name="'add'"></SvgIcon>
        <div>歌单里还没有歌曲 快去添加你喜欢的音乐吧！</div>
      </div>
    </div>

    <MenuDialog ref="menuDialogRef" @refresh="getData"></MenuDialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import defaultBg from '@renderer/assets/img/default.png'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import GlobalInput from '@renderer/components/global-input/index.vue'
import GridCard from '@renderer/components/grid-card/index.vue'
import GlobalButtons from '@renderer/components/global-buttons/index.vue'
import { TPlayList } from '@renderer/types'
import { handleRes } from '@renderer/utils/request'

import MenuDialog from './menu-dialog.vue'

const buttonList = computed(() => [
  {
    icon: 'add',
    label: '新建歌单',
    onClick: createMenu
  },
  {
    icon: 'remove',
    label: '删除歌单',
    onClick: removeMenu
  }
])

const musicMenuList = ref<TPlayList[]>([])
const loading = ref(false)
const router = useRouter()

const isSelect = ref(false)
const getData = () => {
  loading.value = true
  window.api
    .getAllMenus()
    .then((res) => {
      if (handleRes(res)) {
        musicMenuList.value = res.data || []
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const handleSearch = (val: string) => {
  if (val) {
    musicMenuList.value = musicMenuList.value.filter((item) => {
      const key = val.trim().toLowerCase()
      return item.name?.toLowerCase().includes(key)
    })
  } else {
    getData()
  }
}

const menuDialogRef = ref()
const createMenu = async () => {
  menuDialogRef.value.openDialog()
}

const removeMenu = () => {
  isSelect.value = !isSelect.value
}

const handleMenu = (menu: TPlayList) => {
  if (isSelect.value) return
  router.push({ name: 'MenuDetail', params: { name: menu.name } })
}

const handleRemoveMenu = (menu: TPlayList) => {
  ElMessageBox.confirm('确定删除歌单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(() => {
      window.api
        .deleteMenu(menu.name)
        .then((res) => {
          if (handleRes(res)) {
            getData()
          }
        })
        .finally(() => {
          loading.value = false
        })
    })
    .catch(() => {})
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
