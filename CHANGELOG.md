# 变更日志

## [2025-10-18] - 文件夹输入优化、图片路径修复和配置管理

### 功能改进

1. **自定义 autocomplete 实现**
   - 将文件夹选择器改为带有自定义自动完成功能的文本框
   - 实现完整的下拉建议列表，支持点击选择和键盘导航
   - 用户可以直接输入或从现有文件夹中选择

2. **图片路径转换功能**
   - 修复后端相对路径图片无法加载的问题
   - 实现智能图片路径转换逻辑
   - 支持多种图片路径格式

3. **统一配置管理**
   - 创建集中的配置文件管理后端地址
   - 便于部署时修改后端地址

### 技术实现

#### 前端修改
- **新增配置文件**: `src/config/api.js`
  - 集中管理后端地址配置
  - 支持 BASE_URL、API_PREFIX、UPLOAD_PATH 配置

- **PhotoDialog.vue**: 实现完整的自定义 autocomplete 组件
  - 使用 `computed` 计算过滤后的文件夹建议
  - 添加响应式状态管理：`showFolderSuggestions`、`folderInput`
  - 实现点击外部关闭建议列表功能
  - 添加完整的样式支持
  - 添加 `getImageUrl()` 方法处理图片路径
  - 使用配置文件中的后端地址

- **CategorizeDialog.vue**: 同样实现自定义 autocomplete 组件
  - 与 PhotoDialog.vue 保持一致的交互体验
  - 支持点击时显示建议列表
  - 智能过滤和选择功能
  - 添加 `getImageUrl()` 方法处理图片路径
  - 使用配置文件中的后端地址

- **PhotoGrid.vue**: 添加 `getImageUrl()` 方法处理图片路径
  - 使用配置文件中的后端地址

- **photoApi.js**: 使用配置文件中的 API 地址

### 配置管理
```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:5085',
  API_PREFIX: '/api',
  UPLOAD_PATH: '/upload'
}
```

### 图片路径处理逻辑
- **完整 URL**: 直接返回（支持 http://、https://、data:）
- **相对路径**: 自动拼接配置中的后端地址（如 `upload/1.png` → `${BASE_URL}/upload/1.png`）
- **其他情况**: 直接返回原路径

### 用户体验改进
- 简化了文件夹输入流程
- 支持自由输入新文件夹名称
- 点击输入框即显示文件夹建议列表
- 输入时智能过滤建议项
- 点击选择建议项自动填充
- 无需额外的 API 调用，文件夹作为普通字段保存
- 在图片编辑和批量分类中提供一致的体验
- 修复了后端相对路径图片无法加载的问题
- 便于部署时修改后端地址