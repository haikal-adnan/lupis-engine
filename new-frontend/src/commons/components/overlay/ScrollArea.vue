<template>
  <div class="relative w-full h-full overflow-hidden" ref="containerRef">
    
    <div
      ref="viewportRef"
      class="h-full w-full overflow-y-auto scrollbar-hide"
      @scroll="handleScroll"
    >
      <div ref="contentRef">
        <slot />
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showScrollbar"
        class="fixed z-[9999] w-2 transition-opacity duration-200"
        :class="isScrolling || isHovering ? 'opacity-100' : 'opacity-0'"
        :style="{
          top: `${trackPosition.top}px`,
          left: `${trackPosition.left}px`,
          height: `${trackPosition.height}px`
        }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div
          class="w-1.5 ml-auto mr-0.5 rounded-full cursor-pointer select-none transition-colors"
          :class="isHovering || isDragging ? 'bg-white/40' : 'bg-white/20'"
          :style="{
            height: `${thumbHeight}px`,
            transform: `translateY(${thumbTop}px)`
          }"
          @mousedown="handleDragStart"
        ></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'

const containerRef = ref(null)
const viewportRef = ref(null)
const contentRef = ref(null)

// State
const showScrollbar = ref(false)
const thumbHeight = ref(0)
const thumbTop = ref(0)
const isHovering = ref(false)
const isScrolling = ref(false)
const isDragging = ref(false)

// Posisi Track di layar (Fixed coordinate)
const trackPosition = reactive({ top: 0, left: 0, height: 0 })

let scrollTimeout = null
let resizeObserver = null

// --- Core Logic: Update Posisi Track & Thumb ---
const updateGeometry = () => {
  if (!viewportRef.value || !contentRef.value || !containerRef.value) return

  // 1. Hitung Posisi Track (Menempel pada Container)
  const rect = containerRef.value.getBoundingClientRect()
  trackPosition.top = rect.top
  trackPosition.left = rect.right - 8 // Geser dikit ke kiri agar masuk area
  trackPosition.height = rect.height

  // 2. Hitung Ukuran Thumb
  const viewportHeight = viewportRef.value.clientHeight
  const contentHeight = viewportRef.value.scrollHeight

  if (contentHeight <= viewportHeight) {
    showScrollbar.value = false
    thumbHeight.value = 0
    return
  }

  showScrollbar.value = true

  // Rasio Thumb
  const ratio = viewportHeight / contentHeight
  const height = Math.max(ratio * viewportHeight, 20) // Min height 20px
  thumbHeight.value = height

  // 3. Hitung Posisi Thumb (Top offset)
  const maxScrollTop = contentHeight - viewportHeight
  const maxThumbTop = viewportHeight - thumbHeight.value
  const scrollRatio = viewportRef.value.scrollTop / maxScrollTop
  
  thumbTop.value = scrollRatio * maxThumbTop
}

const handleScroll = () => {
  if (!isDragging.value) {
    updateGeometry()
  }
  
  isScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

const handleMouseEnter = () => { isHovering.value = true }
const handleMouseLeave = () => { isHovering.value = false }

// --- Dragging Logic ---
let startY = 0
let startScrollTop = 0

const handleDragStart = (e) => {
  e.preventDefault()
  e.stopPropagation()
  
  isDragging.value = true
  isHovering.value = true // Keep visible
  startY = e.clientY
  startScrollTop = viewportRef.value.scrollTop
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.body.style.userSelect = 'none'
}

const handleDragMove = (e) => {
  if (!viewportRef.value) return

  const deltaY = e.clientY - startY
  const viewportHeight = viewportRef.value.clientHeight
  const contentHeight = viewportRef.value.scrollHeight
  
  const maxThumbTop = viewportHeight - thumbHeight.value
  const maxScrollTop = contentHeight - viewportHeight
  
  // Konversi gerakan pixel mouse ke scroll position
  const scrollAmount = (deltaY / maxThumbTop) * maxScrollTop
  
  viewportRef.value.scrollTop = startScrollTop + scrollAmount
  
  // Update visual thumb langsung agar smooth (bypass handleScroll saat drag)
  updateGeometry() 
}

const handleDragEnd = () => {
  isDragging.value = false
  isHovering.value = false // Allow hide logic
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.body.style.userSelect = ''
}

// --- Lifecycle & Observers ---
onMounted(() => {
  // Update awal
  nextTick(updateGeometry)

  // 1. Observe perubahan ukuran konten (isi bertambah/berkurang)
  resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(updateGeometry)
  })
  if (contentRef.value) resizeObserver.observe(contentRef.value)
  if (containerRef.value) resizeObserver.observe(containerRef.value)

  // 2. Observe perubahan ukuran window/layar
  window.addEventListener('resize', updateGeometry)
  window.addEventListener('scroll', updateGeometry, true) // Capture scroll lain yg mungkin menggeser container
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