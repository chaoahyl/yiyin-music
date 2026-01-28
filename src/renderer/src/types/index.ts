//歌曲
export type TSong = {
  artist: string
  album: string
  title: string
  year: number | string
  track: number
  disk: number
  duration: number
  bitrate: number
  audioType: string
  comment: string
  name: string
  url: string
  cover: string
  lyrics: string
  size: number
}

//歌单
export type TPlayList = {
  name: string
  musicList: TSong[]
}

//专辑
export type TAlbum = { album: string; cover: string }

//艺术家
export type TArt = { artist: string; cover: string }
