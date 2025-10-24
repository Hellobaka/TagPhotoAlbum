<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <md-icon-button @click="toggleSidebar" class="collapse-btn">
        <span class="material-symbols-outlined">{{ isCollapsed ? 'chevron_right' : 'chevron_left' }}</span>
      </md-icon-button>
      <md-icon-button @click="handleLogout" class="logout-btn" v-if="!isCollapsed">
        <span class="material-symbols-outlined">logout</span>
      </md-icon-button>
    </div>

    <nav class="nav-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="nav-tab"
        :class="{ 'active': activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        <span class="material-symbols-outlined tab-icon">{{ tab.icon }}</span>
        <span class="tab-label" v-if="!isCollapsed">{{ tab.label }}</span>
      </div>
      <div
        class="nav-tab"
        @click="handlePasskeyManagement"
      >
        <span class="material-symbols-outlined tab-icon">fingerprint</span>
        <span class="tab-label" v-if="!isCollapsed">{{ hasPasskey ? '您已设置通行密钥' : '添加通行密钥' }}</span>
      </div>
    </nav>

    <!-- 筛选内容区域 -->
    <div class="filter-content" v-if="!isCollapsed">
      <!-- 标签筛选 -->
      <div v-if="activeTab === 'tags'" class="filter-section">
        <h3 class="filter-title">标签</h3>
        <div class="filter-items">
          <md-filter-chip
            v-for="tag in photoStore.tags"
            :key="tag.name"
            :label="`${tag.name} (${tag.count})`"
            :selected="selectedTags.includes(tag.name)"
            @click="toggleTag(tag.name)"
            :class="getTagColorClass(tag.name)"
          />
        </div>
      </div>

      <!-- 文件夹筛选 -->
      <div v-if="activeTab === 'folders'" class="filter-section">
        <h3 class="filter-title">文件夹</h3>
        <div class="filter-items">
          <md-filter-chip
            v-for="folder in photoStore.allFolders"
            :key="folder"
            :label="folder"
            :selected="selectedFolder === folder"
            @click="selectFolder(folder)"
          />
        </div>
      </div>

      <!-- 地点筛选 -->
      <div v-if="activeTab === 'locations'" class="filter-section">
        <h3 class="filter-title">地点</h3>
        <div class="filter-items">
          <md-filter-chip
            v-for="location in photoStore.allLocations"
            :key="location"
            :label="location"
            :selected="selectedLocation === location"
            @click="selectLocation(location)"
          />
        </div>
      </div>
    </div>

    <!-- 通行密钥名称输入对话框 -->
    <PasskeyNameDialog
      :show="showPasskeyNameDialog"
      @confirm="handlePasskeyNameConfirm"
      @close="closePasskeyNameDialog"
    />
  </div>
</template>

<script setup>
import { usePhotoStore } from '@/stores/photoStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useRouter } from 'vue-router'
import { onMounted, watch, ref } from 'vue'
import { photoApi } from '@/api/photoApi'
import PasskeyNameDialog from '@/components/PasskeyNameDialog.vue'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: 'tags'
  },
  selectedTags: {
    type: Array,
    default: () => []
  },
  selectedFolder: {
    type: String,
    default: null
  },
  selectedLocation: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'toggle-sidebar',
  'set-active-tab',
  'toggle-tag',
  'select-folder',
  'select-location',
  'logout'
])

// 标签页配置
const tabs = [
  { id: 'recommend', label: '推荐', icon: 'recommend' },
  { id: 'tags', label: '标签', icon: 'local_offer' },
  { id: 'folders', label: '文件夹', icon: 'folder' },
  { id: 'locations', label: '地点', icon: 'location_on' },
  { id: 'uncategorized', label: '未分类', icon: 'folder_open' },
]

// 使用 Pinia store
const photoStore = usePhotoStore()
const authStore = useAuthStore()
const router = useRouter()

// 响应式数据
const hasPasskey = ref(false)
const isPasskeySupported = ref(false)
const showPasskeyNameDialog = ref(false)
const pendingPasskeyData = ref(null)

// 检查 WebAuthn 支持
const checkPasskeySupport = () => {
  isPasskeySupported.value =
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function' &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
}

// 检查用户是否已有通行密钥
const checkUserPasskeys = async () => {
  try {
    const response = await photoApi.getUserPasskeys()
    hasPasskey.value = response.data && response.data.length > 0
  } catch (error) {
    console.error('Failed to check user passkeys:', error)
    hasPasskey.value = false
  }
}

// 监听标签页变化，按需加载筛选数据
watch(() => props.activeTab, async (newTab) => {
  if (!props.isCollapsed) {
    await loadFilterData(newTab)
  }
})

