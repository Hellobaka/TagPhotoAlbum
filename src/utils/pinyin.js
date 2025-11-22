import { pinyin } from 'pinyin-pro'

// 拼音缓存
const pinyinCache = new Map()

/**
 * 获取文本的拼音信息（带缓存）
 * @param {string} text - 要转换的文本
 * @returns {Object} 拼音信息对象
 */
export const getPinyinInfo = (text) => {
  if (pinyinCache.has(text)) {
    return pinyinCache.get(text)
  }

  const fullPinyin = pinyin(text, { toneType: 'none' }).toLowerCase()
  const firstLetters = pinyin(text, {
    toneType: 'none',
    pattern: 'first',
    type: 'array'
  }).join('').toLowerCase()
  const pinyinArray = pinyin(text, {
    toneType: 'none',
    type: 'array'
  }).map(py => py.toLowerCase())
  const pinyinString = pinyinArray.join('')

  const result = {
    fullPinyin,
    firstLetters,
    pinyinString
  }

  pinyinCache.set(text, result)
  return result
}

/**
 * 检查文本是否匹配查询（支持中文、拼音、首字母、模糊匹配）
 * @param {string} text - 要匹配的文本
 * @param {string} query - 查询字符串
 * @returns {boolean} 是否匹配
 */
export const isPinyinMatch = (text, query) => {
  if (!query) return false

  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  // 1. 直接中文匹配
  if (textLower.includes(queryLower)) {
    return true
  }

  // 获取拼音信息
  const pinyinInfo = getPinyinInfo(text)

  // 2. 全拼匹配
  if (pinyinInfo.fullPinyin.includes(queryLower)) {
    return true
  }

  // 3. 首字母匹配
  if (pinyinInfo.firstLetters.includes(queryLower)) {
    return true
  }

  // 4. 拼音模糊匹配 - 输入的部分拼音可以匹配完整拼音的任何位置
  if (queryLower.length >= 2) {
    if (pinyinInfo.pinyinString.includes(queryLower)) {
      return true
    }
  }

  return false
}

/**
 * 批量筛选支持拼音匹配的项
 * @param {Array} items - 要筛选的项数组
 * @param {string} query - 查询字符串
 * @param {Function} [getText] - 获取项文本的函数，默认为项本身
 * @returns {Array} 筛选后的项数组
 */
export const filterWithPinyin = (items, query, getText = item => item) => {
  if (!query) {
    return items
  }

  return items.filter(item => {
    const text = getText(item)
    return isPinyinMatch(text, query)
  })
}

/**
 * 清空拼音缓存
 */
export const clearPinyinCache = () => {
  pinyinCache.clear()
}