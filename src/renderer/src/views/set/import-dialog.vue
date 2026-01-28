<template>
  <el-dialog
    v-model="visible"
    append-to-body
    title="曲库同步"
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
          <span class="file-name">{{ progress.file || '正在分析文件结构...' }}</span>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="label">已处理</span>
            <span class="val">{{ progress.current }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="label">总计</span>
            <span class="val">{{ progress.total }}</span>
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
/* 毛玻璃 Dialog 深度样式重写 */
:deep(.el-dialog.premium-glass-dialog) {
  background: rgba(25, 25, 25, 0.6) !important;
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  .el-dialog__header {
    margin: 0;
    padding-top: 25px;
    text-align: center;
    .el-dialog__title {
      color: rgba(255, 255, 255, 0.9);
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

    /* 背景光晕 */
    .ambient-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%);
      filter: blur(20px);
      z-index: 0;
    }

    .progress-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
      z-index: 1;

      circle {
        fill: none;
        stroke-width: 6;
        stroke-linecap: round;
      }

      .track {
        stroke: rgba(255, 255, 255, 0.03);
      }

      .bar {
        stroke-dasharray: 276.46;
        /* 关键：0.3s 的平滑过渡，不会感觉太肉，也不会感觉太突兀 */
        transition: stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        filter: drop-shadow(0 0 5px rgba(52, 211, 153, 0.3));
      }
    }

    .percentage {
      position: absolute;
      top: 55%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;

      .value {
        font-size: 48px;
        font-weight: 800;
        font-family: 'DIN Condensed', 'Arial Black', sans-serif;
        color: #fff;
        line-height: 1;
      }
      .unit {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.4);
        margin-left: 2px;
        text-transform: uppercase;
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
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;

      .pulsing-dot {
        width: 6px;
        height: 6px;
        background: #34d399;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }

      .file-name {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
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
          color: rgba(255, 255, 255, 0.3);
        }
        .val {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
      }

      .stat-divider {
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.05);
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