// 监听侧边栏展开状态，展开时加载筛选数据
watch(() => props.isCollapsed, async (isCollapsed) => {
  if (!isCollapsed) {
    await loadFilterData(props.activeTab)
  }
})

// 按需加载筛选数据
const loadFilterData = async (tabId) => {
  try {
    switch (tabId) {
      case 'tags':
        if (photoStore.tags.length === 0) {
          await photoStore.getTagsData()
        }
        break
      case 'folders':
        if (photoStore.folders.length === 0) {
          await photoStore.getFoldersData()
        }
        break
      case 'locations':
        if (photoStore.locations.length === 0) {
          await photoStore.getLocationsData()
        }
        break
    }
  } catch (error) {
    console.error(`Failed to load filter data for ${tabId}:`, error)
  }
}

// 通行密钥管理
const handlePasskeyManagement = async () => {
  if (hasPasskey.value) {
    // 已有通行密钥，显示管理选项
    await showPasskeyManagementDialog()
  } else {
    // 注册新通行密钥
    await registerNewPasskey()
  }
}

// 显示通行密钥管理对话框
const showPasskeyManagementDialog = async () => {
  try {
    const notificationStore = useNotificationStore()

    // 获取用户通行密钥列表
    const response = await photoApi.getUserPasskeys()
    const passkeys = response.data || []

    if (passkeys.length === 0) {
      notificationStore.showInfo('您尚未设置通行密钥')
      hasPasskey.value = false
      return
    }

    // 这里可以扩展为显示一个管理对话框
    // 目前先显示基本信息
    const passkeyInfo = passkeys[0]
    notificationStore.showInfo(`已设置通行密钥：${passkeyInfo.deviceName || '默认设备'}`)

    // 询问用户是否要删除
    const shouldDelete = confirm('是否要删除此通行密钥？')
    if (shouldDelete) {
      await deletePasskey(passkeyInfo.id)
    }
  } catch (error) {
    console.error('Failed to show passkey management dialog:', error)
    const notificationStore = useNotificationStore()
    notificationStore.showError('获取通行密钥信息失败')
  }
}

// 删除通行密钥
const deletePasskey = async (passkeyId) => {
  try {
    const notificationStore = useNotificationStore()
    await photoApi.deletePasskey(passkeyId)
    notificationStore.showSuccess('通行密钥已删除')
    hasPasskey.value = false
  } catch (error) {
    console.error('Failed to delete passkey:', error)
    const notificationStore = useNotificationStore()
    notificationStore.showError('删除通行密钥失败')
  }
}

// 注册新通行密钥
const registerNewPasskey = async () => {
  try {
    if (!authStore.user || !authStore.user?.username) {
      throw {name: 'NotLogon'}
    }
    const notificationStore = useNotificationStore()

    // 1. 获取注册选项
    const options = await photoApi.getPasskeyRegistrationOptions()

    // 2. 转换选项格式
    const publicKey = {
      challenge: base64urlToBytes(options.data.challenge),
      rp: options.data.rp,
      user: {
        id: base64urlToBytes(options.data.user.id),
        name: options.data.user.name,
        displayName: options.data.user.displayName
      },
      pubKeyCredParams: options.data.pubKeyCredParams,
      authenticatorSelection: options.data.authenticatorSelection,
      timeout: options.data.timeout,
      attestation: options.data.attestation
    }

    // 3. 调用 WebAuthn API 创建通行密钥
    const credential = await navigator.credentials.create({
      publicKey
    })

    // 4. 转换注册结果
    const registrationData = {
      response: {
        id: credential.id,
        rawId: arrayBufferToBase64Url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
          transports: credential.response.getTransports?.() || ['internal']
        },
        type: credential.type
      },
    }

    // 5. 保存注册数据并显示名称输入对话框
    pendingPasskeyData.value = registrationData
    showPasskeyNameDialog.value = true

  } catch (error) {
    console.error('Passkey registration error:', error)
    const notificationStore = useNotificationStore()

    if (error.name === 'NotAllowedError') {
      notificationStore.showError('用户取消了注册')
    } else if (error.name === 'NotLogon') {
      notificationStore.showError('当前用户未登录或状态错误')
    } else if (error.name === 'NotSupportedError') {
      notificationStore.showError('浏览器不支持通行密钥')
    } else {
      notificationStore.showError('通行密钥注册失败')
    }
  }
}

