/**
 * 依音本地播放器 - 云端遥控脚本（完整版）
 * 功能：
 * - 封面流体背景
 * - 毛玻璃 info 面板
 * - 进度条/音量条拖拽逻辑
 * - 播放模式切换
 * - 主题切换
 */

const socket = io()

// --- 全局状态 ---
let lastTitle = ''
let currentPlayMode = 'sequence'
let isDraggingProgress = false
let isDraggingVolume = false

// --- DOM 元素 ---
const coverImg = document.getElementById('coverImg')
const fallback = document.getElementById('coverFallback')
const albumArt = document.querySelector('.album-art')
const titleEl = document.getElementById('curTitle')
const artistEl = document.getElementById('curArtist')
const app = document.getElementById('playerApp')
const playIcon = document.getElementById('svg-play')
const pauseIcon = document.getElementById('svg-pause')
const progressFill = document.getElementById('progressFill')
const currentTimeEl = document.getElementById('currentTime')
const totalTimeEl = document.getElementById('totalTime')
const coverBg = document.getElementById('coverBg')

// --- 工具函数 ---
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function sendCmd(cmd, val) {
  socket.emit('control', cmd, val)
}

function updateBarUI(type, percentage) {
  const percentStr = percentage * 100 + '%'
  const fill = document.getElementById(type + 'Fill')
  if (fill) fill.style.width = percentStr
}

// --- 滑动逻辑封装 ---
function initSlider(id, onMove, onStateChange, onEnd) {
  const el = document.getElementById(id)
  if (!el) return
  let currentPercent = 0

  const handleMove = (e) => {
    const rect = el.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const position = clientX - rect.left
    currentPercent = Math.max(0, Math.min(1, position / rect.width))
    onMove(currentPercent)
  }

  const start = (e) => {
    onStateChange(true)
    el.setAttribute('data-dragging', 'true')
    handleMove(e)
  }

  const end = () => {
    if (el.getAttribute('data-dragging') === 'true') {
      onStateChange(false)
      el.setAttribute('data-dragging', 'false')
      if (onEnd) onEnd(currentPercent)
    }
  }

  // 移动端
  el.addEventListener('touchstart', (e) => start(e), { passive: false })
  window.addEventListener(
    'touchmove',
    (e) => {
      if (el.getAttribute('data-dragging') === 'true') {
        handleMove(e)
        e.preventDefault()
      }
    },
    { passive: false }
  )
  window.addEventListener('touchend', end)

  // 桌面端
  el.addEventListener('mousedown', start)
  window.addEventListener('mousemove', (e) => {
    if (el.getAttribute('data-dragging') === 'true') handleMove(e)
  })
  window.addEventListener('mouseup', end)
}

// --- 核心业务逻辑 ---
socket.on('player-status-update', (data) => {
  const newTitle = data.title || '准备就绪'
  const newArtist = data.artist || '等待播放中'

  // 1️⃣ 切歌动效
  if (newTitle !== lastTitle) {
    titleEl.style.opacity = '0'
    artistEl.style.opacity = '0'
    albumArt.classList.add('album-switching')
    setTimeout(() => {
      titleEl.innerText = newTitle
      artistEl.innerText = newArtist

      if (data.cover) {
        // --- 优化背景闪变逻辑 ---
        const tempImg = new Image()
        tempImg.src = data.cover

        // 等图片加载完再淡入，防止白屏
        tempImg.onload = () => {
          coverBg.style.opacity = '0' // 1. 先变透明

          setTimeout(() => {
            coverBg.style.backgroundImage = `url('${data.cover}')`
            coverBg.style.opacity = '1' // 2. 换图后变回不透明
          }, 200) // 这个时间对应透明度消失的过程
        }

        coverImg.src = data.cover
        coverImg.style.display = 'block'
        fallback.style.display = 'none'
      } else {
        coverBg.style.opacity = '0'
        coverImg.style.display = 'none'
        fallback.style.display = 'block'
        setTimeout(() => {
          coverBg.style.backgroundImage = 'none'
        }, 200)
      }

      titleEl.style.opacity = '1'
      artistEl.style.opacity = '1'
      albumArt.classList.remove('album-switching')
    }, 250)
    lastTitle = newTitle
  }

  // 2️⃣ 播放状态
  if (data.isPlaying) {
    playIcon.style.display = 'none'
    pauseIcon.style.display = 'block'
    app.classList.add('is-playing')
  } else {
    playIcon.style.display = 'block'
    pauseIcon.style.display = 'none'
    app.classList.remove('is-playing')
  }

  // 3️⃣ 进度条更新（未拖动时）
  if (!isDraggingProgress && data.duration > 0) {
    const percent = data.currentTime / data.duration
    updateBarUI('progress', percent)
    currentTimeEl.innerText = formatTime(data.currentTime)
    totalTimeEl.innerText = formatTime(data.duration)
  }

  // 4️⃣ 音量更新（未拖动时）
  if (!isDraggingVolume && data.volume !== undefined) {
    updateBarUI('volume', data.volume)
  }

  // 5️⃣ 播放模式
  if (data.playMode) {
    currentPlayMode = data.playMode
    document.getElementById('modeRandom').classList.toggle('active', data.playMode === 'random')
    document
      .getElementById('modeLoop')
      .classList.toggle('active', ['loop', 'single'].includes(data.playMode))
  }
})

// --- 初始化滑块 ---
initSlider(
  'progressClickArea',
  (percent) => updateBarUI('progress', percent),
  (dragging) => {
    isDraggingProgress = dragging
  },
  (finalPercent) => sendCmd('seek', finalPercent)
)

initSlider(
  'volumeClickArea',
  (percent) => updateBarUI('volume', percent),
  (dragging) => {
    isDraggingVolume = dragging
  },
  (finalPercent) => sendCmd('volume', finalPercent)
)

// 快捷设置音量
function quickSetVolume(val) {
  updateBarUI('volume', val)
  sendCmd('volume', val)
}

// 播放模式切换
function handleModeClick(targetMode) {
  let finalMode = currentPlayMode === targetMode ? 'sequence' : targetMode
  sendCmd('mode', finalMode)
}

// 主题切换
function toggleTheme() {
  const htmlEl = document.documentElement
  const isDark = htmlEl.getAttribute('data-theme') === 'dark'
  if (isDark) {
    htmlEl.removeAttribute('data-theme')
    document.getElementById('themeIcon').className = 'fa-solid fa-moon'
    localStorage.setItem('theme', 'light')
  } else {
    htmlEl.setAttribute('data-theme', 'dark')
    document.getElementById('themeIcon').className = 'fa-solid fa-sun'
    localStorage.setItem('theme', 'dark')
  }
}

// 页面初始化读取主题
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.getElementById('themeIcon').className = 'fa-solid fa-sun'
  }
})
