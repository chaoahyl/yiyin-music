import { Server } from 'socket.io'
import { ipcMain } from 'electron'
import { Express } from 'express'
import logger from '../../logger'

/**
 * 设置 Socket 连接和处理逻辑
 * - 挂载手机端控制页面路由
 * - 监听 Socket.io 连接及控制指令
 * - IPC 事件同步给所有已连接的手机端
 *
 * @param io Socket.io 服务实例
 * @param server Express 服务实例
 * @param mainWindow Electron 主窗口
 * @param resolvePublic 用于解析静态资源路径
 */
export function setupSocketHandlers(
  io: Server,
  server: Express,
  mainWindow: Electron.BrowserWindow,
  resolvePublic: (...paths: string[]) => string
) {
  /** --------------------------
   * 1. 挂载手机端页面路由
   * -------------------------- */
  server.get('/', (_req, res) => {
    res.sendFile(resolvePublic('phone.html'))
  })

  /** --------------------------
   * 2. Socket.io 连接处理
   * -------------------------- */
  io.on('connection', (socket) => {
    logger.info(`[Socket] 遥控端已连接 (ID: ${socket.id})`)

    // 监听来自手机端的控制指令
    socket.on('control', (command, val) => {
      if (!mainWindow.isDestroyed()) {
        // 转发指令给 Electron 主窗口渲染层
        mainWindow.webContents.send('mobile-control', command, val)
        logger.info(`[Control] 收到遥控指令: [${command}] 参数: ${val || '无'}`)
      }
    })

    // 断开连接日志
    socket.on('disconnect', () => {
      logger.info(`[Socket] 遥控端断开连接`)
    })
  })

  /** --------------------------
   * 3. IPC 同步播放状态给手机端
   * -------------------------- */
  ipcMain.on('sync-player-status', (_event, status) => {
    // 向所有已连接手机端广播播放状态
    io.emit('player-status-update', status)
  })
}
