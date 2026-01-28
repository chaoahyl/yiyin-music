<template>
  <el-dialog
    append-to-body
    v-model="dialogVisible"
    :close-on-click-modal="false"
    title="选择歌曲"
    width="60%"
  >
    <div style="height: 50vh">
      <ListCard :songs="musicList">
        <template #item="{ item }">
          <div
            class="music-item"
            :class="{
              disabled: songs.some((s) => s.url === item.url),
              selected: selectedSongs.includes(item.url)
            }"
            @click="toggleSelect(item)"
          >
            <el-checkbox
              style="zoom: 200%"
              :model-value="selectedSongs.includes(item.url)"
              :disabled="songs.some((s) => s.url === item.url)"
              @change="toggleSelect(item)"
              @click.stop
            />
            <img :src="item.cover || defaultBg" alt="封面" class="cover" />
            <div class="info">
              <div class="title">{{ item.name }}</div>
              <div class="artist-album">{{ item.artist }} - {{ item.album }}</div>
            </div>
            <div class="duration">{{ formatDuration(item.duration) }}</div>
          </div>
        </template>
      </ListCard>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'

import defaultBg from '@renderer/assets/img/default.png'
import ListCard from '@renderer/components/list-card/index.vue'
import { formatDuration } from '@renderer/utils/music'
import { handleRes } from '@renderer/utils/request'
import { TSong } from '@renderer/types'

const dialogVisible = ref(false)
const menuName = ref('')
const selectedSongs = ref<string[]>([])
const songs = ref<TSong[]>([])
const musicList = ref<any[]>([])
const emits = defineEmits(['refresh'])

const openDialog = (name: string) => {
  menuName.value = name
  dialogVisible.value = true
  getData()
}

const getData = () => {
  window.api.getMusicList().then((res: any) => {
    if (handleRes(res)) {
      const port = res.port
      musicList.value = (res.data || []).map((item: any) => {
        try {
          const urlObj = new URL(item.url)
          const coverObj = new URL(item.cover)
          urlObj.port = port.toString()
          coverObj.port = port.toString()
          return { ...item, url: urlObj.toString(), cover: coverObj.toString() }
        } catch (err) {
          return item
        }
      })
    }
  })

  window.api.getMenuDetail(menuName.value).then((res: any) => {
    if (handleRes(res)) {
      songs.value = res.data?.songs || []
    }
  })
}

const toggleSelect = (song: any) => {
  // 已在歌单的歌曲禁止选择
  if (songs.value.some((s) => s.url === song.url)) return

  const newSelected = [...selectedSongs.value]
  const index = newSelected.indexOf(song.url)
  if (index === -1) newSelected.push(song.url)
  else newSelected.splice(index, 1)

  selectedSongs.value = newSelected
}

const handleConfirm = () => {
  const musicData = JSON.parse(
    JSON.stringify(selectedSongs.value.map((url) => musicList.value.find((s) => s.url === url)))
  )
  window.api.addSong(menuName.value, musicData).then((res) => {
    if (handleRes(res)) {
      ElMessage.success('添加成功')
      emits('refresh')
      dialogVisible.value = false
    }
  })
}

defineExpose({
  openDialog
})
</script>

<style lang="less" scoped>
.music-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 60px;
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition);

  &:hover {
    background-color: var(--color-bg-hover);
  }

  &.selected:not(.disabled) {
    background-color: rgba(64, 158, 255, 0.1);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    &:hover {
      background-color: inherit;
      transform: none;
    }
  }

  .cover {
    width: 55px;
    height: 55px;
    border-radius: 5px;
    object-fit: cover;
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;

    .title {
      font-size: 16px;
    }

    .artist-album {
      font-size: 14px;
    }
  }

  .duration {
    width: 60px;
    font-size: 14px;
  }
}
</style>
