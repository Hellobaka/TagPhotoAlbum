<template>
  <Transition name="dialog-fade">
    <div v-if="show" class="dialog-overlay">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">管理通行密钥</h2>
            <md-icon-button @click="closeDialog" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="loading-state">
              <md-circular-progress indeterminate></md-circular-progress>
              <p class="md-typescale-body-medium">正在加载通行密钥...</p>
            </div>

            <!-- 通行密钥列表 -->
            <div v-else-if="passkeys.length > 0" class="passkeys-list">
              <h3 class="md-typescale-title-medium section-title">已注册的通行密钥</h3>
              <div class="passkey-item" v-for="passkey in passkeys" :key="passkey.id">
                <div class="passkey-info">
                  <md-icon class="passkey-icon">fingerprint</md-icon>
                  <div class="passkey-details">
                    <p class="passkey-name">{{ passkey.deviceName || '未命名设备' }}</p>
                    <p class="passkey-meta">
                      创建时间：{{ formatDate(passkey.createAt) }}
                    </p>
                    <p class="passkey-meta" v-if="passkey.lastUsedAt">
                      上次使用：{{ formatDate(passkey.lastUsedAt) }}
                    </p>
                  </div>
                </div>
                <md-icon-button
                  @click="deletePasskey(passkey)"
                  class="delete-btn"
                  title="删除此通行密钥"
                >
                  <span class="material-symbols-outlined">delete</span>
                </md-icon-button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <md-icon class="empty-icon">fingerprint</md-icon>
              <p class="md-typescale-body-medium">您尚未设置任何通行密钥</p>
            </div>
          </div>

          <div class="dialog-actions">
            <md-text-button @click="closeDialog" style="padding-left: 15px; padding-right: 15px;">
              关闭
            </md-text-button>
            <md-filled-button
              @click="addNewPasskey"
              style="padding-left: 15px; padding-right: 15px;"
              :disabled="isCreatingPasskey"
            >
              <md-icon slot="icon">add</md-icon>
              <span v-if="!isCreatingPasskey" :disabled="!isPasskeySupported">添加通行密钥</span>
              <span v-else>正在创建...</span>
            </md-filled-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- 通行密钥名称输入对话框 -->
  <PasskeyNameDialog
    :show="showPasskeyNameDialog"
    :loading="isConfirmingPasskey"
    @confirm="handlePasskeyNameConfirm"
    @close="closePasskeyNameDialog"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePhotoStore } from '@/stores/photoStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { photoApi } from '@/api/photoApi'
import PasskeyNameDialog from '@/components/PasskeyNameDialog.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'add-passkey'])

// 响应式数据
const passkeys = ref([])
const isLoading = ref(false)
const isCreatingPasskey = ref(false)
const isConfirmingPasskey = ref(false)
const showPasskeyNameDialog = ref(false)
const pendingPasskeyData = ref(null)
const isPasskeySupported = ref(false)

// 使用 Pinia store
const photoStore = usePhotoStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// 检查 WebAuthn 支持
const checkPasskeySupport = () => {
  isPasskeySupported.value =
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function' &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
}

onMounted(()=>{
  checkPasskeySupport()
})

// 监听显示状态变化
watch(() => props.show, async (newValue) => {
  if (newValue) {
    await loadPasskeys()
  } else {
    // 关闭时重置状态
    passkeys.value = []
    isLoading.value = false
  }
})

// 加载通行密钥列表
const loadPasskeys = async () => {
  try {
    isLoading.value = true
    const response = await photoApi.getUserPasskeys()
    passkeys.value = response.data || []
  } catch (error) {
    console.error('Failed to load passkeys:', error)
    notificationStore.showError('加载通行密钥失败')
  } finally {
    isLoading.value = false
  }
}

