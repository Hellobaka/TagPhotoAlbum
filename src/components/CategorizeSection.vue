<template>
  <div class="categorize-section" :class="{ 'header-hidden': isHeaderHidden }">
    <div class="categorize-container">
      <md-filled-button
        @click="$emit('start-categorization')"
        class="categorize-button"
      >
        <md-icon slot="icon">category</md-icon>
        继续分类
      </md-filled-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isHeaderHidden: {
    type: Boolean,
    default: false
  }
});

defineEmits(['start-categorization']);
</script>

<style scoped>
.categorize-section {
  position: sticky;
  top: var(--header-height, 134px);
  z-index: 9;
  background: var(--md-sys-color-surface);
  padding: 8px 24px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  transition: transform 0.3s ease;
}

.categorize-section.header-hidden {
  transform: translateY(calc(-1 * var(--header-height, 134px)));
}

.categorize-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.categorize-button {
  min-width: 200px;
}
</style>
