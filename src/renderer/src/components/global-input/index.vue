<template>
  <el-input v-model="keyword" :placeholder="props.placeholder" clearable></el-input>
</template>

<script setup lang="ts">
const keyword = ref('')

const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索歌曲'
  }
})

const emits = defineEmits(['search'])

// 使用 watch 监听 keyword
watch(keyword, (newVal) => {
  emits('search', newVal)
})

defineExpose({
  keyword
})
</script>
