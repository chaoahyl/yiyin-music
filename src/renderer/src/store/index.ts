import { defineStore } from 'pinia'
import type { TGlobalSore } from './type'
import { TSong } from '@renderer/types'

export type PlayMode = 'sequence' | 'random' | 'loop'

const favorite = import.meta.env.VITE_APP_FAVORITE
const current = import.meta.env.VITE_APP_CURRENT
const volumeKey = import.meta.env.VITE_APP_VOLUME

export const useGlobalStore = defineStore('global', {
  state: (): TGlobalSore => {
    const savedPlay = JSON.parse(localStorage.getItem(current) || 'null')
    const savedTime = Number(localStorage.getItem(current + '_time') || 0)
    const savedVolume = Number(localStorage.getItem(volumeKey))
    return {
      lastSaveTime: 0,
      playMusic: savedPlay?.song || null,
      playList: savedPlay?.playList || [],
      playIndex: savedPlay?.index || 0,
      playVolume: isNaN(savedVolume) ? 1 : savedVolume,
      playbackRate: 1,
      playTime: savedTime || 0,
      isPlaying: false,
      playMode: savedPlay?.playMode || 'sequence',
      loveList: JSON.parse(localStorage.getItem(favorite) || '[]'),
      audio: null,
      _onEnded: null,
      _onTimeUpdate: null,
      playHistory: [] as number[],
      historyIndex: -1
    }
  },

  actions: {
    initMobileListener() {
      // 先完全移除之前的所有监听器
      window.electron.ipcRenderer.removeAllListeners('mobile-control')

      const mobileControlHandler = (_event: any, command: string, val?: any) => {
        switch (command) {
          case 'mode':
            if (val === 'sequence') this.setPlayMode('sequence')
            if (val === 'random') this.setPlayMode('random')
            if (val === 'loop') this.setPlayMode('loop')
            break
          case 'next':
            this.nextSong()
            break
          case 'prev':
            this.prevSong()
            break
          case 'toggle':
            this.togglePlay()
            break
          case 'volume':
            this.setVolume(val)
            break
          case 'seek':
            if (this.audio) {
              const duration = this.audio.duration
              if (duration > 0) {
                const targetTime = val * duration
                this.audio.currentTime = targetTime
                this.playTime = targetTime
                this.saveCurrentPlay()
              }
            }
            break
        }
      }

      window.electron.ipcRenderer.on('mobile-control', mobileControlHandler)
    },

    /** 初始化 audio 并绑定一次事件 */
    initAudio(songUrl?: string) {
      if (!this.audio) {
        this.audio = new Audio(songUrl || '')
        this.audio.volume = this.playVolume
        this.audio.playbackRate = this.playbackRate

        // 命名函数便于解绑
        this._onEnded = () => this.nextSong()
        this._onTimeUpdate = () => {
          this.playTime = this.audio!.currentTime
          const now = Date.now()
          if (now - this.lastSaveTime >= 1000) {
            this.lastSaveTime = now
            localStorage.setItem(current + '_time', String(this.playTime))
            this.saveCurrentPlay()
          }
        }

        this.audio.addEventListener('ended', this._onEnded)
        this.audio.addEventListener('timeupdate', this._onTimeUpdate)
      } else if (songUrl) {
        if (this.audio) {
          this.audio.pause()
          this.audio.currentTime = 0

          // 先断开旧资源
          this.audio.src = ''
          this.audio.load()

          // 再设置新资源
          this.audio.src = songUrl
          this.audio.play()
        }
      }
    },

    initPlay() {
      if (this.playMusic && !this.audio) {
        this.initAudio(this.playMusic.url)
      }
      this.initMobileListener()
    },

    getSyncPlayerStatus() {
      window.api.syncPlayerStatus({
        title: this.playMusic?.name || this.playMusic?.title,
        artist: this.playMusic?.artist || '未知艺术家',
        isPlaying: this.isPlaying,
        volume: this.playVolume,
        playMode: this.playMode,
        currentTime: this.playTime,
        url: this.playMusic?.url,
        cover: this.playMusic?.cover,
        duration: this.audio?.duration || 0
      })
    },

    addLove(song: TSong) {
      if (!song) return
      if (this.loveList.find((s) => s.url === song.url && s.name === song.name)) return
      this.loveList.push(song)
      localStorage.setItem(favorite, JSON.stringify(this.loveList))
    },
    removeLove(song: TSong) {
      this.loveList = this.loveList.filter((s) => !(s.url === song.url && s.name === song.name))
      localStorage.setItem(favorite, JSON.stringify(this.loveList))
    },
    toggleLove(song: TSong) {
      const exists = this.loveList.find((s) => s.url === song.url && s.name === song.name)
      exists ? this.removeLove(song) : this.addLove(song)
    },

    /** 播放控制 */
    play() {
      if (!this.audio || this.isPlaying) return
      this.audio.play()
      this.isPlaying = true
      this.saveCurrentPlay()
    },
    pause() {
      if (!this.audio || !this.isPlaying) return
      this.audio.pause()
      this.isPlaying = false
      this.saveCurrentPlay()
    },
    togglePlay() {
      if (!this.audio) return
      if (this.isPlaying) this.pause()
      else this.play()
    },
    seek(time: number) {
      if (!this.audio) return
      this.audio.currentTime = time
      this.playTime = time
      this.saveCurrentPlay()
    },
    setVolume(volume: number) {
      this.playVolume = Math.min(Math.max(volume, 0), 1)
      if (this.audio) this.audio.volume = this.playVolume
      localStorage.setItem(volumeKey, String(this.playVolume))
    },
    setPlaybackRate(rate: number) {
      this.playbackRate = rate
      if (this.audio) this.audio.playbackRate = rate
    },
    setPlayMode(mode: PlayMode) {
      this.playMode = mode
      this.saveCurrentPlay()
    },

    /** 切歌逻辑：复用 audio 对象 */
    async setSong(song: TSong, list: TSong[]) {
      if (!song || !list.length) return

      const newIndex = list.findIndex((s) => s.url === song.url && s.name === song.name)
      this.playMusic = song
      this.playList = list
      this.playIndex = newIndex
      this.playTime = 0
      this.isPlaying = true

      this.initAudio(song.url)
      this.audio?.play()

      this.saveCurrentPlay()
    },

    nextSong() {
      if (!this.playList.length || !this.audio) return
      let nextIndex = this.playIndex
      switch (this.playMode) {
        case 'sequence':
          nextIndex = (this.playIndex + 1) % this.playList.length
          this.addToHistory(nextIndex)
          break
        case 'random':
          if (this.historyIndex < this.playHistory.length - 1) {
            this.historyIndex++
            nextIndex = this.playHistory[this.historyIndex]
          } else {
            const available = this.playList.map((_, i) => i).filter((i) => i !== this.playIndex)
            nextIndex = available[Math.floor(Math.random() * available.length)]
            this.addToHistory(nextIndex)
          }
          break
        case 'loop':
          this.audio.currentTime = 0
          if (!this.isPlaying) this.audio.play()
          return
      }
      this.setSong(this.playList[nextIndex], this.playList)
    },
    prevSong() {
      if (!this.playList.length || !this.audio) return
      let prevIndex = this.playIndex
      switch (this.playMode) {
        case 'sequence':
          prevIndex = (this.playIndex - 1 + this.playList.length) % this.playList.length
          this.addToHistory(prevIndex)
          break
        case 'random':
          if (this.historyIndex > 0) {
            this.historyIndex--
            prevIndex = this.playHistory[this.historyIndex]
          } else {
            const available = this.playList.map((_, i) => i).filter((i) => i !== this.playIndex)
            prevIndex = available[Math.floor(Math.random() * available.length)]
            this.addToHistory(prevIndex)
          }
          break
        case 'loop':
          this.audio.currentTime = 0
          if (!this.isPlaying) this.audio.play()
          return
      }
      this.setSong(this.playList[prevIndex], this.playList)
    },

    addToHistory(index: number) {
      if (this.historyIndex === this.playHistory.length - 1 || this.playHistory.length === 0) {
        this.playHistory.push(index)
        this.historyIndex = this.playHistory.length - 1
      } else {
        this.playHistory = this.playHistory.slice(0, this.historyIndex + 1)
        this.playHistory.push(index)
        this.historyIndex++
      }
      if (this.playHistory.length > 100) {
        const excess = this.playHistory.length - 100
        this.playHistory = this.playHistory.slice(excess)
        this.historyIndex -= excess
        if (this.historyIndex < 0) this.historyIndex = 0
      }
    },
    resetHistory() {
      this.playHistory = []
      this.historyIndex = -1
    },

    updateTimeLoop() {
      if (!this.audio) return
      this.playTime = this.audio.currentTime
      const now = Date.now()
      if (now - this.lastSaveTime >= 1000) {
        this.lastSaveTime = now
        localStorage.setItem(current + '_time', String(this.playTime))
        this.saveCurrentPlay()
      }
    },

    saveCurrentPlay() {
      if (!this.playMusic || !this.playList.length) return
      localStorage.setItem(current + '_time', String(this.playTime))
      localStorage.setItem(
        current,
        JSON.stringify({
          song: this.playMusic,
          playList: this.playList,
          index: this.playIndex,
          isPlaying: this.isPlaying,
          playMode: this.playMode
        })
      )
      this.getSyncPlayerStatus()
    },

    resetAll() {
      // 清理 IPC 监听器
      try {
        window.electron.ipcRenderer.removeAllListeners('mobile-control')
      } catch (e) {
        console.warn('移除 IPC 监听器失败', e)
      }

      // 清理 Audio 对象和事件监听器
      if (this.audio) {
        try {
          this.audio.pause()
          if (this._onEnded) {
            this.audio.removeEventListener('ended', this._onEnded)
          }
          if (this._onTimeUpdate) {
            this.audio.removeEventListener('timeupdate', this._onTimeUpdate)
          }
          this.audio.src = ''
          this.audio.load()
        } catch (e) {
          console.warn('卸载 audio 失败', e)
        }
        this.audio = null
        this._onEnded = null
        this._onTimeUpdate = null
      }

      this.playMusic = null
      this.playList = []
      this.playIndex = 0
      this.playVolume = 1
      this.playbackRate = 1
      this.playTime = 0
      this.isPlaying = false
      this.playMode = 'sequence'
      this.loveList = []

      this.playHistory = []
      this.historyIndex = -1
    }
  }
})
