import log from 'electron-log'
import { join } from 'path'
import { app } from 'electron'

/**
 * electron-log 主进程日志配置
 */

// 1. 日志存放目录
const userHome = app.getPath('home')
const LYL_MUSIC_DIR = join(userHome, 'yiyin')
const LOG_DIR = join(LYL_MUSIC_DIR, 'logs')

// 2. 配置日志文件路径
log.transports.file.resolvePathFn = () => join(LOG_DIR, 'main.log')

// 3. 配置日志输出格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// 4. 设置日志等级
log.transports.file.level = 'info'

// 5. 自动捕获未处理错误
//    - 主进程未捕获异常和 Promise rejection 会写入日志文件
//    - 不弹出系统对话框
log.errorHandler.startCatching({
  showDialog: false
})

// 6. 控制台日志输出禁用（可根据需要开启）
log.transports.console.level = false

// 7. 同步初始化渲染进程日志（前端 console.log 也会写入文件）
log.initialize()

export default log
