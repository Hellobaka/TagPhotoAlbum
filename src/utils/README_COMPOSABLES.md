# Composables 使用指南

## 核心 Composables

### 1. usePhotoFilters
**位置**: `src/utils/usePhotoFilters.js`

管理照片筛选和排序状态。

```javascript
import { usePhotoFilters } from '@/utils/usePhotoFilters'

const {
  // 筛选状态（响应式）
  selectedTags,      // 当前选中的标签
  selectedFolder,    // 当前选中的文件夹
  selectedLocation,  // 当前选中的地点
  selectedRatings,   // 当前选中的评分
  searchQuery,       // 搜索查询（支持 v-model）
  sortBy,            // 排序字段
  sortOrder,         // 排序顺序（'asc' 或 'desc'）
  
  // 方法
  toggleTag,         // 切换标签选择
  selectFolder,      // 选择/取消选择文件夹
  selectLocation,    // 选择/取消选择地点
  toggleRating,      // 切换评分选择
  clearSearch,       // 清空搜索
  clearAllFilters,   // 清除所有筛选
  handleSortChange,  // 处理排序变更
  applyFilters,      // 应用筛选条件
  resetFilters       // 重置筛选
} = usePhotoFilters()
```

**注意**：状态使用 `photoStore.currentFilters` 作为单一来源，保证状态同步。

---

### 2. usePhotoCategorization
**位置**: `src/utils/usePhotoCategorization.js`

管理照片分类流程。

```javascript
import { usePhotoCategorization } from '@/utils/usePhotoCategorization'

const {
  isCategorizing,           // 是否正在分类
  startCategorization,      // 开始分类流程
  stopCategorization,       // 停止分类流程
  handleSaveAndNext,        // 保存并进入下一张（使用 dataHelper）
  handleNext                // 跳过当前照片
} = usePhotoCategorization()
```

**改进**：
- 使用 `dataHelper.findAndRemove()` 简化数组操作
- 集成 notificationStore 显示操作结果

---

### 3. useScrollManagement
**位置**: `src/utils/useScrollManagement.js`

管理滚动事件和移动端检测。

```javascript
import { useScrollManagement, useMobileDetection } from '@/utils/useScrollManagement'

// 滚动管理
const {
  isFilterHidden,  // 筛选条是否隐藏
  handleScroll     // 滚动事件处理函数
} = useScrollManagement()

// 移动端检测
const { isMobile } = useMobileDetection()
```

**改进**：现在使用 `useEventListener` 自动管理事件监听和清理。

---

### 4. useUploadZone
**位置**: `src/utils/useUploadZone.js`

管理全局拖拽上传区域。

```javascript
import { useUploadZone } from '@/utils/useUploadZone'

const {
  showUploadZone,           // 是否显示上传区域
  isClosingUploadZone,      // 是否正在关闭
  handleGlobalDragOver,     // 全局拖拽处理
  handleGlobalDragLeave,    // 拖拽离开处理
  handleGlobalDrop,         // 拖拽放下处理
  closeUploadZone           // 关闭上传区域
} = useUploadZone()
```

**改进**：现在使用 `useEventListener` 自动管理拖拽事件监听和清理。

---

### 5. useDialogBackHandler
**位置**: `src/utils/useDialogBackHandler.js`

管理对话框的返回按钮行为。

```javascript
import { useDialogBackHandler } from '@/utils/useDialogBackHandler'

const { beforeManualClose } = useDialogBackHandler(
  when,            // ref<boolean> 或函数，对话框显示状态
  onClose,         // 函数，关闭对话框时调用
  childOpenRef     // 可选：子对话框的 ref
)
```

---

## 新增通用 Composables

### 1. useAsyncOperation（新增）
**位置**: `src/utils/useAsyncOperation.js`

标准化异步操作的 loading 和 error 管理。

```javascript
import { useAsyncOperation } from '@/utils/useAsyncOperation'

const { 
  isLoading,    // 是否加载中
  error,        // 错误信息
  execute,      // 执行异步操作的函数
  setError,     // 手动设置错误
  clearError    // 清除错误
} = useAsyncOperation({
  errorMessage: '操作失败',        // 默认错误消息
  notificationType: 'error',      // 通知类型
  showNotification: true          // 是否自动显示通知
})

// 使用示例
await execute(async () => {
  return await someAsyncOperation()
})
```

**优势**：
- 自动处理 loading 状态
- 自动显示错误通知
- 减少重复的 try-catch 代码

