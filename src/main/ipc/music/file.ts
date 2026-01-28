import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { parseFile } from 'music-metadata'
import pMap from 'p-map'
import os from 'os'
import { createHash } from 'crypto'
import { readMusic, sortListByKey } from './utils'
import logger from '../../logger'

/**
 * 设置音乐文件相关 IPC
 * - 获取音乐列表
 * - 打开音乐目录
 * - 导入音乐文件夹
 * - 修改音乐信息
 * @param port 本地服务端口
 * @param host 本地服务 host
 */
export async function setupFileMusicIpc(port: number, host: string) {
  const userHome = app.getPath('home')
  const LYL_MUSIC_DIR = path.join(userHome, 'yiyin')
  const MUSIC_JSON = path.join(LYL_MUSIC_DIR, 'songs.json')
  const COVER_DIR = path.join(LYL_MUSIC_DIR, 'covers')

  // 确保目录和文件存在
  fs.ensureDirSync(LYL_MUSIC_DIR)
  fs.ensureFileSync(MUSIC_JSON)
  fs.ensureDirSync(COVER_DIR)
  if (fs.readFileSync(MUSIC_JSON, 'utf8').trim() === '') fs.writeJsonSync(MUSIC_JSON, [])

  /** 写入音乐列表到 songs.json */
  async function writeMusic(list: any[]) {
    await fs.writeJson(MUSIC_JSON, list, { spaces: 2 })
  }

  /**
   * 提取歌词信息
   * @param meta 音乐元数据
   * @param ext 文件扩展名
   * @returns 歌词字符串
   */
  function extractLyrics(meta: any, ext: string): string {
    if (!meta || !meta.common) return ''
    const commonLyrics = meta.common.lyrics
      ?.map((l: any) => (typeof l === 'string' ? l : l.text || ''))
      .filter(Boolean)
      .join('\n')
    if (commonLyrics) return commonLyrics

    if (ext === '.mp3') {
      const id3 = meta.native?.['ID3v2.3'] || meta.native?.['ID3v2.4']
      const uslt = id3?.find((f: any) => f.id === 'USLT')
      return uslt ? (typeof uslt.value === 'string' ? uslt.value : uslt.value.text || '') : ''
    } else if (ext === '.flac') {
      const vorbis = meta.native?.vorbis || []
      const tag = vorbis.find((f: any) => ['LYRICS', 'UNSYNCEDLYRICS', 'USLT'].includes(f.id))
      return tag ? (typeof tag.value === 'string' ? tag.value : tag.value.text || '') : ''
    }
    return ''
  }

  /**
   * 提取音乐元数据
   * @param meta 音乐元数据
   * @param file 文件名
   */
  function extractMetadata(meta: any, file: string) {
    const ext = path.extname(file).replace('.', '').toUpperCase()
    const bitrate = meta.format.bitrate ? Math.round(meta.format.bitrate / 1000) : 0
    let audioType = ext
    if (ext === 'MP3' && bitrate) audioType = `MP3 ${bitrate}k`

    return {
      artist: meta.common.artist || '',
      album: meta.common.album || '',
      title: meta.common.title || path.parse(file).name,
      year: meta.common.year || '',
      track: meta.common.track?.no || 0,
      disk: meta.common.disk?.no || 0,
      duration: meta.format.duration || 0,
      bitrate,
      audioType,
      comment: (meta.common.comment || [])
        .map((c: any) => (typeof c === 'string' ? c : c.text || ''))
        .filter(Boolean)
        .join('\n')
    }
  }

  // ===== IPC：获取音乐列表 =====
  ipcMain.handle('get-music-list', async () => {
    let list = await readMusic()
    const baseUrl = `http://${host}:${port}`

    const updatedList = list.map((item) => ({
      ...item,
      url: item.url.startsWith('/') ? `${baseUrl}${item.url}` : item.url,
      cover: item.cover && item.cover.startsWith('/') ? `${baseUrl}${item.cover}` : item.cover
    }))

    const sortedList = sortListByKey(updatedList, 'title')
    return { code: 200, data: sortedList, port }
  })

  // ===== IPC：打开音乐目录 =====
  ipcMain.handle('open-music-folder', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    if (canceled || filePaths.length === 0) return { code: 0, message: '取消选择' }
    return { code: 200, message: '选择成功', path: filePaths[0] }
  })

  // ===== IPC：导入音乐文件夹 =====
  ipcMain.handle('import-music-folder', async (event, folderPath: string) => {
    if (!folderPath || !fs.existsSync(folderPath)) {
      logger.error(`[Import] 尝试导入无效路径: ${folderPath}`)
      return { code: 400, message: '无效路径' }
    }

    /** 递归获取文件夹内音频文件 */
    async function getAudioFiles(
      dir: string,
      baseDir: string
    ): Promise<{ filePath: string; relativePath: string; playlist: string }[]> {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      let files: { filePath: string; relativePath: string; playlist: string }[] = []

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files = files.concat(await getAudioFiles(fullPath, baseDir))
        } else if (/\.(mp3|flac|aac|wav|m4a)$/i.test(entry.name)) {
          const relativePath = path.relative(baseDir, fullPath)
          const playlistName = path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath)
          files.push({ filePath: fullPath, relativePath, playlist: playlistName })
        }
      }
      return files
    }

    const audioFiles = await getAudioFiles(folderPath, folderPath)
    logger.info(`[Import] 扫描完成，共发现音频文件: ${audioFiles.length} 个`)

    const musicList: any[] = []
    const albumCoverMap = new Map<string, string>()

    // 并发读取音频元数据
    await pMap(
      audioFiles,
      async ({ filePath, playlist }, index) => {
        let metadata: any = {}
        let coverUrl = ''
        let lyrics = ''

        try {
          const meta = await parseFile(filePath, { native: true } as any)
          metadata = extractMetadata(meta, path.basename(filePath))
          lyrics = extractLyrics(meta, path.extname(filePath).toLowerCase())

          const albumName = metadata.album || 'unknown'

          // 检查专辑封面是否存在
          let coverName = albumCoverMap.get(albumName)
          if (!coverName && meta.common.picture && meta.common.picture.length > 0) {
            const hash = createHash('md5').update(albumName).digest('hex')
            coverName = `${hash}.jpg`
            const coverPath = path.join(COVER_DIR, coverName)
            await fs.writeFile(coverPath, meta.common.picture[0].data)
            albumCoverMap.set(albumName, coverName)
          }
          if (coverName) {
            coverUrl = `/covers/${encodeURIComponent(coverName)}`
          }
        } catch (err: any) {
          logger.warn(`[Import] 读取元数据失败: ${filePath}, 错误: ${err.message}`)
          console.warn('读取标签失败', filePath, err)
        }

        const stat = await fs.stat(filePath)
        const fileSize = stat.size

        musicList.push({
          ...metadata,
          name: metadata.title,
          url: `/music/${playlist ? encodeURIComponent(playlist) + '/' : ''}${encodeURIComponent(
            path.basename(filePath)
          )}`,
          cover: coverUrl,
          lyrics,
          size: fileSize,
          playlist
        })

        // 发送导入进度
        event.sender.send('import-progress', {
          current: index + 1,
          total: audioFiles.length,
          file: filePath
        })
      },
      { concurrency: Math.min(Math.max(os.cpus().length, 2), 8) }
    )

    await writeMusic(musicList)

    // ===== 自动生成歌单 menus.json =====
    const MUSIC_MENU_JSON = path.join(app.getPath('home'), 'yiyin', 'menus.json')
    const playlistsMap = new Map<string, any[]>()

    musicList.forEach((song) => {
      if (!song.playlist) return
      if (!playlistsMap.has(song.playlist)) playlistsMap.set(song.playlist, [])
      playlistsMap.get(song.playlist)?.push(song)
    })

    const newMenus: any[] = []
    for (const [playlistName, songs] of playlistsMap) {
      newMenus.push({ name: playlistName, songs })
    }

    await fs.writeJson(MUSIC_MENU_JSON, newMenus, { spaces: 2 })
    logger.info(`[Import] --- 导入任务完成 ---`)

    return { code: 200, message: '导入完成', list: musicList, port }
  })

  // ===== IPC：修改音乐信息 =====
  ipcMain.handle(
    'update-music',
    async (_event, { url, updates }: { url: string; updates: Partial<any> }) => {
      const list = await readMusic()
      const index = list.findIndex((item) => item.url === url)
      if (index === -1) return { code: 404, message: '音乐未找到' }

      list[index] = { ...list[index], ...updates }
      await writeMusic(list)
      return { code: 200, message: '修改成功', item: list[index] }
    }
  )
}
