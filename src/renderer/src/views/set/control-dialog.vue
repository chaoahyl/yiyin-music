<template>
  <el-dialog
    append-to-body
    v-model="visible"
    :title="$t('views.set.control_dialog.title')"
    width="35%"
    :close-on-click-modal="false"
  >
    <div class="qr-dialog-content">
      <div class="qr-card">
        <qrcode-vue
          :value="url"
          :size="260"
          level="M"
          render-as="svg"
          background="#ffffff"
          foreground="#000000"
        />
      </div>
      <div class="qr-info">
        <p class="qr-tips">{{ $t('views.set.control_dialog.tips') }}</p>
        <div class="status-tag">{{ $t('views.set.control_dialog.tag') }}</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'

const props = defineProps<{
  modelValue: boolean
  url: string
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<style scoped lang="less">
.qr-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0 20px 0;

  .qr-card {
    background: #ffffff;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
  }

  .qr-info {
    text-align: center;
    .qr-tips {
      font-size: 15px;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 8px;
    }
    .status-tag {
      display: inline-block;
      font-size: 12px;
      color: var(--color-text-secondary);
      background: rgba(128, 128, 128, 0.1);
      padding: 2px 10px;
      border-radius: 4px;
    }
  }
}
</style>