---

### 2. useEventListener（新增）
**位置**: `src/utils/useEventListener.js`

简化 DOM 事件监听和自动清理。

```javascript
import { useEventListener } from '@/utils/useEventListener'

// 单个事件
useEventListener({
  eventName: 'scroll',
  handler: handleScroll,
  target: window,
  options: { passive: true }
})

// 多个事件
const { removeListener, clearAllListeners } = useEventListener([
  { eventName: 'dragover', handler: handleDragOver },
  { eventName: 'dragleave', handler: handleDragLeave },
  { eventName: 'drop', handler: handleDrop }
])

// 手动移除
removeListener('dragover')
clearAllListeners()
```

**优势**：
- 自动在组件卸载时清理
- 防止内存泄漏
- 代码更简洁

---

## 数据处理工具函数

### dataHelper
**位置**: `src/utils/dataHelper.js`

提供常用的数据处理函数。

```javascript
import { 
  findAndRemove,     // 在数组中查找并删除项
  findAndUpdate,     // 在数组中查找并更新项
  batchUpdate,       // 批量更新数组项
  deduplicateBy,     // 按字段去重
  // ... 更多函数
} from '@/utils/dataHelper'

// 示例
findAndRemove(photos, 'id', photoId)      // 删除 ID 为 photoId 的照片
findAndUpdate(photos, 'id', photoId, {    // 更新照片
  name: 'New Name'
})
```

---

## 最佳实践

### 1. 使用 computed 连接 store 状态
```javascript
// ✅ 好
const selectedTags = computed(() => photoStore.currentFilters.tags)

// ❌ 避免
const selectedTags = ref([])  // 如果 store 中已有相同状态
```

### 2. 优先使用 useEventListener
```javascript
// ✅ 好
useEventListener({
  eventName: 'resize',
  handler: handleResize,
  target: window
})

// ❌ 避免（手动管理）
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

### 3. 使用 useAsyncOperation 处理异步操作
```javascript
// ✅ 好
const { isLoading, execute } = useAsyncOperation({
  errorMessage: '保存失败'
})
await execute(async () => await saveData())

// ❌ 避免（重复的 try-catch）
const isLoading = ref(false)
try {
  isLoading.value = true
  await saveData()
} catch (error) {
  console.error(error)
  notificationStore.showSnackbar('保存失败', 'error')
} finally {
  isLoading.value = false
}
```

### 4. 使用 dataHelper 进行数组操作
```javascript
// ✅ 好
import { findAndRemove } from '@/utils/dataHelper'
findAndRemove(items, 'id', itemId)

// ❌ 避免（手动查找和删除）
const index = items.findIndex(item => item.id === itemId)
if (index !== -1) {
  items.splice(index, 1)
}
```

---

## 常见问题

### Q: 为什么 usePhotoFilters 中的状态是 computed 而不是 ref？
A: 因为这些状态实际上是在 photoStore.currentFilters 中维护的。使用 computed 可以：
- 避免状态重复
- 确保状态始终同步
- 简化代码维护

### Q: useEventListener 如何防止内存泄漏？
A: useEventListener 使用 Vue 的 onUnmounted 生命周期钩子，在组件卸载时自动移除所有事件监听器。

### Q: 如何在多个地方使用相同的 composable？
A: 每个组件可以独立调用 composable，它们会创建独立的实例（除非依赖的是全局 store）。

### Q: 可以在 composable 中调用其他 composable 吗？
A: 可以！这是组织代码的好方法。例如，useScrollManagement 调用了 useEventListener。

---

## 性能考虑

1. **computed 的性能**：computed 会根据依赖自动缓存，不需要担心性能问题
2. **事件监听**：useEventListener 自动清理，不会导致内存泄漏
3. **异步操作**：useAsyncOperation 使用标准的 try-catch 处理，无额外开销

---

## 迁移指南

如果要在现有代码中采用新的 composables：

### 迁移 useAsyncOperation
```javascript
// 前
const isLoading = ref(false)
try {
  isLoading.value = true
  await operation()
} catch (error) {
  notificationStore.showSnackbar(error.message, 'error')
} finally {
  isLoading.value = false
}

// 后
const { isLoading, execute } = useAsyncOperation({
  errorMessage: error.message
})
await execute(async () => await operation())
```

### 迁移 useEventListener
```javascript
// 前
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 后
useEventListener({
  eventName: 'scroll',
  handler: handleScroll,
  target: window
})
```
