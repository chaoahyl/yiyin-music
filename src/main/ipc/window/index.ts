import { ipcMain, BrowserWindow, nativeTheme } from 'electron'
import * as os from 'os'

/**
 * 设置窗口控制和 macOS 主题相关的 IPC
 * - 监听窗口最小化、最大化、关闭操作
 * - macOS 下设置应用主题（light/dark/system）
 */
export function setupWindowControlIPC() {
  /** --------------------------
   * 1. 窗口控制 IPC
   * -------------------------- */
  ipcMain.on('window-control', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    // 获取当前操作系统平台
    const platform = os.platform()

    switch (action) {
      case 'minimize':
        win.minimize()
        break

      case 'maximize':
        if (platform === 'darwin') {
          // macOS 下最大化为填充屏幕部分，不是全屏
          if (win.isMaximized()) {
            win.unmaximize()
          } else {
            win.maximize() // 或者设置为 `win.setBounds()` 来控制自定义的最大化行为
          }
        } else if (platform === 'linux') {
          // Linux 下的最大化通常行为与 Windows 相同
          if (win.isMaximized()) {
            win.unmaximize()
          } else {
            win.maximize()
          }
        } else {
          // 默认处理 Windows 行为
          if (win.isMaximized()) {
            win.unmaximize()
          } else {
            win.maximize()
          }
        }
        break

      case 'close':
        win.close()
        break
    }
  })

  /** --------------------------
   * 2. macOS 主题切换 IPC
   * -------------------------- */
  ipcMain.handle('set-mac-theme', (_, theme) => {
    setAppTheme(theme)
  })

  /**
   * 设置 macOS 下应用主题
   * @param theme 'light' | 'dark' | 'system'
   */
  function setAppTheme(theme: string) {
    if (process.platform !== 'darwin') return

    if (theme === 'light') {
      nativeTheme.themeSource = 'light'
    } else if (theme === 'dark') {
      nativeTheme.themeSource = 'dark'
    } else {
      nativeTheme.themeSource = 'system'
    }
  }
}
