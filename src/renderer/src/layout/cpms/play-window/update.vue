<template>
  <el-dialog
    append-to-body
    v-model="dialogVisible"
    :close-on-click-modal="false"
    title="修改歌曲信息"
    width="80%"
  >
    <div class="dialog-body">
      <el-row :gutter="20">
        <!-- 左侧封面 -->
        <el-col :span="8">
          <div class="cover-container">
            <img :src="playMusicForm.cover" class="cover" alt="cover" />
            <div class="cover-title">{{ playMusicForm.title || '未知歌曲' }}</div>
          </div>
        </el-col>

        <!-- 右侧表单 -->
        <el-col :span="16">
          <!-- 展示模式 -->
          <el-form v-if="!isEdit" :model="playMusicForm" label-width="70px" class="info-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="歌曲名">
                  {{ playMusicForm?.title }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="歌手">
                  {{ playMusicForm?.artist }}
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="专辑">
                  {{ playMusicForm?.album }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="类型">
                  {{ playMusicForm.audioType }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="时长">
                  {{ formatDuration(playMusicForm.duration) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="大小">
                  {{ formatSize(playMusicForm.size) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发行年份">
                  {{ playMusicForm.year }}
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-form v-else :model="playMusicForm" label-width="70px" class="info-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="歌曲名">
                  <el-input v-model="playMusicForm.title"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="歌手">
                  <el-input v-model="playMusicForm.artist"></el-input>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="专辑">
                  <el-input v-model="playMusicForm.album"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="类型">
                  {{ playMusicForm.audioType }}
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="歌词">
                  <el-input
                    type="textarea"
                    v-model="playMusicForm.lyrics"
                    :rows="8"
                    resize="none"
                  ></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- 展示模式 -->
        <template v-if="!isEdit">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="isEdit = true">编辑</el-button>
        </template>

        <!-- 编辑模式 -->
        <template v-else>
          <el-button @click="isEdit = false">取消编辑</el-button>
          <el-button type="primary" @click="handleConfirm">保存</el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useGlobalStore } from '@renderer/store'
import { handleRes } from '@renderer/utils/request'
import { formatDuration, formatSize } from '@renderer/utils/music'
import { ElNotification } from 'element-plus'

const globalStore = useGlobalStore()
const dialogVisible = ref(false)
const emits = defineEmits(['refresh'])
const isEdit = ref(false)

// 表单数据
const playMusicForm = reactive({
  title: '',
  artist: '',
  album: '',
  audioType: '',
  duration: 0,
  size: 0,
  year: '',
  cover: '',
  lyrics: ''
})

const openDialog = () => {
  if (!globalStore.playMusic) return
  Object.assign(playMusicForm, globalStore.playMusic)
  dialogVisible.value = true
  isEdit.value = false // 每次打开默认进入展示模式
}

const handleConfirm = () => {
  if (!globalStore.playMusic) return
  const updates = JSON.parse(JSON.stringify(playMusicForm))

  window.api.upDateMusic({ url: globalStore.playMusic.url, updates }).then((res) => {
    if (handleRes(res)) {
      window.api.getMusicList().then((res) => {
        if (handleRes(res)) {
          const musicList = res.data
          globalStore.playList = musicList

          const currentUrl = globalStore.playMusic?.url
          if (currentUrl) {
            const updatedSong = musicList.find((song) => song.url === currentUrl)
            if (updatedSong && globalStore.playMusic) {
              Object.assign(globalStore.playMusic, updatedSong)
              ElNotification({ title: '修改成功！', type: 'success', position: 'bottom-right' })
              dialogVisible.value = false
            }
          }
        }
      })
    }
  })
}

defineExpose({ openDialog })
</script>

<style scoped lang="less">
.dialog-body {
  height: 50vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cover-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cover {
  width: 80%;
  max-width: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  margin-bottom: 12px;
}

.cover-title {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  word-break: break-word;
}

.info-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.el-form-item {
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
