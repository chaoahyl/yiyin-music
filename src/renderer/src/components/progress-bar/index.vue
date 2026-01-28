<template>
  <div class="slider-wrapper" @click="onClick">
    <slot name="before"></slot>

    <div
      class="slider-bar"
      :class="{ playing: props.isPlay }"
      :style="{ height: (props.height ?? 5) + 'px' }"
    >
      <!-- 拖拽显示进度 -->
      <div class="progress-fill" :style="{ width: dragPercent + '%' }"></div>

      <input
        class="ios-slider"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="dragValue"
        @mousedown="onDragStart"
        @touchstart="onDragStart"
        @input="onInput"
        @mouseup="onDragEnd"
        @touchend="onDragEnd"
      />
    </div>

    <slot name="after"></slot>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: number
  min?: number
  max: number
  step?: number
  isPlay?: boolean
  height?: number
}>()

const emit = defineEmits<{
  (e: 'change', val: number): void
}>()

const min = props.min ?? 0
const step = props.step ?? 0.01

// 拖拽状态
const isDragging = ref(false)
const dragValue = ref(props.value)

watch(
  () => props.value,
  (val) => {
    if (!isDragging.value) dragValue.value = val
  }
)

// 拖拽百分比
const dragPercent = computed(() => {
  const range = props.max - min
  return range === 0 ? 0 : ((dragValue.value - min) / range) * 100
})

const onDragStart = () => {
  isDragging.value = true
}

const onDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  const val = dragValue.value
  emit('change', val) // 拖拽结束才触发
}

const onInput = (e: Event) => {
  dragValue.value = Number((e.target as HTMLInputElement).value)
}

const onClick = (e: MouseEvent) => {
  const bar = (e.currentTarget as HTMLDivElement).querySelector('.slider-bar')!
  const rect = bar.getBoundingClientRect()
  const clickPercent = (e.clientX - rect.left) / rect.width
  const value = min + clickPercent * (props.max - min)
  dragValue.value = value
  emit('change', value)
}
</script>

<style scoped lang="less">
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  cursor: pointer;

  .slider-bar {
    cursor: pointer;
    position: relative;
    width: 100%;
    border-radius: 5px;
    background: rgba(var(--track-bg-rgb), 0.4);
    overflow: hidden;
    transition: var(--transition);

    &.playing {
      background: rgba(255, 255, 255, 0.4);
    }
    &:hover {
      background: rgba(255, 255, 255, 0.55);
    }
    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: #fff;
      border-radius: inherit;
      transition: width 0.3s linear;
      &:hover .progress-fill {
        background: #f5f5f5;
      }
    }

    .ios-slider {
      cursor: pointer;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      appearance: none;
      background: transparent;
      outline: none;
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 0;
        height: 0;
      }
    }
  }
}
</style>
