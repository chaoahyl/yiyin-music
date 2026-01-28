<template>
  <el-form
    :model="model"
    :rules="rules"
    class="form"
    label-width="auto"
    :label-position="labelPosition"
  >
    <template v-for="(group, gIndex) in props.groups" :key="gIndex">
      <!-- 分组标题 -->
      <el-form-item
        v-if="group.title"
        :label="group.title"
        :style="group.titleStyle"
      ></el-form-item>

      <!-- 分组内容 -->
      <div :style="group.wrapperStyle">
        <template v-for="(item, index) in group.items" :key="index">
          <!-- switch -->
          <el-form-item v-if="item.type === 'switch'" :label="item.label">
            <el-switch v-model="proxyModel[item.prop]"></el-switch>
          </el-form-item>

          <!-- input -->
          <el-form-item v-else-if="item.type === 'input'" :label="item.label">
            <el-input
              v-model="proxyModel[item.prop]"
              :placeholder="item.placeholder || ''"
            ></el-input>
          </el-form-item>

          <!-- divider -->
          <el-divider
            v-else-if="item.type === 'divider'"
            :style="item.style || 'margin:10px 0'"
          ></el-divider>

          <!-- custom 插槽 -->
          <el-form-item v-else-if="item.type === 'custom'" :label="item.label">
            <slot
              :name="'custom-' + item.prop"
              :item="item"
              :groupIndex="gIndex"
              :itemIndex="index"
            ></slot>
          </el-form-item>
        </template>
      </div>
    </template>
  </el-form>
</template>

<script setup lang="ts">
import { get, set } from 'lodash-es'

const props = defineProps<{
  model: Record<string, any>
  rules?: Record<string, any>
  groups: any[]
  labelPosition?: 'left' | 'right' | 'top'
}>()

const { rules = {}, labelPosition = 'left' } = props

/**
 * proxyModel 是一个代理层，可以让 v-model 绑定多级路径
 * 例如 item.prop = "user.info.name"
 * 那么 proxyModel["user.info.name"] 实际上操作的是 model.user.info.name
 */
const proxyModel = new Proxy(
  {},
  {
    get(_, prop: string) {
      return get(props.model, prop)
    },
    set(_, prop: string, value) {
      set(props.model, prop, value)
      return true
    }
  }
) as any
</script>

<style scoped lang="less">
.form {
  :deep(.el-form-item) {
    margin: 0 !important;
    padding: 0 !important;
  }
  :deep(.el-form-item__content) {
    justify-content: flex-end !important;
  }
}
</style>
