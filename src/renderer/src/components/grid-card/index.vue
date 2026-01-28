<template>
  <div class="gird-card">
    <RecycleScroller
      ref="scrollerRef"
      :items="songs"
      :key-field="props.keyField"
      :item-size="computedItemSize"
      :grid-items="props.gridItems"
      class="music-grid"
    >
      <template #default="{ item, index }">
        <slot name="item" :item="item" :index="index">
          <div
            class="music-card"
            @click="onPlay(item)"
            :class="{ active: props.activeUrl === item.url }"
          >
            <div class="cover">
              <SvgIcon size="30" name="playing" class="control-btn" />
              <img :src="item.cover || defaultBg" alt="cover" />
            </div>
            <div class="info">
              <div class="titles">{{ item.title }}</div>
              <div class="artist">
                {{ item.artist }}
              </div>
            </div>
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
import { TSong } from '@renderer/types'

const props = defineProps({
  songs: {
    type: Array as () => any[],
    required: true
  },
  keyField: {
    type: String,
    default: ''
  },
  activeUrl: { type: String, default: '' },
  itemSize: {
    type: Number,
    default: 200
  },
  gridItems: {
    type: Number,
    default: 6
  }
})
const container = ref<HTMLElement | null>(null)

// 响应式计算实际 itemSize
const computedItemSize = ref(props.itemSize)
const updateSize = () => {
  if (container.value) {
    const width = container.value.clientWidth
    computedItemSize.value = Math.floor(width / props.gridItems)
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  // DOM 元素
  container.value = document.querySelector('.gird-card') as HTMLElement

  updateSize()

  // 监听父容器尺寸变化
  resizeObserver = new ResizeObserver(() => updateSize())
  resizeObserver.observe(container.value)

  // 窗口变化监听
  window.addEventListener('resize', updateSize)

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

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSize)
  if (resizeObserver && container.value) {
    resizeObserver.unobserve(container.value)
  }
})

const emits = defineEmits(['play', 'remove'])
const onPlay = (song: TSong) => emits('play', song)

const scrollerRef = ref()
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
