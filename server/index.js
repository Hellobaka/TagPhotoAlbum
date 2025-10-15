const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../dist')))

// 模拟数据
let photos = [
  {
    id: 1,
    url: "https://kimi-web-img.moonshot.cn/img/i.etsystatic.com/e511a48b614e96a40ca1a5044c8b77de2f9c1da1.jpg",
    title: "抽象艺术作品",
    description: "色彩丰富的抽象艺术作品，展现现代艺术的魅力",
    tags: ["艺术", "抽象", "色彩"],
    folder: "艺术",
    location: "画廊",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    url: "https://kimi-web-img.moonshot.cn/img/hdqwalls.com/b00314b95b497bcf4af4d9685563e5edc44f8de6.jpg",
    title: "海洋日落",
    description: "壮丽的海洋日落景色，金色的阳光洒在海面上",
    tags: ["风景", "海洋", "日落"],
    folder: "旅行",
    location: "海边",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    url: "https://kimi-web-img.moonshot.cn/img/i.ytimg.com/5fbb20a8087f2df90ff28821c29157635162fcd5.jpg",
    title: "海浪拍岸",
    description: "海浪拍打岩石的壮观瞬间",
    tags: ["风景", "海洋", "自然"],
    folder: "旅行",
    location: "海岸",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    url: "https://kimi-web-img.moonshot.cn/img/i.pinimg.com/b38e7b7196e5b141446f04e7120753f1677c4e5a.jpg",
    title: "日落海景",
    description: "美丽的日落海景，天空与海面的完美结合",
    tags: ["风景", "海洋", "日落"],
    folder: "旅行",
    location: "海滩",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    url: "https://kimi-web-img.moonshot.cn/img/images.photowall.com/6cb821ef04c808b80c5210da395233abc76e66b5.jpg",
    title: "现代抽象画",
    description: "现代风格的抽象画作，几何图形的巧妙组合",
    tags: ["艺术", "抽象", "现代"],
    folder: "艺术",
    location: "美术馆",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    url: "https://kimi-web-img.moonshot.cn/img/images.saatchiart.com/6271d8dc9dc6aba63c73f35059962a0c24516e86.jpg",
    title: "色彩抽象",
    description: "充满活力的色彩抽象艺术",
    tags: ["艺术", "抽象", "色彩"],
    folder: "艺术",
    location: "画廊",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    url: "https://kimi-web-img.moonshot.cn/img/sb.ecobnb.net/99132de334f41b66bccae7683a6dfa44b97b6382.jpg",
    title: "森林深处",
    description: "神秘的森林深处，阳光透过树叶洒下",
    tags: ["风景", "森林", "自然"],
    folder: "旅行",
    location: "森林公园",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 8,
    url: "https://kimi-web-img.moonshot.cn/img/media.istockphoto.com/8900c32277cc98e3ba572c51c2240a1b70be3988.jpg",
    title: "森林小径",
    description: "蜿蜒的森林小径，通往未知的目的地",
    tags: ["风景", "森林", "小径"],
    folder: "旅行",
    location: "森林",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9,
    url: "https://kimi-web-img.moonshot.cn/img/img.freepik.com/496b1bade80cf62fe4853c6ad2da3c55c9d76e4f.jpg",
    title: "抽象几何",
    description: "几何形状的抽象组合",
    tags: ["艺术", "抽象", "几何"],
    folder: "艺术",
    location: "工作室",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 10,
    url: "https://kimi-web-img.moonshot.cn/img/iso.500px.com/8f08aea3f44854172704cf604b7736a76a2ec50d.jpg",
    title: "人像摄影",
    description: "专业的人像摄影作品",
    tags: ["人像", "摄影", "专业"],
    folder: "人像",
    location: "摄影棚",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// 获取所有照片
app.get('/api/photos', (req, res) => {
  const { tag, folder, location, page = 1, limit = 20 } = req.query

  let filteredPhotos = [...photos]

  // 根据查询参数筛选
  if (tag) {
    filteredPhotos = filteredPhotos.filter(photo =>
      photo.tags.includes(tag)
    )
  }

  if (folder) {
    filteredPhotos = filteredPhotos.filter(photo =>
      photo.folder === folder
    )
  }

  if (location) {
    filteredPhotos = filteredPhotos.filter(photo =>
      photo.location === location
    )
  }

  // 分页
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex)

  res.json({
    data: paginatedPhotos,
    total: filteredPhotos.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredPhotos.length / limit)
  })
})

// 获取单个照片
app.get('/api/photos/:id', (req, res) => {
  const photo = photos.find(p => p.id === parseInt(req.params.id))
  if (!photo) {
    return res.status(404).json({ error: '照片未找到' })
  }
  res.json(photo)
})

// 创建照片
app.post('/api/photos', (req, res) => {
  const { title, description, tags, folder, location, url } = req.body

  if (!title || !url) {
    return res.status(400).json({ error: '标题和URL是必填项' })
  }

  const newPhoto = {
    id: Math.max(...photos.map(p => p.id)) + 1,
    title,
    description: description || '',
    tags: tags || [],
    folder: folder || '默认文件夹',
    location: location || '',
    url,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  photos.push(newPhoto)
  res.status(201).json(newPhoto)
})

// 更新照片
app.put('/api/photos/:id', (req, res) => {
  const photoIndex = photos.findIndex(p => p.id === parseInt(req.params.id))

  if (photoIndex === -1) {
    return res.status(404).json({ error: '照片未找到' })
  }

  const updatedPhoto = {
    ...photos[photoIndex],
    ...req.body,
    id: parseInt(req.params.id),
    updatedAt: new Date().toISOString()
  }

  photos[photoIndex] = updatedPhoto
  res.json(updatedPhoto)
})

// 删除照片
app.delete('/api/photos/:id', (req, res) => {
  const photoIndex = photos.findIndex(p => p.id === parseInt(req.params.id))

  if (photoIndex === -1) {
    return res.status(404).json({ error: '照片未找到' })
  }

  photos.splice(photoIndex, 1)
  res.status(204).send()
})

// 获取所有标签
app.get('/api/tags', (req, res) => {
  const allTags = new Set()
  photos.forEach(photo => {
    photo.tags.forEach(tag => allTags.add(tag))
  })
  res.json(Array.from(allTags))
})

// 获取所有文件夹
app.get('/api/folders', (req, res) => {
  const folders = new Set()
  photos.forEach(photo => folders.add(photo.folder))
  res.json(Array.from(folders))
})

// 获取所有地点
app.get('/api/locations', (req, res) => {
  const locations = new Set()
  photos.forEach(photo => locations.add(photo.location))
  res.json(Array.from(locations))
})

// 搜索照片
app.get('/api/search', (req, res) => {
  const { q } = req.query

  if (!q) {
    return res.status(400).json({ error: '搜索关键词不能为空' })
  }

  const searchResults = photos.filter(photo =>
    photo.title.toLowerCase().includes(q.toLowerCase()) ||
    photo.description.toLowerCase().includes(q.toLowerCase()) ||
    photo.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase())) ||
    photo.location.toLowerCase().includes(q.toLowerCase())
  )

  res.json({
    data: searchResults,
    total: searchResults.length
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})