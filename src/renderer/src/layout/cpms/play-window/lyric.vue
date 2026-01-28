<template>
  <div class="right-panel">
    <LyricPlayer
      ref="lyricRef"
      :lyric-lines="lyrics"
      class="lyric-player"
      :playing="globalStore.isPlaying"
      :current-time="globalStore.playTime * 1000"
      @line-click="jumpToLine"
      :align-position="0.5"
      :enable-spring="true"
      :enable-scale="false"
      :enable-blur="false"
    />
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { LyricLine, LyricWord, parseLrc } from '@applemusic-like-lyrics/lyric'
import { LyricPlayer } from '@applemusic-like-lyrics/vue'
import { useGlobalStore } from '@renderer/store'
import { franc } from 'franc'

const emit = defineEmits<{ (e: 'update:playTime', time: number): void }>()

const globalStore = useGlobalStore()
const lyrics = shallowRef<LyricLine[]>([])

/** 点击歌词跳转 */
const jumpToLine = (e: any) => {
  emit('update:playTime', e.line.getLine().startTime / 1000)
}

/** ------------------------- 工具函数 ------------------------- */

/** 拼接一行文本，逐字或整行都适用 */
function getLineText(line: LyricLine) {
  if (line.words?.length) return line.words.map((w) => w.word).join('')
  return line.words?.[0]?.word || ''
}

/** 修复逐字歌词，每个字都有 startTime 和 endTime */
function fixLyricLine(line: LyricLine, nextLine?: LyricLine): LyricLine {
  if (!line.words?.[0]?.word) return line

  const content = line.words[0].word
  const regex = /([^\[\]\r\n]+)\[(\d{2}):(\d{2}\.\d{3})\]/g
  const words: LyricWord[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(content))) {
    const word = match[1].trim()
    if (!word) continue

    const min = Number(match[2])
    const sec = Number(match[3])
    const startTime = min * 60000 + sec * 1000
    words.push({ word, startTime, endTime: 0 })
  }

  if (!words.length) return line

  const realEndTime =
    nextLine?.startTime && nextLine.startTime > words.at(-1)!.startTime
      ? nextLine.startTime
      : words.at(-1)!.startTime + 300

  for (let i = 0; i < words.length; i++) {
    words[i].endTime = i < words.length - 1 ? words[i + 1].startTime : realEndTime
  }

  return { ...line, words, startTime: words[0].startTime, endTime: realEndTime }
}

/** 简单语言检测：中、英、日、韩、法 */
function detectLanguage(text: string): string {
  if (!text) return 'other'

  // 正则兜底短文本
  const zh = /[\u4E00-\u9FFF]/.test(text)
  const jp = /[\u3040-\u309F\u30A0-\u30FF]/.test(text)
  const ko = /[\uAC00-\uD7AF]/.test(text)
  const en = /[A-Za-z]/.test(text)

  const total = (zh ? 1 : 0) + (jp ? 1 : 0) + (ko ? 1 : 0) + (en ? 1 : 0)
  if (total === 1) {
    if (zh) return 'zh'
    if (jp) return 'jp'
    if (ko) return 'ko'
    if (en) return 'en'
  }

  // 使用 franc 对较长文本识别
  const langMap: Record<string, string> = {
    cmn: 'zh',
    jpn: 'jp',
    kor: 'ko',
    eng: 'en',
    fra: 'fr'
  }

  const francLang = franc(text, { minLength: 1 })
  return langMap[francLang] || 'other'
}

/** 判断是否是翻译行 */
function isTranslationLine(cur: LyricLine, next?: LyricLine): boolean {
  if (!next || !next.words || next.words.length !== 1) return false
  if (!cur.words?.length) return false

  const curText = getLineText(cur)
  const nextText = getLineText(next)

  const curLang = detectLanguage(curText)
  const nextLang = detectLanguage(nextText)

  return curLang !== 'other' && nextLang !== 'other' && curLang !== nextLang
}

/** 合并双语歌词 */
function mergeBilingual(lines: LyricLine[]): LyricLine[] {
  const result: LyricLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i]
    const next = lines[i + 1]

    if (isTranslationLine(cur, next)) {
      const mergedEndTime = Math.max(cur.endTime ?? 0, next.endTime ?? 0)
      const newWords = cur.words?.map((w) => ({ ...w })) ?? []
      if (newWords.length) newWords[newWords.length - 1].endTime = mergedEndTime

      result.push({
        ...cur,
        words: newWords,
        endTime: mergedEndTime,
        translatedLyric: getLineText(next)
      })

      i++ // 跳过翻译行
    } else {
      result.push(cur)
    }
  }

  return result
}
/** ------------------------- 监听播放歌曲 ------------------------- */
watch(
  () => globalStore.playMusic,
  (m) => {
    if (!m?.lyrics) {
      lyrics.value = []
      return
    }
    setTimeout(() => {
      const parsed = parseLrc(m.lyrics)
      // 判断逐字
      const isWordByWord = parsed.some((l) =>
        /\[\d{2}:\d{2}\.\d{3}\]/.test(l.words?.[0]?.word || '')
      )

      const fixed = parsed.map((l, i) => (isWordByWord ? fixLyricLine(l, parsed[i + 1]) : l))

      lyrics.value = mergeBilingual(fixed)
    }, 100)
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.right-panel {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  mask: linear-gradient(
    rgba(255, 255, 255, 0) 0px,
    rgba(255, 255, 255, 0.6) 5%,
    rgb(255, 255, 255) 15%,
    rgb(255, 255, 255) 75%,
    rgba(255, 255, 255, 0.6) 85%,
    rgba(255, 255, 255, 0)
  );

  :deep(.lyric-player) {
    width: 100%;
    height: 100%;
    font-weight: 800;
    font-family: 'PingFangSC-Semibold';
    --amll-lyric-player-font-size: min(clamp(30px, 2.5vw, 50px), 5vh);
  }
}
</style>
