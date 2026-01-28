import fs from 'fs-extra'
import path from 'path'
import { app } from 'electron'

/** --------------------------
 * 字符串规范化与判断工具
 * -------------------------- */

/**
 * 规范化字符串：去掉前导符号，只保留中文/英文/数字开头
 * @param s 原字符串
 */
const norm = (s?: string) => (s || '').trim().replace(/^[^0-9A-Za-z\u4E00-\u9FFF]+/, '')

/** 判断字符串是否包含中文（Han 脚本） */
const hasHan = (s: string) => /\p{Script=Han}/u.test(s)

/** 判断字符串是否包含英文或数字（ASCII 范围） */
const hasLatin = (s: string) => /[A-Za-z0-9]/.test(s)

/** 国际化排序器：英文/数字，自然排序 */
const collatorEn = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/** 国际化排序器：中文，自然排序 */
const collatorZh = new Intl.Collator('zh', { numeric: true, sensitivity: 'base' })

/** --------------------------
 * 核心排序函数
 * -------------------------- */

/**
 * 比较两个标题的排序顺序
 * - 优先：Latin > 中文 > 其他
 * - 同类型使用 Intl.Collator 做自然排序
 * @param a 字符串 A
 * @param b 字符串 B
 * @returns number 排序对比值
 */
export function compareTitle(a: string, b: string) {
  const aRaw = norm(a)
  const bRaw = norm(b)

  if (!aRaw && !bRaw) return 0
  if (!aRaw) return -1
  if (!bRaw) return 1

  const aHasHan = hasHan(aRaw)
  const bHasHan = hasHan(bRaw)
  const aHasLatin = hasLatin(aRaw)
  const bHasLatin = hasLatin(bRaw)

  // 优先级规则：Latin > 中文 > 其他
  if (aHasLatin && !bHasLatin && !bHasHan) return -1
  if (aHasLatin && bHasHan && !bHasLatin) return -1
  if (aHasHan && bHasLatin && !aHasLatin) return 1

  // 都中文 → 中文自然排序
  if (aHasHan && bHasHan) return collatorZh.compare(aRaw, bRaw)

  // 都英文/数字 → 英文自然排序
  if (aHasLatin && bHasLatin) return collatorEn.compare(aRaw, bRaw)

  // 兜底：先按中文，再按英文
  const zhCompare = collatorZh.compare(aRaw, bRaw)
  if (zhCompare !== 0) return zhCompare
  return collatorEn.compare(aRaw, bRaw)
}

/** --------------------------
 * 通用数组排序函数
 * -------------------------- */

/**
 * 按对象字段排序
 * @param list 待排序数组
 * @param key 排序字段
 * @param type 排序方式 'asc' | 'desc'
 */
export function sortListByKey<T extends Record<string, any>>(
  list: T[],
  key: keyof T,
  type: 'asc' | 'desc' = 'asc'
) {
  return list.sort((a, b) => {
    const aVal = String(a[key] ?? '')
    const bVal = String(b[key] ?? '')

    const cmp = compareTitle(aVal, bVal)
    return type === 'asc' ? cmp : -cmp
  })
}

/** --------------------------
 * 读取音乐列表
 * -------------------------- */

/**
 * 从本地 songs.json 读取音乐列表
 */
export async function readMusic() {
  const userHome = app.getPath('home')
  const LYL_MUSIC_DIR = path.join(userHome, 'yiyin')
  const MUSIC_JSON = path.join(LYL_MUSIC_DIR, 'songs.json')
  try {
    return await fs.readJson(MUSIC_JSON)
  } catch {
    return []
  }
}
