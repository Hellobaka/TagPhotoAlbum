import { defineStore } from 'pinia'

export const usePhotoStore = defineStore('photos', {
  state: () => ({
    photos: [],
    tags: [],
    folders: [],
    locations: [],
    selectedPhoto: null,
    activeTab: 'tags'
  }),

  getters: {
    filteredPhotos: (state) => {
      switch (state.activeTab) {
        case 'tags':
          return state.photos
        case 'folders':
          return state.photos
        case 'locations':
          return state.photos
        default:
          return state.photos
      }
    },

    allTags: (state) => {
      const allTags = new Set()
      state.photos.forEach(photo => {
        photo.tags.forEach(tag => allTags.add(tag))
      })
      return Array.from(allTags)
    },

    allFolders: (state) => {
      const folders = new Set()
      state.photos.forEach(photo => folders.add(photo.folder))
      return Array.from(folders)
    },

    allLocations: (state) => {
      const locations = new Set()
      state.photos.forEach(photo => locations.add(photo.location))
      return Array.from(locations)
    }
  },

  actions: {
    setActiveTab(tab) {
      this.activeTab = tab
    },

    setSelectedPhoto(photo) {
      this.selectedPhoto = photo
    },

    updatePhoto(updatedPhoto) {
      const index = this.photos.findIndex(p => p.id === updatedPhoto.id)
      if (index !== -1) {
        this.photos[index] = updatedPhoto
      }
    },

    addTagToPhoto(photoId, tag) {
      const photo = this.photos.find(p => p.id === photoId)
      if (photo && !photo.tags.includes(tag)) {
        photo.tags.push(tag)
      }
    },

    removeTagFromPhoto(photoId, tag) {
      const photo = this.photos.find(p => p.id === photoId)
      if (photo) {
        photo.tags = photo.tags.filter(t => t !== tag)
      }
    },

    // 模拟数据初始化
    initializeMockData() {
      this.photos = [
        {
          id: 1,
          url: "https://kimi-web-img.moonshot.cn/img/i.etsystatic.com/e511a48b614e96a40ca1a5044c8b77de2f9c1da1.jpg",
          title: "抽象艺术作品",
          description: "色彩丰富的抽象艺术作品，展现现代艺术的魅力",
          tags: ["艺术", "抽象", "色彩"],
          folder: "艺术",
          location: "画廊",
          date: "2024-01-15"
        },
        {
          id: 2,
          url: "https://kimi-web-img.moonshot.cn/img/hdqwalls.com/b00314b95b497bcf4af4d9685563e5edc44f8de6.jpg",
          title: "海洋日落",
          description: "壮丽的海洋日落景色，金色的阳光洒在海面上",
          tags: ["风景", "海洋", "日落"],
          folder: "旅行",
          location: "海边",
          date: "2024-02-20"
        },
        {
          id: 3,
          url: "https://kimi-web-img.moonshot.cn/img/i.ytimg.com/5fbb20a8087f2df90ff28821c29157635162fcd5.jpg",
          title: "海浪拍岸",
          description: "海浪拍打岩石的壮观瞬间",
          tags: ["风景", "海洋", "自然"],
          folder: "旅行",
          location: "海岸",
          date: "2024-02-21"
        },
        {
          id: 4,
          url: "https://kimi-web-img.moonshot.cn/img/i.pinimg.com/b38e7b7196e5b141446f04e7120753f1677c4e5a.jpg",
          title: "日落海景",
          description: "美丽的日落海景，天空与海面的完美结合",
          tags: ["风景", "海洋", "日落"],
          folder: "旅行",
          location: "海滩",
          date: "2024-02-22"
        },
        {
          id: 5,
          url: "https://kimi-web-img.moonshot.cn/img/images.photowall.com/6cb821ef04c808b80c5210da395233abc76e66b5.jpg",
          title: "现代抽象画",
          description: "现代风格的抽象画作，几何图形的巧妙组合",
          tags: ["艺术", "抽象", "现代"],
          folder: "艺术",
          location: "美术馆",
          date: "2024-01-20"
        },
        {
          id: 6,
          url: "https://kimi-web-img.moonshot.cn/img/images.saatchiart.com/6271d8dc9dc6aba63c73f35059962a0c24516e86.jpg",
          title: "色彩抽象",
          description: "充满活力的色彩抽象艺术",
          tags: ["艺术", "抽象", "色彩"],
          folder: "艺术",
          location: "画廊",
          date: "2024-01-25"
        },
        {
          id: 7,
          url: "https://kimi-web-img.moonshot.cn/img/sb.ecobnb.net/99132de334f41b66bccae7683a6dfa44b97b6382.jpg",
          title: "森林深处",
          description: "神秘的森林深处，阳光透过树叶洒下",
          tags: ["风景", "森林", "自然"],
          folder: "旅行",
          location: "森林公园",
          date: "2024-03-15"
        },
        {
          id: 8,
          url: "https://kimi-web-img.moonshot.cn/img/media.istockphoto.com/8900c32277cc98e3ba572c51c2240a1b70be3988.jpg",
          title: "森林小径",
          description: "蜿蜒的森林小径，通往未知的目的地",
          tags: ["风景", "森林", "小径"],
          folder: "旅行",
          location: "森林",
          date: "2024-03-16"
        },
        {
          id: 9,
          url: "https://kimi-web-img.moonshot.cn/img/img.freepik.com/496b1bade80cf62fe4853c6ad2da3c55c9d76e4f.jpg",
          title: "抽象几何",
          description: "几何形状的抽象组合",
          tags: ["艺术", "抽象", "几何"],
          folder: "艺术",
          location: "工作室",
          date: "2024-01-30"
        },
        {
          id: 10,
          url: "https://kimi-web-img.moonshot.cn/img/iso.500px.com/8f08aea3f44854172704cf604b7736a76a2ec50d.jpg",
          title: "人像摄影",
          description: "专业的人像摄影作品",
          tags: ["人像", "摄影", "专业"],
          folder: "人像",
          location: "摄影棚",
          date: "2024-04-01"
        },
        {
          id: 11,
          url: "https://kimi-web-img.moonshot.cn/img/i.ebayimg.com/5e4d44b48c9bf6b9827add4cf2e2b51461486087.jpg",
          title: "现代艺术",
          description: "现代风格的抽象艺术作品",
          tags: ["艺术", "抽象", "现代"],
          folder: "艺术",
          location: "画廊",
          date: "2024-02-05"
        },
        {
          id: 12,
          url: "https://kimi-web-img.moonshot.cn/img/media.istockphoto.com/5fe9e671ecc51371390c1a5d87338a8781ed8808.jpg",
          title: "森林光影",
          description: "森林中的光影交错",
          tags: ["风景", "森林", "光影"],
          folder: "旅行",
          location: "森林",
          date: "2024-03-20"
        },
        {
          id: 13,
          url: "https://kimi-web-img.moonshot.cn/img/img.freepik.com/cc65a8f3c3965fda6609a615d5b4136a307d756d.jpg",
          title: "抽象色彩",
          description: "丰富的色彩抽象表现",
          tags: ["艺术", "抽象", "色彩"],
          folder: "艺术",
          location: "工作室",
          date: "2024-02-10"
        },
        {
          id: 14,
          url: "https://kimi-web-img.moonshot.cn/img/www.dreamsart.it/91b3011938f7263e9e84bdddbf95cf1be0ab7a99.jpg",
          title: "艺术画作",
          description: "精美的艺术画作展示",
          tags: ["艺术", "画作", "精美"],
          folder: "艺术",
          location: "美术馆",
          date: "2024-02-15"
        },
        {
          id: 15,
          url: "https://kimi-web-img.moonshot.cn/img/www.publicdomainpictures.net/cd624546df52165df2a2507b0ee94412c50f72d8.jpg",
          title: "海滩风光",
          description: "美丽的海滩风光",
          tags: ["风景", "海滩", "夏天"],
          folder: "旅行",
          location: "海滩",
          date: "2024-05-01"
        },
        {
          id: 16,
          url: "https://kimi-web-img.moonshot.cn/img/wallpapercave.com/7eb663fea29d9c1c7f7df71304301986ab20f407.jpg",
          title: "抽象艺术",
          description: "现代抽象艺术作品",
          tags: ["艺术", "抽象", "现代"],
          folder: "艺术",
          location: "画廊",
          date: "2024-02-25"
        },
        {
          id: 17,
          url: "https://kimi-web-img.moonshot.cn/img/i.etsystatic.com/f5a1df7b555a356556610d521ff7c33019c0f97f.jpg",
          title: "色彩艺术",
          description: "色彩丰富的艺术作品",
          tags: ["艺术", "色彩", "创作"],
          folder: "艺术",
          location: "工作室",
          date: "2024-03-01"
        },
        {
          id: 18,
          url: "https://kimi-web-img.moonshot.cn/img/negativespace.co/1e467ee968d7e5df3c0bbaaa242e2db98a5ffdd2.jpg",
          title: "简约设计",
          description: "简约风格的设计作品",
          tags: ["设计", "简约", "现代"],
          folder: "设计",
          location: "工作室",
          date: "2024-03-05"
        },
        {
          id: 19,
          url: "https://kimi-web-img.moonshot.cn/img/i.pinimg.com/d4704cee9b309fd6a9a3dd376f28e5e5d00da14e.jpg",
          title: "海景日落",
          description: "海边的日落景色",
          tags: ["风景", "海洋", "日落"],
          folder: "旅行",
          location: "海边",
          date: "2024-05-10"
        },
        {
          id: 20,
          url: "https://kimi-web-img.moonshot.cn/img/cdn.expertphotography.com/f50c7a176769ef064b8727ef1df4b6ad1d6cc8a0.jpg",
          title: "街拍摄影",
          description: "城市街头的摄影作品",
          tags: ["街拍", "城市", "人文"],
          folder: "街拍",
          location: "城市街道",
          date: "2024-04-15"
        },
        {
          id: 21,
          url: "https://kimi-web-img.moonshot.cn/img/wallup.net/df20afa108d0be6f20f35855ec46db0dcb45776e.jpg",
          title: "山脉风光",
          description: "壮丽的山脉风光",
          tags: ["风景", "山脉", "自然"],
          folder: "旅行",
          location: "山区",
          date: "2024-05-20"
        },
        {
          id: 22,
          url: "https://kimi-web-img.moonshot.cn/img/wallpapercave.com/b125f44fcdfcc896f383f94c9313f963af71ee80.jpg",
          title: "抽象图案",
          description: "几何抽象图案设计",
          tags: ["艺术", "抽象", "几何"],
          folder: "艺术",
          location: "工作室",
          date: "2024-03-10"
        },
        {
          id: 23,
          url: "https://kimi-web-img.moonshot.cn/img/images.squarespace-cdn.com/5a63a5782b5955ceb2b8a29c742f4234e9515626.jpg",
          title: "现代艺术",
          description: "现代风格的抽象艺术",
          tags: ["艺术", "抽象", "现代"],
          folder: "艺术",
          location: "画廊",
          date: "2024-03-15"
        },
        {
          id: 24,
          url: "https://kimi-web-img.moonshot.cn/img/images.pexels.com/6f6b757a7050fb1dbdcc10853fde29a2cdc30811.jpeg",
          title: "山峦叠嶂",
          description: "层层叠叠的山峦景色",
          tags: ["风景", "山脉", "自然"],
          folder: "旅行",
          location: "山区",
          date: "2024-05-25"
        },
        {
          id: 25,
          url: "https://kimi-web-img.moonshot.cn/img/img.freepik.com/071bc60e35b060a1d1ad4ec6911185b19c2dd19d.jpg",
          title: "艺术构图",
          description: "精心构图的艺术作品",
          tags: ["艺术", "构图", "创作"],
          folder: "艺术",
          location: "工作室",
          date: "2024-03-20"
        },
        {
          id: 26,
          url: "https://kimi-web-img.moonshot.cn/img/m.media-amazon.com/22ed8bc2960f705d0b1e8f556da65d9c1ce9d0dc.jpg",
          title: "色彩构成",
          description: "色彩构成艺术作品",
          tags: ["艺术", "色彩", "构成"],
          folder: "艺术",
          location: "画廊",
          date: "2024-03-25"
        },
        {
          id: 27,
          url: "https://kimi-web-img.moonshot.cn/img/img.freepik.com/6f968e974d2ae08e9227801c6c24c78bdef7c8c9.jpg",
          title: "抽象设计",
          description: "抽象风格的设计作品",
          tags: ["设计", "抽象", "艺术"],
          folder: "设计",
          location: "工作室",
          date: "2024-04-01"
        },
        {
          id: 28,
          url: "https://kimi-web-img.moonshot.cn/img/wallpapers.com/ee32a699667f6ad16a0ab069694fbcfea9c78029.jpg",
          title: "山峰日出",
          description: "山峰上的日出景色",
          tags: ["风景", "山脉", "日出"],
          folder: "旅行",
          location: "山顶",
          date: "2024-06-01"
        },
        {
          id: 29,
          url: "https://kimi-web-img.moonshot.cn/img/www.digitalphotomentor.com/e9c3b52c41e7907bf01dbc2b2deddff8a5fc5903.jpg",
          title: "旅行记忆",
          description: "美好的旅行回忆",
          tags: ["旅行", "回忆", "美好"],
          folder: "旅行",
          location: "各个地方",
          date: "2024-06-05"
        },
        {
          id: 30,
          url: "https://kimi-web-img.moonshot.cn/img/www.josephfiler.com/339357b10c09ceba2e645a6e1ecf7a5d407a5bb3.jpg",
          title: "山水风光",
          description: "美丽的山水风光",
          tags: ["风景", "山水", "自然"],
          folder: "旅行",
          location: "山区",
          date: "2024-06-10"
        }
      ]
    }
  }
})