// 处理通行密钥名称确认
const handlePasskeyNameConfirm = async (deviceName) => {
  try {
    const notificationStore = useNotificationStore()

    if (!pendingPasskeyData.value) {
      throw new Error('没有待处理的通行密钥数据')
    }

    // 添加设备名称到注册数据
    const registrationData = {
      ...pendingPasskeyData.value,
      deviceName: deviceName
    }

    // 发送注册结果到后端
    const result = await photoApi.registerPasskey(registrationData)

    if (result && result.success) {
      notificationStore.showSuccess('通行密钥注册成功')
      hasPasskey.value = true
    } else {
      notificationStore.showError('通行密钥注册失败')
    }

  } catch (error) {
    console.error('Failed to complete passkey registration:', error)
    const notificationStore = useNotificationStore()
    notificationStore.showError('通行密钥注册失败')
  } finally {
    // 重置状态
    closePasskeyNameDialog()
  }
}

// 关闭通行密钥名称对话框
const closePasskeyNameDialog = () => {
  showPasskeyNameDialog.value = false
  pendingPasskeyData.value = null
}

const base64urlToBytes = (base64url) => {
  const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binaryString = atob(padded);
  return Uint8Array.from(binaryString, c => c.charCodeAt(0));
}

const arrayBufferToBase64Url = (arrayBuffer) => {
  // 1. 确保输入是 ArrayBuffer 或 Uint8Array，并转换为 Uint8Array 视图
  const uint8Array = arrayBuffer instanceof Uint8Array
    ? arrayBuffer
    : new Uint8Array(arrayBuffer);

  // 2. 将 Uint8Array 转换为一个 "binary string"
  //    btoa() 函数期望一个字符串，其中每个字符的编码点代表一个字节。
  //    对于大型 ArrayBuffer，直接使用 String.fromCharCode(...uint8Array) 会导致栈溢出。
  //    因此，我们使用分块处理的方式。
  let binaryString = '';
  const chunkSize = 8192; // 可以根据需要调整分块大小，例如 8KB

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(
      null, // apply 的第一个参数是 this，这里不需要
      uint8Array.subarray(i, i + chunkSize) // 获取当前分块
    );
  }

  // 3. 将二进制字符串编码为标准的 Base64
  const base64 = btoa(binaryString);

  // 4. 将标准 Base64 转换为 Base64Url
  //    - 替换 '+' 为 '-'
  //    - 替换 '/' 为 '_'
  //    - 移除末尾的 '=' 填充字符
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

onMounted(() => {
  // 如果侧边栏展开，加载当前标签页的筛选数据
  if (!props.isCollapsed) {
    loadFilterData(props.activeTab)
  }

  // 检查浏览器支持和用户通行密钥状态
  checkPasskeySupport()
  if (isPasskeySupported.value && authStore.isAuthenticated) {
    checkUserPasskeys()
  }
})

// 方法
const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const setActiveTab = (tabId) => {
  emit('set-active-tab', tabId)
}

const toggleTag = (tag) => {
  emit('toggle-tag', tag)
}

const selectFolder = (folder) => {
  emit('select-folder', folder)
}

const selectLocation = (location) => {
  emit('select-location', location)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const getTagColorClass = (tag) => {
  // 预定义一组颜色类名
  const colorClasses = [
    'tag-color-art',
    'tag-color-abstract',
    'tag-color-color',
    'tag-color-nature',
    'tag-color-travel',
    'tag-color-people',
    'tag-color-building',
    'tag-color-design',
    'tag-color-modern',
    'tag-color-photo'
  ]

  // 根据标签字符串生成一个稳定的哈希值
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }

  // 使用哈希值选择颜色类名
  const index = Math.abs(hash) % colorClasses.length
  return colorClasses[index]
}
</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: var(--md-sys-color-surface-container-low);
  border-right: 1px solid var(--md-sys-color-outline-variant);
  transition: width 0.3s ease, transform 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 999;
}

.sidebar-collapsed {
  width: 80px;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(-100%);
    border-right: none;
    box-shadow: var(--md-sys-elevation-level3);
  }

  .sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .sidebar-collapsed {
    transform: translateX(-100%);
  }
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.passkey-btn {
  color: var(--md-sys-color-on-surface-variant);
}

.passkey-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.collapse-btn {
  margin-left: 0;
}

.logout-btn {
  color: var(--md-sys-color-on-surface-variant);
}

.nav-tabs {
  padding: 8px 0;
}

.nav-tab {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--md-sys-color-on-surface-variant);
  border-radius: 0;
}

.nav-tab:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.nav-tab.active {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.tab-icon {
  margin-right: 12px;
  font-size: 20px;
}

.tab-label {
  font-weight: 500;
}

/* 筛选内容区域 */
.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 12px;
}

.filter-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .sidebar {
    width: 280px;
  }

  .sidebar-collapsed {
    width: 80px;
  }
}
</style>