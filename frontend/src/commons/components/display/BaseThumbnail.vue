<template>
  <div class="relative inline-block">
    <button 
      type="button"
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
        v-if="src && imgMeta.w > 0" 
        class="w-full h-full"
        :style="thumbnailStyle"
      ></div>
      
      <span v-else class="text-[9px] text-muted-foreground">Empty</span>

      <div class="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center z-10">
        <Maximize2 class="w-3.5 h-3.5 text-white drop-shadow-md" />
      </div>
    </button>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { Maximize2 } from 'lucide-vue-next'
import TextureUtil from "@editors/properties/composables/TextureUtil.js"
import { usePopImage } from '@/composables/usePopImage'

const props = defineProps({
  src: { type: String, default: null },
  rect: { type: Object, default: () => ({ x: 0, y: 0, w: 0, h: 0 }) },
  sizeClass: { type: String, default: 'w-12 h-12' },
  name: { type: String, default: 'Texture Preview' } // Tambahan prop opsional untuk judul pop-up
})

const { showImage } = usePopImage()

const imgMeta = reactive({ w: 0, h: 0 })

watch(() => props.src, async (url) => {
  if (!url) {
    imgMeta.w = 0
    imgMeta.h = 0
    return
  }
  try {
    const size = await TextureUtil.fetchImageSize(url)
    imgMeta.w = size.width
    imgMeta.h = size.height
  } catch (e) {
    console.error("Failed to load image size", e)
  }
}, { immediate: true })

const thumbnailStyle = computed(() => {
  if (!props.src || imgMeta.w === 0) return {}
  
  const isFullImage = !props.rect || (props.rect.w === 0 && props.rect.h === 0)

  if (isFullImage) {
    return {
      backgroundImage: `url('${props.src}')`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated'
    }
  }

  // Menggunakan logika existing kamu
  return TextureUtil.getThumbnailStyle(
    props.src, 
    props.rect,
    { width: imgMeta.w, height: imgMeta.h }, 
    parseInt(props.sizeClass.match(/\d+/)?.[0] || 48) * 4 // Fallback size adjustment
  )
})

const openPreview = () => {
  if (props.src) {
    // Memanggil BasePopImage dengan URL gambar dan resolusi aslinya sebagai judul opsional
    const title = `${props.name} (${imgMeta.w}x${imgMeta.h}px)`
    showImage(props.src, title)
  }
}
</script>