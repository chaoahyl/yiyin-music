import { ipcMain, app } from 'electron'
import fs from 'fs-extra'
import express from 'express'
import path from 'path'
const getPort = require('get-port').default
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import { setupFileMusicIpc } from './file'
import { setupMenuMusicIpc } from './menu'
import { setupArtMusicIpc } from './art'
import os from 'os'
import logger from '../../logger'
import { setupSocketHandlers } from './socket'

/** 获取本地 IPv4 地址 */
function getLocalIP() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '127.0.0.1'
}

/** 解析 public 资源路径，兼容开发/生产环境 */
function resolvePublic(...paths: string[]) {
  const isDev = !app.isPackaged

  if (isDev) {
    return path.join(process.cwd(), 'resources', 'public', ...paths)
  }

  const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'public')
  const packedPath = path.join(process.resourcesPath, 'resources', 'public')

  if (fs.existsSync(unpackedPath)) {
    return path.join(unpackedPath, ...paths)
  }

  return path.join(packedPath, ...paths)
}

/**
 * 初始化音乐服务 IPC
 * - 文件/歌单/艺术家模块
 * - 静态资源服务
 * - Socket 服务
 */
export async function setupMusicIPC(mainWindow: Electron.BrowserWindow) {
  /** ----------------------
   * 1. 初始化目录和文件
   * ---------------------- */
  const userHome = app.getPath('home')
  const LYL_MUSIC_DIR = path.join(userHome, 'yiyin')
  const MUSIC_JSON = path.join(LYL_MUSIC_DIR, 'songs.json')
  const CONFIG_JSON = path.join(LYL_MUSIC_DIR, 'config.json')
  const MUSIC_MENU_JSON = path.join(LYL_MUSIC_DIR, 'menus.json')
  const COVER_DIR = path.join(LYL_MUSIC_DIR, 'covers')

  try {
    fs.ensureDirSync(LYL_MUSIC_DIR)
    fs.ensureFileSync(MUSIC_JSON)
    fs.ensureFileSync(CONFIG_JSON)
    fs.ensureFileSync(MUSIC_MENU_JSON)
    fs.ensureDirSync(COVER_DIR)

    if (fs.readFileSync(MUSIC_JSON, 'utf8').trim() === '') fs.writeJsonSync(MUSIC_JSON, [])
    if (fs.readFileSync(CONFIG_JSON, 'utf8').trim() === '')
      fs.writeJsonSync(CONFIG_JSON, { musicFolder: null })
    if (fs.readFileSync(MUSIC_MENU_JSON, 'utf8').trim() === '')
      fs.writeJsonSync(MUSIC_MENU_JSON, [])

    logger.info(`[Storage] 数据目录初始化成功: ${LYL_MUSIC_DIR}`)
  } catch (err: any) {
    logger.error(`[Storage] 目录初始化失败: ${err.message}`)
  }

  /** ----------------------
   * 2. 启动 Express & Socket 服务
   * ---------------------- */
  const server = express()
  const httpServer = http.createServer(server)
  const io = new Server(httpServer, { cors: { origin: '*' } })

  server.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }))
  server.use(express.static(resolvePublic()))
  setupSocketHandlers(io, server, mainWindow, resolvePublic)

  const port = await getPort({ port: 5201 })
  const host = getLocalIP()

  httpServer.listen(port, '0.0.0.0', () => {
    logger.info(`依音音乐服务启动成功: http://${host}:${port}`)
  })

  /** ----------------------
   * 3. 静态资源映射
   * ---------------------- */
  server.use('/covers', express.static(COVER_DIR))

  server.use('/music', async (req, res, next) => {
    try {
      const config = await fs.readJson(CONFIG_JSON)
      const musicFolderPath = config.musicFolder
      if (!musicFolderPath) {
        logger.warn(`[Server] 音乐目录尚未设置，无法访问音频资源`)
        return res.status(400).send('Music folder not set')
      }
      express.static(path.resolve(musicFolderPath))(req, res, next)
    } catch (e: any) {
      logger.error(`[Server] 音乐文件流访问错误: ${e.message}`)
      next(e)
    }
  })

  /** ----------------------
   * 4. 业务 IPC
   * ---------------------- */
  // 设置音乐目录
  ipcMain.handle('set-music-folder', async (_event, folderPath: string) => {
    if (!folderPath || !fs.existsSync(folderPath)) {
      logger.error(`[Config] 尝试设置无效路径: ${folderPath}`)
      return { code: 400, message: '无效路径' }
    }
    await fs.writeJson(CONFIG_JSON, { musicFolder: folderPath })
    logger.info(`[Config] 音乐目录更新为: ${folderPath}`)
    return { code: 200, message: '音乐目录已设置' }
  })

  // 获取控制二维码链接
  ipcMain.handle('get-code', async (_event) => {
    const url = `http://${host}:${port}`
    logger.info(`[Config] 获取控制二维码链接: ${url}`)
    return { code: 200, data: url }
  })

  /** ----------------------
   * 5. 初始化子模块 IPC
   * ---------------------- */
  setupFileMusicIpc(port, host)
  setupMenuMusicIpc(port, host)
  setupArtMusicIpc(port, host)
  logger.info(`[System] 子模块 (File/Menu/Art) 已全部挂载`)
}
