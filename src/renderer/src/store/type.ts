import { TSong } from '@renderer/types'

export type TGlobalSore = {
  playHistory: number[]
  historyIndex: number
  lastSaveTime: number
  playMusic: TSong | null
  playList: TSong[]
  playIndex: number
  playVolume: number
  playbackRate: number
  playTime: number
  isPlaying: boolean
  playMode: 'sequence' | 'random' | 'loop'
  loveList: TSong[]
  audio: HTMLAudioElement | null
  _onEnded: (() => void) | null
  _onTimeUpdate: (() => void) | null
}
