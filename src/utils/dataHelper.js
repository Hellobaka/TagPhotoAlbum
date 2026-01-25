/**
 * 通用数据处理助手函数
 * 提供数据去重、排序、过滤、转换等常用操作
 */

/**
 * 从数组中提取唯一值
 * @param {Array} items - 数据项数组
 * @param {string|Function} key - 提取键或提取函数
 * @returns {Array} 唯一值数组
 */
export const extractUniqueValues = (items, key) => {
  if (!Array.isArray(items) || items.length === 0) return []

  const seen = new Set()
  return items
    .map(item => (typeof key === 'function' ? key(item) : item[key]))
    .filter(value => {
      if (value === null || value === undefined) return false
      const stringValue = JSON.stringify(value)
      if (seen.has(stringValue)) return false
      seen.add(stringValue)
      return true
    })
}

/**
 * 按字段去重数组
 * @param {Array} items - 数据项数组
 * @param {string} key - 去重键
 * @returns {Array} 去重后的数组
 */
export const deduplicateBy = (items, key) => {
  if (!Array.isArray(items)) return []

  const seen = new Map()
  return items.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.set(value, true)
    return true
  })
}

/**
 * 按多个字段排序数组
 * @param {Array} items - 数据项数组
 * @param {Array<{key: string, order: 'asc'|'desc'}>} sortConfig - 排序配置
 * @returns {Array} 排序后的数组
 */
export const sortByMultiple = (items, sortConfig) => {
  if (!Array.isArray(items) || !Array.isArray(sortConfig)) return items

  return [...items].sort((a, b) => {
    for (const { key, order = 'asc' } of sortConfig) {
      const aVal = a[key]
      const bVal = b[key]

      if (aVal === bVal) continue

      const comparison = aVal < bVal ? -1 : 1
      return order === 'desc' ? -comparison : comparison
    }
    return 0
  })
}

/**
 * 分组数组
 * @param {Array} items - 数据项数组
 * @param {string|Function} key - 分组键或分组函数
 * @returns {Map} 分组结果
 */
export const groupBy = (items, key) => {
  if (!Array.isArray(items)) return new Map()

  return items.reduce((acc, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!acc.has(groupKey)) {
      acc.set(groupKey, [])
    }
    acc.get(groupKey).push(item)
    return acc
  }, new Map())
}

/**
 * 在数组中查找并更新项
 * @param {Array} items - 数据项数组
 * @param {string} key - 查询键
 * @param {*} value - 查询值
 * @param {Object} updateData - 更新数据
 * @returns {boolean} 是否更新成功
 */
export const findAndUpdate = (items, key, value, updateData) => {
  if (!Array.isArray(items)) return false

  const index = items.findIndex(item => item[key] === value)
  if (index === -1) return false

  items[index] = { ...items[index], ...updateData }
  return true
}

/**
 * 在数组中查找并删除项
 * @param {Array} items - 数据项数组
 * @param {string} key - 查询键
 * @param {*} value - 查询值
 * @returns {boolean} 是否删除成功
 */
export const findAndRemove = (items, key, value) => {
  if (!Array.isArray(items)) return false

  const index = items.findIndex(item => item[key] === value)
  if (index === -1) return false

  items.splice(index, 1)
  return true
}

/**
 * 将数组分页
 * @param {Array} items - 数据项数组
 * @param {number} page - 页码（从 1 开始）
 * @param {number} pageSize - 每页大小
 * @returns {Array} 分页数据
 */
export const paginate = (items, page = 1, pageSize = 20) => {
  if (!Array.isArray(items) || page < 1 || pageSize < 1) return []

  const start = (page - 1) * pageSize
  const end = start + pageSize
  return items.slice(start, end)
}

/**
 * 计算分页信息
 * @param {number} total - 总项数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页大小
 * @returns {Object} 分页信息
 */
export const calculatePaginationInfo = (total, page = 1, pageSize = 20) => {
  const totalPages = Math.ceil(total / pageSize)
  const hasMore = page < totalPages
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
    start,
    end,
    count: end - start + 1,
  }
}

/**
 * 批量更新数组中的项
 * @param {Array} items - 数据项数组
 * @param {Array} updates - 更新数据数组 { id, data }
 * @param {string} idKey - ID 字段名
 * @returns {number} 更新的项数
 */
export const batchUpdate = (items, updates, idKey = 'id') => {
  if (!Array.isArray(items) || !Array.isArray(updates)) return 0

  let count = 0
  const updateMap = new Map(updates.map(u => [u[idKey], u.data]))

  items.forEach((item, index) => {
    if (updateMap.has(item[idKey])) {
      items[index] = { ...item, ...updateMap.get(item[idKey]) }
      count++
    }
  })

  return count
}

/**
 * 查找对象差异
 * @param {Object} obj1 - 第一个对象
 * @param {Object} obj2 - 第二个对象
 * @returns {Object} 差异数据
 */
export const findDifferences = (obj1, obj2) => {
  const differences = {}

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

  allKeys.forEach(key => {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      differences[key] = {
        old: obj1[key],
        new: obj2[key],
      }
    }
  })

  return differences
}

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
export const deepMerge = (target, source) => {
  const result = { ...target }

  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  })

  return result
}

export default {
  extractUniqueValues,
  deduplicateBy,
  sortByMultiple,
  groupBy,
  findAndUpdate,
  findAndRemove,
  paginate,
  calculatePaginationInfo,
  batchUpdate,
  findDifferences,
  deepMerge,
}
