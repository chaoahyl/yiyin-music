import { ElLoading } from 'element-plus'

let loading: { close: () => void }
let loadingNum = 0

// 缓存正在请求的数量

export function startLoading(text: string) {
  if (loadingNum == 0) {
    loading = ElLoading.service({
      text
    })
  }
  loadingNum++
}
export function endLoading() {
  //请求数量减1
  if (loading && --loadingNum <= 0) {
    loadingNum = 0
    loading.close()
  }
}
