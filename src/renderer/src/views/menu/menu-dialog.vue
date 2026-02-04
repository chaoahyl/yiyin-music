<template>
  <el-dialog
    append-to-body
    v-model="dialogVisible"
    :close-on-click-modal="false"
    :title="$t('views.menu.create_menu')"
    width="60%"
  >
    <div style="height: 20vh">
      <el-input
        v-model="menuName"
        :placeholder="$t('views.menu.search_placeholder')"
        @keyup.enter="handleConfirm"
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ $t('confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'

import { handleRes } from '@renderer/utils/request'
import { useI18n } from 'vue-i18n'

const dialogVisible = ref(false)
const menuName = ref('')
const emits = defineEmits(['refresh'])

const { t } = useI18n()
const openDialog = () => {
  dialogVisible.value = true
}

const handleConfirm = () => {
  const name = menuName.value.trim()
  if (!name) {
    ElMessage.warning(t('enter_menu_name'))
    return
  }
  window.api.createMenu(name).then((res) => {
    if (handleRes(res)) {
      dialogVisible.value = false
      ElMessage.success(t('menu_created'))
      emits('refresh')
    }
  })
}

defineExpose({
  openDialog
})
</script>

<style lang="less" scoped>
.music-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 60px;
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition);

  &:hover {
    background-color: var(--color-bg-hover);
  }

  &.selected:not(.disabled) {
    background-color: rgba(64, 158, 255, 0.1);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    &:hover {
      background-color: inherit;
      transform: none;
    }
  }

  .cover {
    width: 55px;
    height: 55px;
    border-radius: 5px;
    object-fit: cover;
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;

    .title {
      font-size: 16px;
    }

    .artist-album {
      font-size: 14px;
    }
  }

  .duration {
    width: 60px;
    font-size: 14px;
  }
}
</style>
