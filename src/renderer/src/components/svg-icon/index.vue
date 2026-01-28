<template>
  <svg
    class="_svg_icon"
    aria-hidden="true"
    v-if="symbolId"
    :width="computedSize"
    :height="computedSize"
  >
    <use :href="symbolId" :fill="props.color" />
  </svg>
</template>

<script lang="ts" setup>
const props = defineProps({
  prefix: { type: String, default: 'icon' },
  name: { type: String, default: '' },
  color: { type: String, default: '#ffffff' },
  size: { type: [String, Number], default: '1em' } // 支持 px/em/%
})

// 生成 symbol id
const symbolId = computed(() => (props.name ? `#${props.prefix}-${props.name}` : ''))

// 计算最终尺寸，自动加单位
const computedSize = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`
  return props.size
})
</script>

<style scoped>
._svg_icon {
  vertical-align: middle;
  text-align: center;
  flex-shrink: 0;
  display: inline-block;
  transition: var(--transition);
}
</style>
