import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

/**
 * 自动更新配置与监听
 * @param mainWindow 主窗口实例，用于向渲染进程发送更新状态
 */
export function setupAutoUpdater(mainWindow: BrowserWindow) {
  // 1. 开发环境允许测试更新
  autoUpdater.forceDevUpdateConfig = true

  // 2. 设置更新源 URL（generic provider）
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'http://localhost:3000/' // 可替换为生产环境服务器地址
  })

  // 3. 日志配置
  autoUpdater.logger = log
  log.transports.file.level = 'info'

  /**
   * 4. 自动更新事件监听
   */

  // 检测到新版本
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info)
    log.info(`[Update] 发现新版本: ${info.version}`)
  })

  // 更新包下载完成
  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Update] 更新包下载完成')
    mainWindow.webContents.send('update-downloaded', info)
  })

  // 下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`[Update] 下载进度: ${progressObj.percent.toFixed(2)}%`)
    mainWindow.webContents.send('update-download-progress', progressObj)
  })

  // 5. 执行检查并通知
  autoUpdater.checkForUpdatesAndNotify()
}
