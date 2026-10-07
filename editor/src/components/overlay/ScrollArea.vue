<template>
  <div class="relative w-full h-full overflow-hidden" ref="containerRef">
    
    <div
      ref="viewportRef"
      class="h-full w-full scrollbar-hide"
      :class="isVertical ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-auto overflow-y-hidden'"
      @scroll="handleScroll"
    >
      <div ref="contentRef" :class="isVertical ? '' : 'w-max h-full'">
        <slot />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showScrollbar"
        class="fixed z-[9999] transition-opacity duration-200 flex"
        :class="isScrolling || isHovering ? 'opacity-100' : 'opacity-0'"
        :style="{
          top: `${trackPosition.top}px`,
          left: `${trackPosition.left}px`,
          width: `${trackPosition.width}px`,
          height: `${trackPosition.height}px`
        }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div
          class="rounded-full cursor-pointer select-none transition-colors"
          :class="[
            isHovering || isDragging ? 'bg-white/40' : 'bg-white/20',
            isVertical ? 'w-1.5 ml-auto mr-0.5' : 'h-1.5 mt-auto mb-0.5'
          ]"
          :style="thumbStyle"
          @mousedown="handleDragStart"
        ></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  orientation: {
    type: String,
    default: 'vertical',
    validator: (v) => ['vertical', 'horizontal'].includes(v)
  }
})

const isVertical = computed(() => props.orientation === 'vertical')

const containerRef = ref(null)
const viewportRef = ref(null)
const contentRef = ref(null)

const showScrollbar = ref(false)
const thumbSize = ref(0)
const thumbPos = ref(0)
const isHovering = ref(false)
const isScrolling = ref(false)
const isDragging = ref(false)

const trackPosition = reactive({ top: 0, left: 0, width: 0, height: 0 })

let scrollTimeout = null
let resizeObserver = null

const thumbStyle = computed(() => {
  if (isVertical.value) {
    return { height: `${thumbSize.value}px`, transform: `translateY(${thumbPos.value}px)` }
  } else {
    return { width: `${thumbSize.value}px`, transform: `translateX(${thumbPos.value}px)` }
  }
})

const updateGeometry = () => {
  if (!viewportRef.value || !contentRef.value || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  
  if (isVertical.value) {
    trackPosition.top = rect.top
    trackPosition.left = rect.right - 8 
    trackPosition.width = 8
    trackPosition.height = rect.height
  } else {
    trackPosition.top = rect.bottom - 8
    trackPosition.left = rect.left
    trackPosition.width = rect.width
    trackPosition.height = 8
  }

  const viewport = isVertical.value ? viewportRef.value.clientHeight : viewportRef.value.clientWidth
  const content = isVertical.value ? viewportRef.value.scrollHeight : viewportRef.value.scrollWidth

  if (content <= viewport) {
    showScrollbar.value = false
    thumbSize.value = 0
    return
  }

  showScrollbar.value = true

  const ratio = viewport / content
  thumbSize.value = Math.max(ratio * viewport, 20) 

  const maxScroll = content - viewport
  const maxThumb = viewport - thumbSize.value
  const currentScroll = isVertical.value ? viewportRef.value.scrollTop : viewportRef.value.scrollLeft
  
  thumbPos.value = (currentScroll / maxScroll) * maxThumb
}

const handleScroll = () => {
  if (!isDragging.value) updateGeometry()
  
  isScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

const handleMouseEnter = () => { isHovering.value = true }
const handleMouseLeave = () => { isHovering.value = false }

let startCoord = 0
let startScroll = 0

const handleDragStart = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  isDragging.value = true
  isHovering.value = true 
  startCoord = isVertical.value ? e.clientY : e.clientX
  startScroll = isVertical.value ? viewportRef.value.scrollTop : viewportRef.value.scrollLeft
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.body.style.userSelect = 'none'
}

const handleDragMove = (e) => {
  if (!viewportRef.value) return

  const delta = (isVertical.value ? e.clientY : e.clientX) - startCoord
  const viewport = isVertical.value ? viewportRef.value.clientHeight : viewportRef.value.clientWidth
  const content = isVertical.value ? viewportRef.value.scrollHeight : viewportRef.value.scrollWidth
  
  const maxThumb = viewport - thumbSize.value
  const maxScroll = content - viewport
  const scrollAmount = (delta / maxThumb) * maxScroll
  
  if (isVertical.value) {
    viewportRef.value.scrollTop = startScroll + scrollAmount
  } else {
    viewportRef.value.scrollLeft = startScroll + scrollAmount
  }
  
  updateGeometry() 
}

const handleDragEnd = () => {
  isDragging.value = false
  isHovering.value = false 
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.body.style.userSelect = ''
}

onMounted(() => {
  nextTick(updateGeometry)

  resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(updateGeometry)
  })
  if (contentRef.value) resizeObserver.observe(contentRef.value)
  if (containerRef.value) resizeObserver.observe(containerRef.value)

  window.addEventListener('resize', updateGeometry)
  window.addEventListener('scroll', updateGeometry, true)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', updateGeometry)
  window.removeEventListener('scroll', updateGeometry, true)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>