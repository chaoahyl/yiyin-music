import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * 渲染进程调用的 API 集合
 */
const api = {
  /** ---------------- 窗口控制 ---------------- */
  windowControl: (action: string) => ipcRenderer.send('window-control', action),

  /** ---------------- 剪贴板 ---------------- */
  copyText: (text: string) => ipcRenderer.invoke('copy-text', text),
  openPath: () => ipcRenderer.invoke('open-path'),

  /** ---------------- 音乐文件夹管理 ---------------- */
  importMusicFolder: (path: string) => ipcRenderer.invoke('import-music-folder', path),
  setMusicFolder: (path: string) => ipcRenderer.invoke('set-music-folder', path),
  openMusicFolder: () => ipcRenderer.invoke('open-music-folder'),
  onImportProgress: (callback: (data: { current: number; total: number; file: string }) => void) =>
    ipcRenderer.on('import-progress', (_event, data) => callback(data)),

  /** ---------------- 音乐数据 ---------------- */
  getMusicList: () => ipcRenderer.invoke('get-music-list'),
  upDateMusic: (music: { url: string; updates: Partial<any> }) =>
    ipcRenderer.invoke('update-music', music),

  /** ---------------- 歌单管理 ---------------- */
  getAllMenus: () => ipcRenderer.invoke('get-music-menu'),
  createMenu: (name: string) => ipcRenderer.invoke('create-music-menu', name),
  addSong: (menuName: string, song: any) => ipcRenderer.invoke('add-to-music-menu', menuName, song),
  removeSong: (menuName: string, songUrl: string) =>
    ipcRenderer.invoke('remove-from-music-menu', menuName, songUrl),
  deleteMenu: (menuName: string) => ipcRenderer.invoke('delete-music-menu', menuName),
  renameMenu: (oldName: string, newName: string) =>
    ipcRenderer.invoke('rename-music-menu', oldName, newName),
  getMenuDetail: (menuName: string) => ipcRenderer.invoke('get-single-music-menu', menuName),

  /** ---------------- 歌手 / 专辑 ---------------- */
  getAllArtists: () => ipcRenderer.invoke('get-all-artists'),
  getAlbumsByArtist: (artistName: string) => ipcRenderer.invoke('get-albums-by-artist', artistName),
  getSongsByArtistAlbum: (artistName: string, albumName: string) =>
    ipcRenderer.invoke('get-songs-by-artist-album', artistName, albumName),

  /** ---------------- 远程控制 ---------------- */
  getCode: () => ipcRenderer.invoke('get-code'),
  syncPlayerStatus: (status: any) => ipcRenderer.send('sync-player-status', status),

  /** ---------------- 自动更新 ---------------- */
  onUpdateAvailable: (callback: (info: any) => void) =>
    ipcRenderer.on('update-available', (_e, info) => callback(info)),
  onUpdateDownloaded: (callback: (info: any) => void) =>
    ipcRenderer.on('update-downloaded', (_e, info) => callback(info)),
  onDownloadProgress: (callback: (progress: any) => void) =>
    ipcRenderer.on('update-download-progress', (_e, progress) => callback(progress)),
  sendUpdateAction: (action: string, version?: string) =>
    ipcRenderer.send('update-action', action, version),

  /** ---------------- macOS 主题 ---------------- */
  setMacTheme: (theme: string) => ipcRenderer.invoke('set-mac-theme', theme)
}

// 注入到渲染进程安全上下文
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
