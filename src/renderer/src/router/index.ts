import { createRouter, createWebHashHistory } from 'vue-router'
import NProgress from 'nprogress' // 引入 nprogress
import 'nprogress/nprogress.css' // 引入 nprogress 样式
import { ElMessage } from 'element-plus'
import { useUIStore } from '@renderer/store/ui'
const routes = [
  {
    path: '/',
    redirect: '/lyl/home'
  },
  {
    path: '/lyl',
    name: 'Layout',
    redirect: '/lyl/home',
    component: () => import('@renderer/layout/index.vue'),
    children: [
      {
        path: 'home',
        name: 'Home',
        meta: { title: '音乐库', icon: 'home' },
        component: () => import('@renderer/views/home/index.vue')
      },
      {
        path: 'menu',
        name: 'Menu',
        meta: { title: '歌单', icon: 'menu' },
        component: () => import('@renderer/views/menu/index.vue')
      },
      {
        path: 'menu-detail/:name',
        name: 'MenuDetail',
        meta: { title: '歌单详情', icon: 'home', hidden: true },
        component: () => import('@renderer/views/menu-detail/index.vue')
      },
      {
        path: 'artist',
        name: 'Artist',
        meta: { title: '艺术家', icon: 'artist' },
        component: () => import('@renderer/views/artist/index.vue')
      },
      {
        path: 'artist-detail/:name/:cover',
        name: 'ArtistDetail',
        meta: { title: '艺术家详情', icon: 'artist', hidden: true },
        component: () => import('@renderer/views/artist/detail.vue')
      },
      {
        path: 'album/:artist/:name',
        name: 'Album',
        meta: { title: '专辑', icon: 'artist', hidden: true },
        component: () => import('@renderer/views/artist/album.vue')
      },
      {
        path: 'love',
        name: 'Love',
        meta: { title: '收藏', icon: 'loveside' },
        component: () => import('@renderer/views/love/index.vue')
      },
      {
        path: 'set',
        name: 'Set',
        meta: { title: '设置', icon: 'set', hidden: true },
        component: () => import('@renderer/views/set/index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

NProgress.configure({
  showSpinner: false // 禁用加载图标
})

// 路由开始切换时启动
router.beforeEach((_to, _from, next) => {
  const uiStore = useUIStore()
  // 如果正在导入音乐，阻止跳转
  if (uiStore.importVisible) {
    ElMessage.warning('正在导入音乐，请稍后...')
    NProgress.done()
    return
  }
  // 启动进度条
  const container = document.getElementById('target')
  if (container) {
    NProgress.configure({ parent: '#target' })
  }
  NProgress.start()
  next()
})

router.afterEach(() => {
  NProgress.done() // 完成进度条
})
export default router
