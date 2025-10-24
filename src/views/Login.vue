<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <span class="material-symbols-outlined logo-icon">photo_library</span>
        <h1 class="md-typescale-headline-medium">Tag Photo Album</h1>
        <p class="md-typescale-body-medium">登录以管理您的照片收藏</p>
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <md-filled-text-field
          :value="username"
          @input="e => username = e.target.value"
          label="用户名"
          type="text"
          required
          class="form-field"
        >
          <span slot="leading-icon" class="material-symbols-outlined">person</span>
        </md-filled-text-field>

        <md-filled-text-field
          :value="password"
          @input="e => password = e.target.value"
          @keyup.enter="handleLogin"
          label="密码"
          type="password"
          required
          class="form-field"
        >
          <span slot="leading-icon" class="material-symbols-outlined">lock</span>
        </md-filled-text-field>

        <md-filled-button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading" class="material-symbols-outlined loading-icon">progress_activity</span>
          <span v-else>登录</span>
        </md-filled-button>
      </form>

      <!-- 通行密钥登录 -->
      <div class="passkey-section">
        <div class="divider">
          <span>或</span>
        </div>
        <div class="passkey-btn-container" :title="!isPasskeySupported ? '当前浏览器不支持通过通行密钥登录' : ''" :style="!isPasskeySupported ? 'cursor: not-allowed' : ''">
          <md-filled-tonal-button
            @click="handlePasskeyLogin"
            class="passkey-btn"
            :disabled="isLoading || !isPasskeySupported"
          >
            <md-icon slot="icon">fingerprint</md-icon>
            使用通行密钥登录
          </md-filled-tonal-button>
        </div>
        <p class="passkey-hint">支持指纹、面容ID、Windows Hello等</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const isPasskeySupported = ref(false)

// 检查 WebAuthn 支持
const checkPasskeySupport = () => {
  // 检查浏览器是否支持 WebAuthn
  isPasskeySupported.value =
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function' &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
}

// 登录处理
const handleLogin = async () => {
  console.log('Login attempt:', { username: username.value })

  isLoading.value = true
  error.value = ''

  try {
    const success = await authStore.login(username.value, password.value)
    console.log('Login result:', success)
    if (success[0]) {
      router.push('/')
    } else {
      error.value = success[1] || '登录失败，请检查用户名和密码'
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 通行密钥登录处理
const handlePasskeyLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const result = await authStore.loginWithPasskey()

    if (result[0]) {
      // 登录成功，跳转到首页
      router.push('/')
    } else {
      error.value = result[1]
    }
  } catch (err) {
    console.error('Passkey login error:', err)
    error.value = '通行密钥登录失败，请重试或使用传统方式登录'
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时检查 WebAuthn 支持
checkPasskeySupport()
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--md-sys-color-primary-container), var(--md-sys-color-secondary-container));
  padding: 20px;
}

.login-card {
  background: var(--md-sys-color-surface);
  border-radius: 28px;
  box-shadow: var(--md-sys-elevation-level3);
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.logo-section {
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  color: var(--md-sys-color-primary);
  margin-bottom: 16px;
}

.logo-section h1 {
  margin: 0 0 8px 0;
  color: var(--md-sys-color-on-surface);
}

.logo-section p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.form-field {
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 48px;
  margin-top: 8px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 通信密钥登录样式 */
.passkey-section {
  margin-top: 24px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--md-sys-color-outline);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--md-sys-color-outline-variant);
}

.divider span {
  padding: 0 12px;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
}

.passkey-btn-container {
  position: relative;
  width: 100%;
}

.passkey-btn {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.passkey-btn:disabled {
  cursor: not-allowed;
}

.passkey-btn .material-symbols-outlined {
  font-size: 20px;
}

.passkey-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-radius: 12px;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 18px;
}

.demo-info {
  padding: 16px;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.demo-info p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
    margin: 20px;
  }

  .logo-icon {
    font-size: 48px;
  }
}
</style>