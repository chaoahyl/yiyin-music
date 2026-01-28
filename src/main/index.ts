import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import logger from './logger'
import { registerIPC } from './ipc'
import { setupMusicIPC } from './ipc/music'
import { setupAutoUpdater } from './update'

/**
 * 创建主浏览器窗口
 */
function createWindow(): BrowserWindow {
  logger.info('正在创建浏览器窗口...')
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const isMac = process.platform === 'darwin'

  const mainWindow = new BrowserWindow({
    width: Math.round(width * 0.6),
    height: Math.round(height * 0.8),
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: isMac, // macOS 使用系统窗口边框
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false, // 后台不节流，保证远程控制可用
      nodeIntegrationInWorker: true
    }
  })

  // 监听渲染进程异常
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error(`渲染进程崩溃: ${details.reason}`)
  })

  // 开发环境自动打开 DevTools
  if (is.dev) mainWindow.webContents.openDevTools()

  // 窗口准备好后显示
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 拦截新窗口请求，统一使用系统默认浏览器打开外部链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR 热更新
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

/**
 * 应用初始化入口
 */
app.whenReady().then(() => {
  logger.info('--- 应用已就绪 (Ready) ---')
  logger.info('--- 环境信息 ---')
  logger.info(`系统版本: ${process.platform} ${process.arch}`)
  logger.info(`Chrome版本: ${process.versions.chrome}`)
  logger.info(`应用目录: ${app.getAppPath()}`)
  logger.info(`数据目录: ${join(app.getPath('home'), 'yiyin')}`)

  // 设置 Windows 平台 App User Model ID
  electronApp.setAppUserModelId('com.yiyin.muic')

  // 默认快捷键管理
  // 开发环境 F12 打开/关闭 DevTools
  // 生产环境忽略 CommandOrControl + R 刷新
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()

  // ---------------- 注册 IPC ----------------
  registerIPC()
  setupMusicIPC(mainWindow)

  // macOS 点击 Dock 图标重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // ---------------- 自动更新 ----------------
  mainWindow.webContents.on('did-finish-load', () => {
    setupAutoUpdater(mainWindow)
  })
})

/**
 * 所有窗口关闭时退出应用（macOS 除外）
 */
app.on('window-all-closed', () => {
  logger.info('所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
