<template>
  <div class="relative inline-block">
    <button 
      ref="triggerRef"
      type="button"
      class="
        relative flex items-center justify-center overflow-hidden
        rounded border border-border bg-muted/50 
        group hover:border-primary/50 transition-colors
        select-none
      "
      :class="sizeClass"
      @click="togglePopup"
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

    <Teleport to="body">
      <div 
        v-if="isOpen && src && isPositioned" 
        ref="popupRef"
        class="
          fixed z-[9999] p-2 flex flex-col gap-2 
          bg-popover border border-border rounded-md shadow-xl 
          min-w-[150px] animate-in fade-in zoom-in-95 duration-100
        "
        :style="{ 
          top: popupPosition.top, 
          left: popupPosition.left,
          transform: 'translateY(-50%)' 
        }"
      >
        <div class="flex justify-between items-center border-b border-border pb-1">
          <span class="text-[10px] text-muted-foreground font-mono">
            {{ imgMeta.w }} x {{ imgMeta.h }} px
          </span>
        </div>

        <div class="w-48 h-48 bg-muted/30 rounded border border-border/50 flex items-center justify-center overflow-hidden relative">
          <div 
            class="absolute inset-0 opacity-20" 
            style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 8px 8px;">
          </div>
          
          <img 
            :src="src" 
            class="max-w-full max-h-full object-contain relative z-10" 
            style="image-rendering: pixelated;" 
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Maximize2 } from 'lucide-vue-next'
import TextureUtil from "@editors/properties/composables/TextureUtil.js"

const props = defineProps({
  src: { type: String, default: null },
  rect: { type: Object, default: () => ({ x: 0, y: 0, w: 0, h: 0 }) },
  sizeClass: { type: String, default: 'w-12 h-12' }
})

const isOpen = ref(false)
const isPositioned = ref(false)
const triggerRef = ref(null)
const popupRef = ref(null)
const imgMeta = reactive({ w: 0, h: 0 })
const popupPosition = reactive({ top: '0px', left: '0px' })

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

  return TextureUtil.getThumbnailStyle(
    props.src, 
    props.rect,
    { width: imgMeta.w, height: imgMeta.h }, 
    48
  )
})

const updatePosition = () => {
  if (!triggerRef.value) return
  
  const rect = triggerRef.value.getBoundingClientRect()
  const popupWidth = 210
  const gap = 12

  let leftPos = rect.left - popupWidth - gap
  
  if (leftPos < 10) {
    leftPos = rect.right + gap
  }

  popupPosition.top = '80vh'
  popupPosition.left = `${leftPos}px`
  
  isPositioned.value = true
}

const togglePopup = async () => {
  if (isOpen.value) {
    closePopup()
  } else {
    isOpen.value = true
    isPositioned.value = false
    await nextTick()
    updatePosition()
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('resize', updatePosition)
  }
}

const closePopup = () => {
  isOpen.value = false
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updatePosition)
}

const handleClickOutside = (e) => {
  if (!isOpen.value) return

  const clickedInsidePopup = popupRef.value?.contains(e.target)
  const clickedInsideTrigger = triggerRef.value?.contains(e.target)

  if (!clickedInsidePopup && !clickedInsideTrigger) {
    closePopup()
  }
}

onBeforeUnmount(() => {
  closePopup()
})
</script>
