<template>
  <Transition name="dialog-fade">
    <div v-if="show" class="dialog-overlay">
      <Transition name="dialog-scale">
        <div class="dialog-container" @click.stop>
          <div class="dialog-header">
            <h2 class="md-typescale-headline-small">设置通行密钥名称</h2>
            <md-icon-button @click="closeDialog" class="close-btn">
              <span class="material-symbols-outlined">close</span>
            </md-icon-button>
          </div>

          <div class="dialog-content">
            <div class="input-section">
              <md-outlined-text-field
                v-model="deviceName"
                label="设备名称"
                :maxlength="50"
                :error="!deviceName.trim()"
                :error-text="!deviceName.trim() ? '请输入设备名称' : ''"
                @keyup.enter="confirm"
                autofocus style="width: 100%;"
              >
                <span slot="leading-icon" class="material-symbols-outlined">devices</span>
              </md-outlined-text-field>
              <div class="hint-text">
                请输入一个易于识别的名称来标识此设备，例如："我的手机"、"工作电脑"等
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <md-text-button @click="closeDialog" style="padding-left: 15px; padding-right: 15px;">
              取消
            </md-text-button>
            <md-text-button
              @click="confirm"
              style="padding-left: 15px; padding-right: 15px;"
              :disabled="!deviceName.trim() || props.loading"
            >
              <span v-if="!props.loading">确认</span>
              <span v-else>正在保存...</span>
            </md-text-button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'close'])

// 响应式数据
const deviceName = ref('')

// 监听显示状态变化
watch(() => props.show, (newValue) => {
  if (newValue) {
    // 显示对话框时重置输入
    deviceName.value = ''
  }
})

// 方法
const closeDialog = () => {
  emit('close')
}

const confirm = () => {
  if (deviceName.value.trim()) {
    emit('confirm', deviceName.value.trim())
    deviceName.value = ''
  }
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
  z-index: 1000;
  padding: 20px;
}

.dialog-container {
  background: var(--md-sys-color-surface);
  border-radius: 28px;
  box-shadow: var(--md-sys-elevation-level3);
  max-width: 500px;
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
}

.input-section {
  margin-bottom: 24px;
}

.hint-text {
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 8px;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
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
  }

  .dialog-content {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px 16px 0 16px;
  }

  .dialog-actions {
    padding: 12px 16px 16px 16px;
  }
}
</style>