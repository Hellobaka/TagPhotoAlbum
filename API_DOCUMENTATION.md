# Tag Photo Album API 文档

## 概述

本文档描述了 Tag Photo Album 应用的完整 API 接口规范。应用使用 Axios 作为 HTTP 客户端，支持照片管理、标签分类、文件夹组织和地点标注等功能。

## 基础信息

- **基础 URL**: `http://localhost:3001/api`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **超时时间**: 10秒

## 认证接口

### 用户登录

**POST** `/auth/login`

请求体：
```json
{
  "username": "string",
  "password": "string"
}
```

响应：
```json
{
  "success": true,
  "user": {
    "username": "string",
    "name": "string",
    "email": "string"
  },
  "token": "jwt_token_string"
}
```

## 照片管理接口

### 获取照片列表

**GET** `/photos`

查询参数：
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20
- `folder` (可选): 按文件夹筛选
- `location` (可选): 按地点筛选
- `tags` (可选): 按标签筛选，多个标签用逗号分隔

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "url": "string",
      "title": "string",
      "description": "string",
      "tags": ["string"],
      "folder": "string",
      "location": "string",
      "date": "string"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 获取单个照片

**GET** `/photos/:id`

响应：
```json
{
  "success": true,
  "data": {
    "id": "number",
    "url": "string",
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "folder": "string",
    "location": "string",
    "date": "string"
  }
}
```

### 创建照片

**POST** `/photos`

请求体：
```json
{
  "url": "string",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "folder": "string",
  "location": "string",
  "date": "string"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "number",
    "url": "string",
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "folder": "string",
    "location": "string",
    "date": "string"
  }
}
```

### 更新照片

**PUT** `/photos/:id`

请求体：
```json
{
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "folder": "string",
  "location": "string"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "number",
    "url": "string",
    "title": "string",
    "description": "string",
    "tags": ["string"],
    "folder": "string",
    "location": "string",
    "date": "string"
  }
}
```

### 删除照片

**DELETE** `/photos/:id`

响应：
```json
{
  "success": true,
  "message": "照片删除成功"
}
```

## 元数据接口

### 获取所有标签

**GET** `/metadata/tags`

响应：
```json
{
  "success": true,
  "data": ["string"]
}
```

### 获取所有文件夹

**GET** `/metadata/folders`

响应：
```json
{
  "success": true,
  "data": ["string"]
}
```

### 获取所有地点

**GET** `/metadata/locations`

响应：
```json
{
  "success": true,
  "data": ["string"]
}
```

## 搜索接口

### 搜索照片

**GET** `/search`

查询参数：
- `q` (必需): 搜索关键词

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "url": "string",
      "title": "string",
      "description": "string",
      "tags": ["string"],
      "folder": "string",
      "location": "string",
      "date": "string"
    }
  ]
}
```

### 获取推荐照片

**GET** `/photos/recommend`

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "url": "string",
      "title": "string",
      "description": "string",
      "tags": ["string"],
      "folder": "string",
      "location": "string",
      "date": "string"
    }
  ]
}
```

## 错误处理

所有 API 接口使用统一的错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

常见错误码：
- `AUTH_ERROR`: 认证失败
- `VALIDATION_ERROR`: 参数验证失败
- `NOT_FOUND`: 资源不存在
- `PERMISSION_DENIED`: 权限不足
- `SERVER_ERROR`: 服务器内部错误

## 前端集成

### API 服务配置

前端 API 服务位于 `src/api/photoApi.js`，包含以下主要功能：

1. **Axios 实例配置**
   - 基础 URL: `http://localhost:3001/api`
   - 超时时间: 10秒
   - 请求/响应拦截器

2. **API 方法**
   - `login(credentials)`: 用户登录
   - `getPhotos(params)`: 获取照片列表
   - `getPhoto(id)`: 获取单个照片
   - `createPhoto(photoData)`: 创建照片
   - `updatePhoto(id, photoData)`: 更新照片
   - `deletePhoto(id)`: 删除照片
   - `getTags()`: 获取所有标签
   - `getFolders()`: 获取所有文件夹
   - `getLocations()`: 获取所有地点
   - `searchPhotos(query)`: 搜索照片
   - `getRecommendPhotos()`: 获取推荐照片

### 状态管理

应用使用 Pinia 进行状态管理：

1. **认证状态** (`src/stores/authStore.js`)
   - 用户信息管理
   - 登录状态维护
   - Token 存储

2. **照片状态** (`src/stores/photoStore.js`)
   - 照片数据管理
   - 标签、文件夹、地点元数据
   - 筛选和搜索功能
   - 推荐照片功能
   - 加载状态和错误处理

### 主要组件

- **Home.vue**: 主界面，包含照片展示、筛选和推荐功能
- **Login.vue**: 登录界面
- **Sidebar.vue**: 侧边栏导航，包含标签、文件夹、地点和推荐页面
- **FilterStatus.vue**: 筛选状态显示组件
- **PhotoGrid.vue**: 瀑布流照片展示组件
- **PhotoDialog.vue**: 照片详情对话框组件
- 使用 Material Web Components 构建 UI

## 开发说明

### 本地开发

1. 启动前端开发服务器：
   ```bash
   npm run dev
   ```

2. 启动后端模拟服务器：
   ```bash
   npm run serve
   ```

3. 访问应用：`http://localhost:5173`

### 生产部署

1. 构建前端：
   ```bash
   npm run build
   ```

2. 配置真实 API 服务器地址

3. 部署构建后的静态文件

### 环境变量

建议使用环境变量配置 API 基础 URL：

```env
VITE_API_BASE_URL=http://your-api-server.com/api
```

## 注意事项

1. 所有 API 请求都需要在请求头中包含认证 Token
2. 照片上传功能需要额外的文件上传接口
3. 分页和筛选参数支持灵活的查询需求
4. 错误处理机制确保应用稳定性