<template>
  <el-dialog
    append-to-body
    v-model="dialogVisible"
    :close-on-click-modal="false"
    title="新建歌单"
    width="60%"
  >
    <div style="height: 20vh">
      <el-input v-model="menuName" placeholder="输入歌单名称" @keyup.enter="handleConfirm" />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'

import { handleRes } from '@renderer/utils/request'

const dialogVisible = ref(false)
const menuName = ref('')
const emits = defineEmits(['refresh'])

const openDialog = () => {
  dialogVisible.value = true
}

const handleConfirm = () => {
  const name = menuName.value.trim()
  if (!name) {
    ElMessage.warning('请输入歌单名称')
    return
  }
  window.api.createMenu(name).then((res) => {
    if (handleRes(res)) {
      dialogVisible.value = false
      ElMessage.success('歌单创建成功')
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
