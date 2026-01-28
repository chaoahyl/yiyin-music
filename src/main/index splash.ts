import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import logger from './logger'
import { registerIPC } from './ipc'
import { setupMusicIPC } from './ipc/music'
import { setupAutoUpdater } from './update'

let splashWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null
let hasShownMain = false // 确保主窗口只显示一次

/**
 * 创建启动图窗口（Splash Screen）
 */
function createSplashWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  splashWindow = new BrowserWindow({
    width: Math.round(width * 0.3),
    height: Math.round(height * 0.5),
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: true, // ⭐ 不进任务栏
    resizable: false,
    movable: false,
    center: true,
    show: true,
    backgroundColor: '#00000000'
  })

  splashWindow.loadFile(join(__dirname, '../../resources/public/splash.html'))

  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

/**
 * 创建主窗口（Windows 必须是标准窗口）
 */
function createMainWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const isMac = process.platform === 'darwin'
  const isWin = process.platform === 'win32'

  mainWindow = new BrowserWindow({
    width: Math.round(width * 0.6),
    height: Math.round(height * 0.8),
    minWidth: 800,
    minHeight: 600,
    show: false,
    skipTaskbar: false, // ⭐ 必须
    frame: isWin || isMac, // ⭐ Windows 必须 true
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false,
      nodeIntegrationInWorker: true
    }
  })

  // 渲染进程异常
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error(`渲染进程崩溃: ${details.reason}`)
  })

  // 外部链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 加载页面
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  /**
   * 显示主窗口（关键顺序）
   */
  const showMainWindow = () => {
    if (hasShownMain) return
    hasShownMain = true

    // ⭐ 先关闭 splash
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }

    // ⭐ 再显示主窗口
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  }

  mainWindow.once('ready-to-show', showMainWindow)

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}

/**
 * 应用初始化
 */
app.whenReady().then(() => {
  logger.info('--- 应用已就绪 (Ready) ---')
  logger.info(`系统版本: ${process.platform} ${process.arch}`)
  logger.info(`Chrome版本: ${process.versions.chrome}`)
  logger.info(`应用目录: ${app.getAppPath()}`)
  logger.info(`数据目录: ${join(app.getPath('home'), 'yiyin')}`)

  // ⭐ 修正 AppUserModelId（非常重要）
  electronApp.setAppUserModelId('com.yiyin.music')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 启动页
  createSplashWindow()

  // 主窗口
  const mainWin = createMainWindow()

  // IPC
  registerIPC()
  setupMusicIPC(mainWin)

  // macOS Dock 激活
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  // 自动更新
  mainWin.webContents.once('did-finish-load', () => {
    setupAutoUpdater(mainWin)
  })
})

/**
 * 窗口全部关闭
 */
app.on('window-all-closed', () => {
  logger.info('所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
