<template>
  <el-dialog
    v-model="visible"
    append-to-body
    :title="$t('views.set.import_dialog.title')"
    width="400px"
    :show-close="false"
    :close-on-click-modal="false"
    class="premium-glass-dialog"
  >
    <div class="glass-content">
      <div class="progress-container">
        <div class="ambient-glow"></div>

        <svg class="progress-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#34d399" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle class="track" cx="50" cy="50" r="44" />

          <circle
            class="bar"
            cx="50"
            cy="50"
            r="44"
            stroke="url(#progress-gradient)"
            :style="{ strokeDashoffset: dashOffset }"
          />
        </svg>

        <div class="percentage">
          <span class="value">{{ progress.percent }}</span>
          <span class="unit">%</span>
        </div>
      </div>

      <div class="details-panel">
        <div class="file-info-row">
          <div class="pulsing-dot"></div>
          <span class="file-name">{{
            progress.file || $t('views.set.import_dialog.analysis')
          }}</span>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="label">已处理</span>
            <span class="val">{{ $t('views.set.import_dialog.current') }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="label">总计</span>
            <span class="val">{{ $t('views.set.import_dialog.total') }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  progress: {
    current: number
    total: number
    file: string
    percent: number
  }
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/**
 * 解决 100% 跳跃感的关键：
 * 使用 276.46 (2 * PI * 44) 作为基数，并确保过渡平滑
 */
const dashOffset = computed(() => {
  const circumference = 2 * Math.PI * 44
  const p = Math.max(0, Math.min(100, props.progress.percent))
  return circumference - (circumference * p) / 100
})
</script>

<style scoped lang="less">
:deep(.el-dialog.premium-glass-dialog) {
  background: var(--color-bg) !important;
  backdrop-filter: blur(15px) saturate(160%);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--box-shadow-hover);
  overflow: hidden;

  /* 适配 filter-mode 的特殊处理 */
  html.filter-mode & {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
  }

  .el-dialog__header {
    margin: 0;
    padding-top: 25px;
    text-align: center;
    .el-dialog__title {
      color: var(--color-text);
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }
}

.glass-content {
  padding: 10px 0 30px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .progress-container {
    position: relative;
    width: 200px;
    height: 200px;
    margin-bottom: 20px;

    /* 背景光晕：使用全局主色调渐变 */
    .ambient-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 140px;
      height: 140px;
      background: var(--main-gradient);
      filter: blur(40px);
      opacity: 0.15;
      z-index: 0;
    }

    .progress-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;

      circle {
        fill: none;
        stroke-width: 6;
        stroke-linecap: round;
      }

      .track {
        /* 使用边框色作为轨道背景 */
        stroke: var(--color-border);
        opacity: 0.5;
      }

      .bar {
        stroke-dasharray: 276.46;
        transition: stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        /* 移除硬编码颜色，改用 SVG 定义的渐变（引用 template 里的 linearGradient） */
      }
    }

    .percentage {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;

      .value {
        font-size: 48px;
        font-weight: 800;
        font-family: 'DIN Condensed', 'Arial Black', sans-serif;
        color: var(--color-text);
        line-height: 1;
      }
      .unit {
        font-size: 14px;
        color: var(--color-text);
        opacity: 0.5;
        margin-left: 2px;
      }
    }
  }

  .details-panel {
    width: 85%;

    .file-info-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      padding: 8px 16px;
      background: var(--color-bg-hover);
      border-radius: var(--border-radius-base);

      .pulsing-dot {
        width: 6px;
        height: 6px;
        background: #34d399; /* 保持进度绿色作为状态点 */
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }

      .file-name {
        font-size: 13px;
        color: var(--color-text);
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 240px;
      }
    }

    .stats-row {
      display: flex;
      justify-content: space-evenly;
      align-items: center;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-text);
          opacity: 0.4;
        }
        .val {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
        }
      }

      .stat-divider {
        width: 1px;
        height: 20px;
        background: var(--color-border);
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
