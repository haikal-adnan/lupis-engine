<template>
  <div class="relative inline-block" data-component="base-thumbnail">
    <button 
      type="button"
      data-element="thumbnail-trigger"
      :data-loaded="!!resolvedSrc && imgMeta.w > 0"
      :aria-label="`Preview ${name}`"
      class="
        relative flex items-center justify-center overflow-hidden
        rounded border border-border bg-muted/50 
        group hover:border-primary/50 transition-colors
        select-none
      "
      :class="sizeClass"
      @click="openPreview"
    >
      <div 
        v-if="resolvedSrc && imgMeta.w > 0" 
        class="w-full h-full"
        data-element="thumbnail-image"
        :style="thumbnailStyle"
      ></div>
      
      <span v-else class="text-[9px] text-muted-foreground" data-element="thumbnail-empty">{{ fallbackText }}</span>

      <div class="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center z-10">
        <Maximize2 class="w-3.5 h-3.5 text-white drop-shadow-md" />
      </div>
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Maximize2 } from 'lucide-vue-next'
import { usePopImage } from '@composables/usePopImage'

const props = defineProps({
  src: { type: [String, Object, Promise], default: null },
  rect: { type: Object, default: () => ({ x: 0, y: 0, w: 0, h: 0 }) },
  sizeClass: { type: String, default: 'w-12 h-12' },
  name: { type: String, default: 'Texture Preview' },
  fallbackText: { type: String, default: 'Empty' }
})

const { showImage } = usePopImage()

const resolvedSrc = ref(null)
const imgMeta = reactive({ w: 0, h: 0 })

const fetchImageSize = async (url) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ width: 512, height: 512 }), 100);
  });
}

const getThumbnailStyle = (url, rect, meta, size) => {
  return {
    backgroundImage: `url('${url}')`,
    backgroundSize: 'cover', 
    backgroundPosition: 'center',
    imageRendering: 'pixelated'
  };
}

watch(() => props.src, async (val) => {
  if (!val) {
    resolvedSrc.value = null
    imgMeta.w = 0
    imgMeta.h = 0
    return
  }

  try {
    const url = val instanceof Promise ? await val : val
    resolvedSrc.value = url

    if (url) {
      const size = await fetchImageSize(url)
      imgMeta.w = size.width
      imgMeta.h = size.height
    } else {
      imgMeta.w = 0
      imgMeta.h = 0
    }
  } catch (e) {
    console.error("Failed to load image size", e)
    resolvedSrc.value = null
    imgMeta.w = 0
    imgMeta.h = 0
  }
}, { immediate: true })

const thumbnailStyle = computed(() => {
  if (!resolvedSrc.value || imgMeta.w === 0) return {}
  
  const isFullImage = !props.rect || (props.rect.w === 0 && props.rect.h === 0)

  if (isFullImage) {
    return {
      backgroundImage: `url('${resolvedSrc.value}')`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated'
    }
  }

  return getThumbnailStyle(
    resolvedSrc.value, 
    props.rect,
    { width: imgMeta.w, height: imgMeta.h }, 
    parseInt(props.sizeClass.match(/\d+/)?.[0] || 48) * 4 
  )
})

const openPreview = () => {
  if (resolvedSrc.value) {
    const title = `${props.name} (${imgMeta.w}x${imgMeta.h}px)`
    showImage(resolvedSrc.value, title)
  }
}
</script>