import { createApp } from 'vue'
import App from './App.vue'

//导入element-plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'

import './style.css'
import '@renderer/assets/css/index.less'

//引入icon
import SvgIcon from '@renderer/components/svg-icon/index.vue'
import 'virtual:svg-icons-register'

// 引入 router
import router from './router/index'

//引入虚拟列表
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
//@ts-ignore
import VueVirtualScroller from 'vue-virtual-scroller'

import { createPinia } from 'pinia'
import { i18n } from './lang'
const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(ElementPlus)
app.use(VueVirtualScroller)
app.use(pinia)
app.use(i18n)

app.component('svg-icon', SvgIcon)
app.mount('#app')
