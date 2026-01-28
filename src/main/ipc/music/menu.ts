import { ipcMain, app } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import { sortListByKey } from './utils'

/**
 * 音乐歌单相关 IPC
 * - 获取/创建/删除歌单
 * - 向歌单批量添加/移除歌曲
 * - 重命名歌单
 * @param port 本地服务端口
 * @param host 本地服务 host
 */
export async function setupMenuMusicIpc(port: number, host: string) {
  const MUSIC_MENU_JSON = path.join(app.getPath('home'), 'yiyin', 'menus.json')

  /** 拼接 URL，如果路径以 / 开头则加上 baseUrl */
  function formatMediaUrl(path?: string) {
    const baseUrl = `http://${host}:${port}`
    if (!path) return ''
    return path.startsWith('/') ? `${baseUrl}${path}` : path
  }

  /** 格式化歌单数据，将 songs 中的 url 和 cover 拼接完整 URL */
  function formatMenuData(menu: any) {
    if (!menu || !Array.isArray(menu.songs)) return menu
    return {
      ...menu,
      songs: menu.songs.map((song: any) => ({
        ...song,
        url: formatMediaUrl(song.url),
        cover: formatMediaUrl(song.cover)
      }))
    }
  }

  // 确保菜单 JSON 文件存在
  if (!fs.existsSync(MUSIC_MENU_JSON)) {
    fs.writeJsonSync(MUSIC_MENU_JSON, [])
  }

  /** 读取歌单列表 */
  async function readMenus() {
    try {
      return await fs.readJson(MUSIC_MENU_JSON)
    } catch {
      return []
    }
  }

  /** 写入歌单列表 */
  async function writeMenus(menus: any[]) {
    await fs.writeJson(MUSIC_MENU_JSON, menus, { spaces: 2 })
  }

  // ===== IPC：获取全部歌单 =====
  ipcMain.handle('get-music-menu', async () => {
    const menus = await readMenus()
    const formattedData = menus.map((m: any) => formatMenuData(m))
    const sortedData = sortListByKey(formattedData, 'name')
    return { code: 200, data: sortedData }
  })

  // ===== IPC：创建歌单 =====
  ipcMain.handle('create-music-menu', async (_event, menuName: string) => {
    const menus = await readMenus()
    if (menus.some((m: any) => m.name === menuName)) {
      return { code: 400, message: '歌单已存在' }
    }
    const newMenu = { name: menuName, songs: [] }
    menus.push(newMenu)
    await writeMenus(menus)
    return { code: 200, message: '歌单创建成功', data: newMenu }
  })

  // ===== IPC：向歌单批量添加歌曲 =====
  ipcMain.handle('add-to-music-menu', async (_event, menuName: string, songs: any[]) => {
    const menus = await readMenus()
    const target = menus.find((m: any) => m.name === menuName)
    if (!target) return { code: 404, message: '歌单不存在' }

    const addedSongs: any[] = []
    const skippedSongs: any[] = []

    songs.forEach((song) => {
      if (target.songs.some((s: any) => s.url === song.url)) {
        skippedSongs.push(song)
      } else {
        target.songs.push(song)
        addedSongs.push(song)
      }
    })

    await writeMenus(menus)
    return {
      code: 200,
      message: '批量添加完成',
      data: formatMenuData(target),
      added: addedSongs,
      skipped: skippedSongs
    }
  })

  // ===== IPC：从歌单批量移除歌曲 =====
  ipcMain.handle(
    'remove-from-music-menu',
    async (_event, menuName: string, songsToRemove: any[]) => {
      const menus = await readMenus()
      const target = menus.find((m: any) => m.name === menuName)
      if (!target) return { code: 404, message: '歌单不存在' }

      const removedSongs: any[] = []
      const notFoundSongs: any[] = []

      const urlsToRemove = songsToRemove.map((s) => s.url)
      urlsToRemove.forEach((url) => {
        const index = target.songs.findIndex((s: any) => s.url === url)
        if (index === -1) {
          notFoundSongs.push(url)
        } else {
          removedSongs.push(target.songs[index])
          target.songs.splice(index, 1)
        }
      })

      await writeMenus(menus)
      return {
        code: 200,
        message: '批量移除完成',
        data: target,
        removed: removedSongs,
        notFound: notFoundSongs
      }
    }
  )

  // ===== IPC：删除整个歌单 =====
  ipcMain.handle('delete-music-menu', async (_event, menuName: string) => {
    const menus = await readMenus()
    const index = menus.findIndex((m: any) => m.name === menuName)
    if (index === -1) return { code: 404, message: '歌单不存在' }

    menus.splice(index, 1)
    await writeMenus(menus)
    return { code: 200, message: '歌单已删除', data: menus }
  })

  // ===== IPC：重命名歌单 =====
  ipcMain.handle('rename-music-menu', async (_event, oldName: string, newName: string) => {
    const menus = await readMenus()
    const target = menus.find((m: any) => m.name === oldName)
    if (!target) return { code: 404, message: '原歌单不存在' }

    if (menus.some((m: any) => m.name === newName)) {
      return { code: 400, message: '目标名称已存在' }
    }

    target.name = newName
    await writeMenus(menus)
    return { code: 200, message: '歌单重命名成功', data: formatMenuData(target) }
  })

  // ===== IPC：获取单个歌单详情 =====
  ipcMain.handle('get-single-music-menu', async (_event, menuName: string) => {
    const menus = await readMenus()
    const target = menus.find((m: any) => m.name === menuName)
    if (!target) return { code: 404, message: '歌单不存在' }
    return { code: 200, data: formatMenuData(target) }
  })
}
