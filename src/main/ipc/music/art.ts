import { ipcMain } from 'electron'
import { readMusic, sortListByKey } from './utils'

/**
 * 设置艺术家、专辑、歌曲相关 IPC
 * - 提供获取艺术家列表、专辑列表、指定专辑歌曲功能
 * @param port 本地服务端口
 * @param host 本地服务 host
 */
export async function setupArtMusicIpc(port: number, host: string) {
  /**
   * 拆分艺术家名称，支持多种分隔符
   * @param artistStr 原始艺术家字符串
   * @returns 艺术家数组
   */
  function splitArtists(artistStr: string) {
    if (!artistStr) return []
    const regex = /\s*(?:&|、|\/|,|and)\s*/i
    return artistStr
      .split(regex)
      .map((a) => a.trim())
      .filter(Boolean)
  }

  /**
   * 格式化媒体 URL
   * - 如果路径以 `/` 开头，则自动加上 baseUrl
   * @param path 封面或音乐路径
   * @returns 完整 URL
   */
  function formatMediaUrl(path?: string) {
    const baseUrl = `http://${host}:${port}`
    if (!path) return ''
    return path.startsWith('/') ? `${baseUrl}${path}` : path
  }

  // ===== IPC：获取所有艺术家 =====
  ipcMain.handle('get-all-artists', async () => {
    const musicList = await readMusic()
    const artistSet = new Set<string>()

    // 收集所有艺术家
    musicList.forEach((item) => {
      splitArtists(item.artist).forEach((a) => artistSet.add(a))
    })

    // 构建艺术家信息，包括封面
    let artists = Array.from(artistSet).map((artist) => {
      const found = musicList.find((m) => splitArtists(m.artist).includes(artist))
      return {
        artist,
        cover: formatMediaUrl(found?.cover)
      }
    })

    // 按艺术家名排序
    artists = sortListByKey(artists, 'artist')
    return { code: 200, data: artists, port }
  })

  // ===== IPC：根据艺术家获取专辑和歌曲列表 =====
  ipcMain.handle('get-albums-by-artist', async (_event, artistName: string) => {
    if (!artistName) return { code: 400, data: [], songs: [], message: '缺少 artistName 参数' }

    const musicList = await readMusic()

    // 获取该艺术家的所有歌曲
    let artistSongs = musicList
      .filter((item) => splitArtists(item.artist).includes(artistName))
      .map((item) => ({
        ...item,
        url: formatMediaUrl(item.url),
        cover: formatMediaUrl(item.cover)
      }))
    artistSongs = sortListByKey(artistSongs, 'title')

    // 获取该艺术家的所有专辑及封面
    const albumMap = new Map<string, string>()
    musicList
      .filter((item) => splitArtists(item.artist).includes(artistName) && item.album)
      .forEach((item) => {
        if (!albumMap.has(item.album)) albumMap.set(item.album, item.cover || '')
      })

    let albums = Array.from(albumMap.entries()).map(([album, cover]) => ({
      album,
      cover: formatMediaUrl(cover)
    }))
    albums = sortListByKey(albums, 'album')

    return { code: 200, data: albums, songs: artistSongs, port }
  })

  // ===== IPC：获取指定艺术家 + 指定专辑的歌曲列表 =====
  ipcMain.handle(
    'get-songs-by-artist-album',
    async (_event, artistName: string, albumName: string) => {
      if (!artistName || !albumName)
        return { code: 400, data: [], message: '缺少 artistName 或 albumName 参数' }

      let songs = (await readMusic())
        .filter(
          (item) => splitArtists(item.artist).includes(artistName) && item.album === albumName
        )
        .map((item) => ({
          ...item,
          url: formatMediaUrl(item.url),
          cover: formatMediaUrl(item.cover)
        }))

      songs = sortListByKey(songs, 'title')
      return { code: 200, data: songs, port }
    }
  )
}
