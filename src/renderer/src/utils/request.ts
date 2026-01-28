import { ElMessage } from 'element-plus'

export function handleRes(res: any) {
  if (res?.code === 200) {
    return true
  } else {
    ElMessage.error(res?.message || '获取数据失败')
    return false
  }
}
