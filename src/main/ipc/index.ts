import { setupClipboardIPC } from './copy'
import { setupWindowControlIPC } from './window'

/**
 * 注册主进程的全部 IPC
 * - 剪贴板操作
 * - 窗口控制及 macOS 主题
 */
export function registerIPC() {
  setupClipboardIPC()
  setupWindowControlIPC()
}
