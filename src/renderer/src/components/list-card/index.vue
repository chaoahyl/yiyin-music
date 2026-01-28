<template>
  <div class="list-card">
    <RecycleScroller
      ref="scrollerRef"
      :items="props.songs"
      :item-size="80"
      key-field="url"
      class="music-list"
    >
      <template #default="{ item, index }">
        <slot name="item" :item="item" :index="index" :isActive="props.activeUrl === item.url">
          <div
            class="music-item"
            :class="{ active: props.activeUrl === item.url }"
            @click="onSelect(item)"
          >
            <transition name="slide-fade">
              <el-checkbox
                style="zoom: 200%"
                v-if="props.isSelect"
                :model-value="isSelected(item)"
                @update:model-value="() => toggleSelect(item)"
                @click.stop
              />
            </transition>

            <div class="cover">
              <SvgIcon size="20" name="playing" class="control-btn" />
              <img :src="item.cover || defaultBg" alt="封面" />
            </div>
            <div class="info">
              <div class="title">{{ item.name }}</div>
              <div class="artist-album">{{ item.artist }} - {{ item.album }}</div>
            </div>
            <div class="duration">{{ formatDuration(item.duration) }}</div>
          </div>
        </slot>
      </template>
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import defaultBg from '@renderer/assets/img/default.png'
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import { formatDuration } from '@renderer/utils/music'
import { TSong } from '@renderer/types'

const props = defineProps({
  songs: { type: Array as () => TSong[], required: true },
  activeUrl: { type: String, default: '' },
  isSelect: { type: Boolean, default: false }
})

const emits = defineEmits(['play', 'select'])

const selectedSongs = ref<TSong[]>([])
const scrollerRef = ref<InstanceType<typeof RecycleScroller> | null>(null)

// 判断是否已选中
const isSelected = (song: TSong) => {
  return selectedSongs.value.some((s) => s.url === song.url)
}

// 切换选择状态
const toggleSelect = (song: TSong) => {
  const index = selectedSongs.value.findIndex((s) => s.url === song.url)
  if (index >= 0) {
    selectedSongs.value.splice(index, 1)
  } else {
    selectedSongs.value.push(song)
  }
  emits('select', selectedSongs.value)
}

// 点击整行
const onSelect = (song: TSong) => {
  if (props.isSelect) {
    toggleSelect(song)
  } else {
    emits('play', song)
  }
}

// 自动滚动到当前播放项
watch(
  () => props.activeUrl,
  async (newUrl, oldUrl) => {
    if (!newUrl || newUrl === oldUrl || !props.songs.length) return
    const index = props.songs.findIndex((s) => s.url === newUrl)
    if (index === -1) return
    await nextTick()
    scrollerRef.value?.scrollToItem(index)
  }
)

onMounted(async () => {
  if (!props.activeUrl || !props.songs.length) return
  const index = props.songs.findIndex((s) => s.url === props.activeUrl)
  if (index === -1) return
  await nextTick()
  requestAnimationFrame(() => {
    scrollerRef.value?.scrollToItem(index)
  })
  requestAnimationFrame(() => {
    const el = document.querySelectorAll('.music-item')
    el.forEach((e, i) => {
      ;(e as HTMLElement).style.animationDelay = `${i * 40}ms`
    })
  })
})

const location = async () => {
  const index = props.songs.findIndex((s) => s.url === props.activeUrl)
  if (index === -1) return
  await nextTick()
  scrollerRef.value?.scrollToItem(index)
}

defineExpose({
  location
})
</script>
