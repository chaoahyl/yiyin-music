import { ipcMain, clipboard, shell, app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * 设置剪贴板和日志文件相关的 IPC 监听器
 * - 提供渲染进程复制文本到剪贴板功能
 * - 打开日志文件功能
 */
export function setupClipboardIPC() {
  // ===== IPC：复制文本到剪贴板 =====
  ipcMain.handle(
    'copy-text',
    async (_event, text: string): Promise<{ success: boolean; message?: string }> => {
      try {
        // 验证输入：确保 text 是字符串
        if (typeof text !== 'string') {
          throw new Error('复制的内容必须是字符串格式')
        }

        // 写入剪贴板
        clipboard.writeText(text)

        return { success: true }
      } catch (err: any) {
        console.error('无法复制文本到剪贴板:', text, err)

        return {
          success: false,
          message: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  // ===== IPC：打开日志文件 =====
  ipcMain.handle('open-path', async (): Promise<{ success: boolean; message?: string }> => {
    const userHome = app.getPath('home')
    const LYL_MUSIC_DIR = path.join(userHome, 'yiyin')
    const LOG_DIR = path.join(LYL_MUSIC_DIR, 'logs')
    const LOG_FILE_PATH = path.join(LOG_DIR, 'main.log')

    try {
      // 检查日志文件是否存在
      if (!fs.existsSync(LOG_FILE_PATH)) {
        throw new Error('日志文件尚未生成')
      }

      // 使用系统默认程序打开日志文件
      const errorMessage = await shell.openPath(LOG_FILE_PATH)
      if (errorMessage) {
        throw new Error(errorMessage)
      }

      return { success: true }
    } catch (err: any) {
      console.error('无法直接打开日志文件:', LOG_FILE_PATH, err)
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err)
      }
    }
  })
}
