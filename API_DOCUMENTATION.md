# Tag Photo Album REST API 文档

## 概述

Tag Photo Album 是一个基于标签的照片管理应用，提供完整的 REST API 接口用于照片的增删改查、标签管理、文件夹管理和位置管理。

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **认证**: 当前版本无需认证

## API 端点

### 照片管理

#### 获取照片列表

```http
GET /photos
```

**查询参数:**
- `tag` (可选): 按标签筛选
- `folder` (可选): 按文件夹筛选
- `location` (可选): 按地点筛选
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20

**响应示例:**
```json
{
  "data": [
    {
      "id": 1,
      "url": "https://picsum.photos/300/400?random=1",
      "title": "风景照1",
      "description": "美丽的风景照片",
      "tags": ["风景", "自然", "旅行"],
      "folder": "风景集",
      "location": "北京",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### 获取单个照片

```http
GET /photos/{id}
```

**路径参数:**
- `id`: 照片ID

**响应示例:**
```json
{
  "id": 1,
  "url": "https://picsum.photos/300/400?random=1",
  "title": "风景照1",
  "description": "美丽的风景照片",
  "tags": ["风景", "自然", "旅行"],
  "folder": "风景集",
  "location": "北京",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 创建照片

```http
POST /photos
```

**请求体:**
```json
{
  "title": "新照片",
  "url": "https://example.com/photo.jpg",
  "description": "照片描述",
  "tags": ["标签1", "标签2"],
  "folder": "文件夹名",
  "location": "地点"
}
```

**必填字段:**
- `title`: 照片标题
- `url`: 照片URL

#### 更新照片

```http
PUT /photos/{id}
```

**路径参数:**
- `id`: 照片ID

**请求体:**
```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "tags": ["新标签1", "新标签2"],
  "folder": "新文件夹",
  "location": "新地点"
}
```

#### 删除照片

```http
DELETE /photos/{id}
```

**路径参数:**
- `id`: 照片ID

### 标签管理

#### 获取所有标签

```http
GET /tags
```

**响应示例:**
```json
["风景", "人物", "建筑", "自然"]
```

### 文件夹管理

#### 获取所有文件夹

```http
GET /folders
```

**响应示例:**
```json
["风景集", "人物集", "建筑集"]
```

### 地点管理

#### 获取所有地点

```http
GET /locations
```

**响应示例:**
```json
["北京", "上海", "广州"]
```

### 搜索功能

#### 搜索照片

```http
GET /search
```

**查询参数:**
- `q`: 搜索关键词

**响应示例:**
```json
{
  "data": [
    {
      "id": 1,
      "url": "https://picsum.photos/300/400?random=1",
      "title": "风景照1",
      "description": "美丽的风景照片",
      "tags": ["风景", "自然", "旅行"],
      "folder": "风景集",
      "location": "北京",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

## 错误处理

所有 API 端点都返回标准化的错误响应：

```json
{
  "error": "错误描述信息"
}
```

**常见HTTP状态码:**
- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源未找到
- `500`: 服务器内部错误

## 数据模型

### 照片对象

```typescript
interface Photo {
  id: number
  url: string
  title: string
  description: string
  tags: string[]
  folder: string
  location: string
  createdAt: string
  updatedAt: string
}
```

## 使用示例

### JavaScript/TypeScript

```javascript
import { photoApi } from './api/photoApi'

// 获取所有照片
const photos = await photoApi.getPhotos()

// 按标签筛选
const naturePhotos = await photoApi.getPhotos({ tag: '自然' })

// 创建新照片
const newPhoto = await photoApi.createPhoto({
  title: '新照片',
  url: 'https://example.com/photo.jpg',
  tags: ['风景', '旅行']
})

// 更新照片
await photoApi.updatePhoto(1, {
  title: '更新后的标题',
  tags: ['风景', '自然', '旅行']
})

// 搜索照片
const searchResults = await photoApi.searchPhotos('风景')
```

### cURL 示例

```bash
# 获取所有照片
curl -X GET "http://localhost:3001/api/photos"

# 按标签筛选
curl -X GET "http://localhost:3001/api/photos?tag=风景"

# 创建照片
curl -X POST "http://localhost:3001/api/photos" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新照片",
    "url": "https://example.com/photo.jpg",
    "tags": ["风景", "旅行"]
  }'

# 更新照片
curl -X PUT "http://localhost:3001/api/photos/1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题"
  }'
```

## 部署说明

1. 安装依赖：
   ```bash
   npm install
   ```

2. 构建前端：
   ```bash
   npm run build
   ```

3. 启动服务器：
   ```bash
   npm run serve
   ```

4. 访问应用：
   - 前端：http://localhost:3000
   - API：http://localhost:3001/api

## 注意事项

- 当前版本使用内存存储，重启服务器后数据会丢失
- 生产环境建议连接数据库进行持久化存储
- 图片URL需要自行提供，API不处理图片上传