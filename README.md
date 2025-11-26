# TagPhotoAlbum

> 一个基于 Vue 3 的现代化照片管理应用，提供智能标签分类、流畅的瀑布流展示和高效的照片组织方式。

## 📸 简介

TagPhotoAlbum 是一个功能强大的照片管理系统，采用 Vue 3 + Pinia + Material Design 3 构建。通过智能标签系统、多维度分类和瀑布流展示，让照片管理变得简单高效。

> **🔗 后端项目**: [TagPhotoAlbum.Server](https://github.com/Hellobaka/TagPhotoAlbum.Server) - ASP.NET Core 后端服务

---

## ✨ 功能特色

- 🏷️ **智能标签系统** - 颜色编码、多标签筛选、中文拼音排序
- 🎨 **瀑布流展示** - 响应式布局、无限滚动、懒加载优化
- 📁 **多维度分类** - 标签、文件夹、地点、评分、推荐、未分类
- 🔐 **现代化认证** - JWT Token + 通行密钥 双重认证
- ⚡ **性能优化** - 按需加载、代码分割、图片渐进加载

---

## 🛠️ 技术栈

- **Vue 3** (v3.5.22) - Composition API
- **Pinia** (v3.0.3) - 状态管理
- **Vue Router** (v4.6.3) - 路由管理
- **Material Web** (v2.4.1) - Material Design 3 组件
- **Vite** (v7.1.11) - 构建工具
- **Axios** (v1.6.0) - HTTP 客户端

---

## 📦 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm >= 10.0.0

### 安装与运行

```bash
# 1. 克隆前端项目
git clone https://github.com/Hellobaka/TagPhotoAlbum.git
cd TagPhotoAlbum

# 2. 安装依赖
npm install

# 3. 配置环境变量
# 修改 config/api.js，配置后端地址
# BASE_URL = 'http://localhost:5085'
# HMAC_KEY = 'your-super-secret-key-that-should-be-at-least-32-characters-long'

# 4. 启动前端开发服务器
npm run dev
```

### 生产构建

生产环境构建需要配置后端地址：

```bash
# 1. 编辑 build.bat 文件，填入后端地址和 HMAC 密钥
# set VITE_API_BASE_URL=https://your-backend-url.com
# set VITE_HMAC_KEY=your-hmac-key-from-backend

# 2. 运行构建脚本
build.bat
```

> [!WARNING]
> `VITE_HMAC_KEY` 必须与后端配置的 HMAC 密钥一致


### 后端配置

本项目需要配合后端服务使用：

```bash
# 1. 克隆后端项目
git clone https://github.com/Helloabaka/TagPhotoAlbum.Server.git

# 2. 按照后端项目 README 配置并启动服务
# 默认运行在 http://localhost:5085
```

> **📖 后端项目地址**: [TagPhotoAlbum.Server](https://github.com/Hellabaka/TagPhotoAlbum.Server)

---


## 📄 许可证

本项目采用 [GPL-3.0 license](./LICENSE) 许可证。

---

<div align="center">

Made with ❤️(Claude Code) by Vue 3 + Material Design 3

</div>