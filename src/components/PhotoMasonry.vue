<template>
  <div class="masonry-grid">
    <div
      v-for="photo in photos"
      :key="photo.id"
      class="masonry-item"
      @click="$emit('photo-click', photo)"
    >
      <v-img
        :src="photo.url"
        :alt="photo.title"
        cover
        class="masonry-image"
      />
      <div class="photo-overlay">
        <div class="photo-info">
          <h4>{{ photo.title }}</h4>
          <div class="tags">
            <v-chip
              v-for="tag in photo.tags.slice(0, 2)"
              :key="tag"
              size="small"
              class="mr-1 mb-1"
            >
              {{ tag }}
            </v-chip>
            <v-chip v-if="photo.tags.length > 2" size="small" color="grey">
              +{{ photo.tags.length - 2 }}
            </v-chip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  photos: {
    type: Array,
    required: true
  }
})

defineEmits(['photo-click'])
</script>

<style scoped>
.masonry-grid {
  column-count: 4;
  column-gap: 16px;
  padding: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.masonry-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.masonry-image {
  width: 100%;
  height: auto;
  display: block;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}

.masonry-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.tags {
  display: flex;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (max-width: 768px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>