<template>
  <div class="windows">
    <div class="left-area">
      <div class="toggle-btn" @click="handleBack">
        <SvgIcon class="icon" name="back" />
      </div>
    </div>
    <div class="menu">
      <div
        v-for="item in menuItems"
        :key="item.path"
        :content="item.meta.title"
        class="menu-item"
        :class="{ active: activeItem === item.path }"
        @click="handleClick(item)"
      >
        <SvgIcon
          size="20"
          :name="item.meta.icon"
          :color="activeItem === item.path ? '#ffffff' : 'var(--color-text)'"
        />
        <span class="menu-item-text">{{ item.meta.title }}</span>
      </div>
    </div>

    <div class="nav-bar__control">
      <div @click="set" class="control">
        <SvgIcon size="20" name="set" />
      </div>
      <div @click="windowHiden" class="control" v-if="!isMac">
        <SvgIcon size="20" name="min" />
      </div>
      <div @click="controlWindowSize" class="control" v-if="!isMac">
        <SvgIcon size="20" :name="'full'" />
      </div>
      <div @click="quiteApp" class="control control-close" v-if="!isMac">
        <SvgIcon size="20" name="close" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

import SvgIcon from '@renderer/components/svg-icon/index.vue'

const router = useRouter()
const route = useRoute()

const activeItem = ref(route.path)

const isMac = navigator.userAgent.includes('Macintosh')

// 点击菜单
const handleClick = (item: any) => {
  activeItem.value = item.path
  router.push(item.path)
}

watch(
  () => route.path,
  (newPath) => {
    activeItem.value = newPath
  }
)
const menuItems = computed(() =>
  router.getRoutes().filter((r) => {
    if (
      r.path === '/:pathMatch(.*)*' ||
      r.path === '/' ||
      !r.meta ||
      !r.meta.title ||
      r.meta.hidden
    )
      return false
    return true
  })
) as any

// 返回
const handleBack = () => router.back()

// 全屏
const controlWindowSize = () => {
  window.api.windowControl('maximize')
}

// 最小化
const windowHiden = () => {
  window.api.windowControl('minimize')
}

// 设置
const set = () => {
  router.push({ name: 'Set' })
}

// 关闭软件
const quiteApp = () => {
  ElMessageBox.confirm('是否退出 依音', '退出 依音', {
    cancelButtonText: '取消',
    confirmButtonText: '确认'
  })
    .then(() => {
      window.api.windowControl('close')
    })
    .catch(() => ({}))
}
</script>

<style lang="less" scoped>
.windows {
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 80px;
  padding: 0 3vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  background: linear-gradient(135deg, var(--main-color), var(--main-gradient));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-light);
  transition: var(--transition);

  .left-area {
    width: 150px;
    display: flex;
    align-items: center;
    gap: 10px;
    .toggle-btn {
      -webkit-app-region: no-drag;
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius-base);

      display: flex;
      align-items: center;
      justify-content: center;

      background: var(--sidebar-item-hover-bg);
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        background: var(--sidebar-item-active-bg);
      }
    }
  }

  .menu {
    display: flex;
    align-items: center;
    gap: 12px;
    -webkit-app-region: no-drag;

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: var(--border-radius-lg);
      font-weight: bold;
      font-size: 15px;
      color: var(--color-text);
      cursor: pointer;
      transition: var(--transition);

      &:hover {
        background: var(--sidebar-item-hover-bg);
        color: var(--main-color);
      }

      &.active {
        background: var(--sidebar-item-active-bg);
      }
    }
  }
  .nav-bar__control {
    width: 150px;
    display: flex;
    gap: 8px;
    -webkit-app-region: no-drag;
    .control {
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius-base);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sidebar-item-hover-bg);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      box-shadow: 0 2px 6px var(--box-shadow-light);
      cursor: pointer;
      transition: var(--transition);
    }

    .control:hover {
      background: var(--sidebar-item-active-bg);
      box-shadow: 0 0 10px var(--main-color);
    }

    .control:active {
      background: var(--sidebar-item-active-bg);
      box-shadow: inset 0 2px 6px var(--box-shadow-hover);
    }

    .control-close:hover {
      background: rgba(255, 80, 100, 0.6);
    }
  }
}
@media (max-width: 900px) {
  .menu-item-text {
    display: none;
  }
  .menu-item {
    padding: 10px;
  }
}
</style>
