// src/electron.d.ts
interface Window {
  api: {
    // ===== 窗口控制 =====
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void

    // ===== 音乐文件 =====
    importMusicFolder: (path: string) => Promise<any>

    setMusicFolder: (path: string) => Promise<any>

    openMusicFolder: () => Promise<any>
    getMusicList: () => Promise<any>
    upDateMusic: (music: { url: string; updates: Partial<any> }) => Promise<any>
    onImportProgress: (
      callback: (data: { current: number; total: number; file: string }) => void
    ) => void

    // ===== 歌单功能 =====
    getAllMenus: () => Promise<any> // 获取全部歌单
    createMenu: (name: string) => Promise<any> // 创建歌单
    addSong: (menuName: string, song: any) => Promise<any> // 添加歌曲到歌单
    removeSong: (menuName: string, songUrl: string) => Promise<any> // 从歌单移除歌曲
    deleteMenu: (menuName: string) => Promise<any> // 删除歌单
    renameMenu: (oldName: string, newName: string) => Promise<any> // 重命名歌单
    getMenuDetail: (menuName: string) => Promise<any> // 获取单个歌单详情

    // ===== 新增歌手/专辑相关 =====
    getAllArtists: () => Promise<any> // 获取全部歌手
    getAlbumsByArtist: (artistName: string) => Promise<any> // 通过歌手获取专辑
    getSongsByArtistAlbum: (artistName: string, albumName: string) => Promise<any> // 通过歌手+专辑获取歌曲

    copyText: (text: string) => Promise<{ success: boolean; message?: string }>
    openPath: () => Promise<{ success: boolean; message?: string }>
    // ===== 远程控制 =====
    getCode: () => Promise<any>
    syncPlayerStatus: (status: any) => Promise<any>

    // ===== 自动更新=======
    onUpdateAvailable: (callback: (info: any) => void) => void
    onUpdateDownloaded: (callback: (info: any) => void) => void
    onDownloadProgress: (callback: (progress: any) => void) => void
    setMacTheme: (theme: string) => void

    sendUpdateAction: (action: string, version?: string) => void
  }
}
