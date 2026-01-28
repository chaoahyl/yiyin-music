<template>
  <transition name="modal-scale">
    <div v-if="showUpdate" class="update-mask" @click.self="handleMaskClick">
      <div
        class="update-card"
        :class="{
          'is-downloaded': isDownloaded,
          'attention-shake': isShaking
        }"
      >
        <div class="glow-bg"></div>

        <div class="update-inner">
          <div class="header">
            <div class="title-group">
              <span class="badge">遇见新体验</span>
              <h3>新版本现已就绪 · {{ version }}</h3>
            </div>
          </div>

          <div class="content">
            <p v-if="!isDownloaded">我们正在为您打磨更极致的细节，请稍等片刻...</p>
            <p v-else>新功能已准备就绪。重启应用后，即可立即遇见更好的体验。</p>

            <div v-if="progressVisible" class="progress-section">
              <div class="progress-track">
                <div class="progress-bar" :style="{ width: progress + '%' }"></div>
              </div>
              <div class="progress-info">
                <span class="percent-text">已完成 {{ progress.toFixed(1) }}%</span>
                <span class="speed-text">{{ speed }}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="btn-group-left">
              <button class="btn-text" @click="viewChangelog">看看更新了什么</button>
            </div>

            <div class="btn-group-right">
              <template v-if="!isDownloaded">
                <button class="btn-secondary" @click="later">先去听歌</button>
              </template>
              <template v-else>
                <button class="btn-secondary" @click="later">稍后体验</button>
                <button class="btn-primary" @click="install">立即开启</button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showUpdate = ref(false)
const version = ref('')
const progress = ref(0)
const speed = ref('')
const progressVisible = ref(false)
const isDownloaded = ref(false)
const isShaking = ref(false)

onMounted(() => {
  window.api.onUpdateAvailable((info) => {
    version.value = info.version
    showUpdate.value = true
  })

  window.api.onDownloadProgress((progressObj) => {
    progressVisible.value = true
    progress.value = progressObj.percent
    // 将速度展示也变得更友好一点
    speed.value = progressObj.bytesPerSecond
      ? (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2) + ' MB/s'
      : '正在连接...'
  })

  window.api.onUpdateDownloaded((info) => {
    version.value = info.version
    isDownloaded.value = true
    progressVisible.value = false
    showUpdate.value = true
  })
})

const install = () => window.api.sendUpdateAction('install')
const later = () => {
  showUpdate.value = false
  window.api.sendUpdateAction('later')
}
const viewChangelog = () => window.api.sendUpdateAction('view-changelog')

const handleMaskClick = () => {
  if (isShaking.value) return
  isShaking.value = true
  setTimeout(() => (isShaking.value = false), 400)
}
</script>

<style scoped>
/* 引用您之前确认的 modal-scale 动效及样式 */
.update-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.update-card {
  position: relative;
  width: 440px; /* 稍微加宽一点让文字呼吸感更好 */
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  color: var(--color-text);
  transform-origin: center center;
}

.glow-bg {
  position: absolute;
  top: -120px;
  left: -120px;
  width: 320px;
  height: 320px;
  background: var(--main-gradient);
  filter: blur(70px);
  opacity: 0.12;
  pointer-events: none;
}

.update-inner {
  position: relative;
  padding: 36px;
  z-index: 1;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.badge {
  display: inline-block;
  padding: 4px 14px;
  font-size: 10px;
  font-weight: 800;
  border-radius: 20px;
  background: var(--main-gradient);
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: 1.5px;
}
.header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.content {
  text-align: center;
}
.content p {
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.8;
  margin-bottom: 28px;
}

.progress-section {
  background: var(--color-set-bg);
  padding: 20px;
  border-radius: 16px;
}
.progress-track {
  height: 6px;
  background: rgba(var(--color-rgb-dark), 0.08);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}
.progress-bar {
  height: 100%;
  background: var(--main-gradient);
  border-radius: 4px;
  transition: width 0.4s ease;
  position: relative;
  overflow: hidden;
}
/* 扫光动画 */
.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite linear;
}
@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-family: monospace;
  opacity: 0.6;
}

/* ====================== 5. 按钮部分（高级感优化） ====================== */
.footer {
  margin-top: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-group-right {
  display: flex;
  gap: 14px;
}

/* 基础按钮转换设置 */
.btn-primary,
.btn-secondary,
.btn-text {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

/* 立即开启：主按钮 */
.btn-primary {
  background: var(--main-gradient);
  color: white;
  border: none;
  padding: 10px 26px;
  border-radius: var(--border-radius-base);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  /* 增加一个柔和的阴影 */
  box-shadow: 0 4px 12px rgba(var(--color-rgb-main), 0.2);
}

.btn-primary:hover {
  /* 移除位移，改为光感和阴影增强 */
  filter: brightness(1.15);
  box-shadow: 0 6px 20px rgba(var(--color-rgb-main), 0.35);
}

.btn-primary:active {
  filter: brightness(0.95);
  transform: scale(0.98); /* 极轻微的点击下沉感，比位移更高级 */
}

/* 稍后体验：次要按钮 */
.btn-secondary {
  /* 使用透明背景配合边框，显得更轻盈 */
  background: rgba(var(--color-rgb-text), 0.05);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 9px 22px;
  border-radius: var(--border-radius-base);
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary:hover {
  /* 悬停时稍微加深背景透明度，而不是改变位移 */
  background: rgba(var(--color-rgb-text), 0.12);
  border-color: rgba(var(--color-rgb-text), 0.2);
}

.btn-secondary:active {
  background: rgba(var(--color-rgb-text), 0.18);
  transform: scale(0.98);
}

/* 更新日志：文字按钮 */
.btn-text {
  background: transparent;
  border: none;
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.5;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
}

.btn-text:hover {
  opacity: 1;
  background: rgba(var(--color-rgb-text), 0.05); /* 文字按钮也加上淡淡的底色 */
}

/* 动效 */
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: opacity 0.3s ease;
}
.modal-scale-enter-active .update-card,
.modal-scale-leave-active .update-card {
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}
.modal-scale-enter-from {
  opacity: 0;
}
.modal-scale-enter-from .update-card {
  transform: scale(0.95);
  opacity: 0;
}
.modal-scale-leave-to {
  opacity: 0;
}
.modal-scale-leave-to .update-card {
  transform: scale(1.02);
  opacity: 0;
}

.attention-shake {
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}
</style>