// 删除通行密钥
const deletePasskey = async (passkey) => {
  if (!confirm(`确定要删除通行密钥 "${passkey.deviceName || '未命名设备'}" 吗？`)) {
    return
  }

  try {
    await photoApi.deletePasskey(passkey.id)
    notificationStore.showSuccess('通行密钥已删除')
    // 重新加载列表
    await loadPasskeys()
    // 通知父组件更新状态
    emit('passkey-deleted')
  } catch (error) {
    console.error('Failed to delete passkey:', error)
    notificationStore.showError('删除通行密钥失败')
  }
}

// 添加新通行密钥
const addNewPasskey = async () => {
  await registerNewPasskey()
}

// 注册新通行密钥
const registerNewPasskey = async () => {
  try {
    isCreatingPasskey.value = true

    if (!authStore.user || !authStore.user?.username) {
      throw {name: 'NotLogon'}
    }

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

    if (error.name === 'NotAllowedError') {
      notificationStore.showError('用户取消了注册')
    } else if (error.name === 'NotLogon') {
      notificationStore.showError('当前用户未登录或状态错误')
    } else if (error.name === 'NotSupportedError') {
      notificationStore.showError('浏览器不支持通行密钥')
    } else {
      notificationStore.showError('通行密钥注册失败: ' + error)
    }
  } finally {
    isCreatingPasskey.value = false
  }
}

// 处理通行密钥名称确认
const handlePasskeyNameConfirm = async (deviceName) => {
  try {
    isConfirmingPasskey.value = true

    const notificationStore = useNotificationStore()

    if (!pendingPasskeyData.value) {
      throw new Error('没有待处理的通行密钥数据')
    }

    // 添加设备名称到注册数据
    const registrationData = {
      ...pendingPasskeyData.value,
      deviceName
    }

    // 发送注册结果到后端
    const result = await photoApi.registerPasskey(registrationData)

    if (result && result.success) {
      notificationStore.showSuccess('通行密钥注册成功')
      // 重新加载通行密钥列表
      await loadPasskeys()
    } else {
      notificationStore.showError('通行密钥注册失败')
    }

  } catch (error) {
    console.error('Failed to complete passkey registration:', error)
    const notificationStore = useNotificationStore()
    notificationStore.showError('通行密钥注册失败')
  } finally {
    // 重置状态
    isConfirmingPasskey.value = false
    closePasskeyNameDialog()
  }
}

// 关闭通行密钥名称对话框
const closePasskeyNameDialog = () => {
  showPasskeyNameDialog.value = false
  pendingPasskeyData.value = null
  isConfirmingPasskey.value = false
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Base64 URL 转换工具函数
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

// 方法
const closeDialog = () => {
  emit('close')
}
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100; /* 增加z-index确保覆盖侧边栏 */
  padding: 20px;
}

.dialog-container {
  background: var(--md-sys-color-surface);
  border-radius: 28px;
  box-shadow: var(--md-sys-elevation-level3);
  max-width: 600px;
  max-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  margin-bottom: 16px;
}

.close-btn {
  margin-left: auto;
}

.dialog-content {
  padding: 0 24px;
  flex: 1;
  overflow: auto;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* 通行密钥列表 */
.section-title {
  margin-bottom: 16px;
  color: var(--md-sys-color-on-surface);
}

.passkeys-list {
  margin-bottom: 24px;
}

.passkey-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  background: var(--md-sys-color-surface-container-low);
  margin-bottom: 8px;
}

.passkey-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.passkey-icon {
  color: var(--md-sys-color-primary);
}

.passkey-details {
  flex: 1;
}

.passkey-name {
  margin: 0;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.passkey-meta {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.delete-btn {
  color: var(--md-sys-color-error);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-icon {
  font-size: 48px;
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

/* 动画样式 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-overlay {
    padding: 10px;
  }

  .dialog-container {
    max-width: 90vw;
    max-height: 90vh;
  }

  .dialog-content {
    padding: 0 16px;
  }

  .passkey-item {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px 16px 0 16px;
  }

  .dialog-actions {
    padding: 12px 16px 16px 16px;
    flex-direction: column;
  }

  .passkey-info {
    gap: 8px;
  }
}
</style>