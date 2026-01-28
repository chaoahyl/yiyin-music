<template>
  <div class="light-overlay">
    <div
      class="btn"
      :style="{ ...btn.style }"
      v-for="(btn, index) in props.buttonList"
      :key="index"
      @click="btn.onClick"
    >
      <SvgIcon :size="btn.size || 20" :name="btn.icon" />
      <span>{{ btn.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '@renderer/components/svg-icon/index.vue'

const props = defineProps({
  buttonList: {
    type: Array as () => any[],
    required: true,
    default: () => []
  }
})
</script>

<style lang="less" scoped>
.light-overlay {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 100px;
    padding: 12px 16px;
    border-radius: 12px;
    font-weight: 500;
    color: var(--color-text);
    font-size: 15px;
    letter-spacing: 0.3px;
    background: var(--sidebar-item-hover-bg);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover {
      background: var(--sidebar-item-active-bg);
    }
    span {
      font-size: 15px;
      user-select: none;
    }
  }
}
</style>
