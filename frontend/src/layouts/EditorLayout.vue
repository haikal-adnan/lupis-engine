<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'

const props = defineProps({
  isLeftCollapsed: { type: Boolean, default: false },
  isRightCollapsed: { type: Boolean, default: false },
  
  // --- PROPS BARU UNTUK MENYEMBUNYIKAN PANEL ---
  hideLeft: { type: Boolean, default: false },
  hideRight: { type: Boolean, default: false },
  hideBottom: { type: Boolean, default: false }
})

const emit = defineEmits(['update:isLeftCollapsed', 'update:isRightCollapsed', 'close', 'drag-open'])

const CONFIG = {
  HEADER_HEIGHT: 48,
  BOTTOM_BAR_HEIGHT: 40,
  COLLAPSED_WIDTH: 50, 
  MIN_WIDTH: 200,      
  MAX_WIDTH: 600,      
  SNAP_CLOSE: 80,      
  SNAP_OPEN: 100,      
  DEFAULT_LEFT: 288,
  DEFAULT_RIGHT: 320,
  TRANSITION: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)',
  OVERLAY_MARGIN: 48 
}

// --- Logic Resizing Panel Kiri & Kanan (UPDATED) ---
// Kita butuh akses ke 'side' (left/right) untuk cek props hide yang sesuai
const usePanelResize = (side, defaultWidth, collapsedProp, updateCollapsed, isHiddenProp) => {
  const width = ref(defaultWidth)
  const isResizing = ref(false)
  
  // LOGIC BARU: Jika hidden, activeWidth paksa jadi 0
  const activeWidth = computed(() => {
    if (isHiddenProp.value) return 0
    return isResizing.value || !collapsedProp.value ? width.value : CONFIG.COLLAPSED_WIDTH
  })

  const panelStyle = computed(() => ({
    width: `${activeWidth.value}px`,
    transition: isResizing.value ? 'none' : `width ${CONFIG.TRANSITION}`
  }))

  // ... (Sisa logic resizing sama seperti sebelumnya) ...
  watch(collapsedProp, (isCollapsed) => {
    if (isResizing.value) return
    if (!isCollapsed && width.value < CONFIG.MIN_WIDTH) {
      width.value = defaultWidth
    }
  })

  const handleMove = (e) => {
    let newW = side === 'left' ? e.clientX : window.innerWidth - e.clientX
    
    if (!collapsedProp.value) {
      if (newW < CONFIG.SNAP_CLOSE) {
        updateCollapsed(true)
        width.value = CONFIG.COLLAPSED_WIDTH
        stop()
        return
      }
      if (newW < CONFIG.MIN_WIDTH) newW = Math.max(newW, CONFIG.SNAP_CLOSE)
      if (newW > CONFIG.MAX_WIDTH) newW = CONFIG.MAX_WIDTH
    } else {
      if (newW > CONFIG.SNAP_OPEN) updateCollapsed(false)
    }
    width.value = newW
  }

  const start = () => {
    if (isHiddenProp.value) return // Cegah resize jika hidden
    if (collapsedProp.value) width.value = CONFIG.COLLAPSED_WIDTH
    isResizing.value = true
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', stop)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.classList.add('resizing') 
  }

  const stop = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', stop)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.classList.remove('resizing')

    setTimeout(() => {
      if (!collapsedProp.value) {
        width.value = Math.max(Math.min(width.value, CONFIG.MAX_WIDTH), CONFIG.MIN_WIDTH)
      }
    }, 10)
  }

  onUnmounted(() => stop())

  return { width, activeWidth, isResizing, start, panelStyle }
}

// Pass computed props untuk isHidden
const left = usePanelResize(
  'left', 
  CONFIG.DEFAULT_LEFT, 
  computed(() => props.isLeftCollapsed), 
  (val) => emit('update:isLeftCollapsed', val),
  computed(() => props.hideLeft) // <--- Pass Hide Prop
)

const right = usePanelResize(
  'right', 
  CONFIG.DEFAULT_RIGHT, 
  computed(() => props.isRightCollapsed), 
  (val) => emit('update:isRightCollapsed', val),
  computed(() => props.hideRight) // <--- Pass Hide Prop
)

// --- Logic Resizing Panel Bawah (UPDATED) ---
const bottomHeight = ref(0)
const isBottomResizing = ref(false)
const lastOpenHeight = ref(250)

const currentBottomHeight = computed(() => {
  // Jika BottomBar disembunyikan total, panel konten bawah juga 0
  if (props.hideBottom) return 0 
  return isBottomResizing.value ? bottomHeight.value : bottomHeight.value
})

// Hitung tinggi Bottom Bar (apakah 40px atau 0px)
const actualBottomBarHeight = computed(() => props.hideBottom ? 0 : CONFIG.BOTTOM_BAR_HEIGHT)

// Style Overlay
const overlayBottomStyle = computed(() => {
  const h = currentBottomHeight.value > 0 ? currentBottomHeight.value : 0
  // Gunakan actualBottomBarHeight
  const totalBottom = h + actualBottomBarHeight.value + CONFIG.OVERLAY_MARGIN
  return { 
    bottom: `${totalBottom}px`, 
    transition: isBottomResizing.value ? 'none' : `bottom ${CONFIG.TRANSITION}`
  }
})

// ... (Function startBottomResize, handleBottomMove, dll sama) ...
const startBottomResize = () => {
    if (props.hideBottom) return
    if (bottomHeight.value === 0) {
        emit('drag-open')
        bottomHeight.value = 10
    }
    isBottomResizing.value = true
    document.addEventListener('mousemove', handleBottomMove)
    document.addEventListener('mouseup', stopBottomResize)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
}
const handleBottomMove = (e) => {
    const windowHeight = window.innerHeight
    let newH = windowHeight - e.clientY - CONFIG.BOTTOM_BAR_HEIGHT
    const maxH = windowHeight * 0.50
    if (newH > maxH) newH = maxH
    bottomHeight.value = Math.max(0, newH)
}
const stopBottomResize = () => {
    isBottomResizing.value = false
    document.removeEventListener('mousemove', handleBottomMove)
    document.removeEventListener('mouseup', stopBottomResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (bottomHeight.value < 50) handleClose()
    else lastOpenHeight.value = bottomHeight.value
}
const handleClose = () => {
    lastOpenHeight.value = bottomHeight.value > 50 ? bottomHeight.value : 250
    bottomHeight.value = 0
    emit('close')
}
defineExpose({
    setBottomPanel: (isOpen) => {
        if (isOpen) bottomHeight.value = lastOpenHeight.value < 150 ? 250 : lastOpenHeight.value
        else handleClose()
    },
    bottomHeight
})

// Style dinamis untuk canvas (UPDATED)
const canvasStyle = computed(() => ({
  '--left-width': `${left.activeWidth.value}px`,
  '--right-width': `${right.activeWidth.value}px`,
  // Update perhitungan bottom
  bottom: `${actualBottomBarHeight.value + currentBottomHeight.value}px`, 
  transition: (left.isResizing.value || right.isResizing.value || isBottomResizing.value) 
    ? 'none' 
    : `padding ${CONFIG.TRANSITION}, bottom ${CONFIG.TRANSITION}`
}))
</script>

<template>
  <div class="w-screen h-screen relative bg-background text-foreground overflow-hidden font-sans">
    
    <header 
      class="absolute inset-x-0 top-0 z-30 border-b border-border bg-background"
      :style="{ height: CONFIG.HEADER_HEIGHT + 'px' }"
    >
      <slot name="topbar" />
    </header>

    <div 
      class="absolute inset-x-0 z-0 bg-black/90"
      :style="{ top: CONFIG.HEADER_HEIGHT + 'px', bottom: 0 }"
    >
      
      <div 
        class="absolute inset-x-0 top-0 z-0 pl-[var(--left-width)] pr-[var(--right-width)] will-change-[padding, bottom]"
        :style="canvasStyle"
      >
        <div class="h-full w-full overflow-hidden relative bg-slate-900/50">
          <slot name="canvas" />
        </div>
      </div>

      <aside 
        v-if="!hideLeft"
        class="absolute top-0 left-0 z-20 bg-background flex border-r border-border group/left will-change-[width]"
        :style="{ ...left.panelStyle.value, bottom: (actualBottomBarHeight + currentBottomHeight) + 'px' }"
      >
        <div class="flex-1 overflow-hidden h-full w-full relative">
          <div :style="{ minWidth: isLeftCollapsed ? 'auto' : CONFIG.MIN_WIDTH + 'px' }" class="h-full">
            <slot name="left-panel" />
          </div>
        </div>
        
        <div 
          class="w-4 -right-2 h-full cursor-col-resize absolute z-50 flex justify-center items-center group touch-none"
          @mousedown.prevent="left.start"
        >
          <div class="w-1 h-full transition-colors duration-200 rounded-full group-hover:bg-primary/50 active:bg-primary"></div>
        </div>
      </aside>

      <aside 
        v-if="!hideRight"
        class="absolute top-0 right-0 z-20 bg-background flex border-l border-border will-change-[width]"
        :style="{ ...right.panelStyle.value, bottom: (actualBottomBarHeight + currentBottomHeight) + 'px' }"
      >
        <div 
          class="w-4 -left-2 h-full cursor-col-resize absolute z-50 flex justify-center items-center group touch-none"
          @mousedown.prevent="right.start"
        >
          <div class="w-1 h-full transition-colors duration-200 rounded-full group-hover:bg-primary/50 active:bg-primary"></div>
        </div>

        <div class="flex-1 overflow-hidden h-full w-full relative">
          <div :style="{ minWidth: isRightCollapsed ? 'auto' : CONFIG.MIN_WIDTH + 'px' }" class="h-full">
            <slot name="right-panel" />
          </div>
        </div>
      </aside>

      <div 
        v-if="!hideBottom"
        class="absolute inset-x-0 z-20 bg-background border-t border-border flex flex-col shadow-2xl shadow-black/50"
        :style="{ 
          height: currentBottomHeight + 'px', 
          bottom: actualBottomBarHeight + 'px',
          transition: isBottomResizing ? 'none' : `height ${CONFIG.TRANSITION}`
        }"
      >
        <div class="flex-1 overflow-hidden relative flex flex-col" v-if="currentBottomHeight > 0">
           <slot name="bottom-panel" :close="handleClose" />
        </div>
      </div>

      <div 
        v-if="!hideBottom"
        class="absolute inset-x-0 z-[60] h-3 cursor-row-resize flex items-center justify-center group touch-none hover:bg-primary/5 transition-colors"
        :style="{ bottom: (actualBottomBarHeight + currentBottomHeight - 6) + 'px' }" 
        @mousedown.prevent="startBottomResize"
      >
         <div class="w-12 h-1 rounded-full bg-border/0 group-hover:bg-primary/50 transition-colors"></div>
      </div>

      <div 
        v-if="!hideBottom"
        class="absolute bottom-0 inset-x-0 z-30"
        :style="{ height: CONFIG.BOTTOM_BAR_HEIGHT + 'px' }"
      >
        <slot name="bottom-bar" />
      </div>

      <div class="absolute inset-x-0 z-40 pointer-events-none" :style="overlayBottomStyle">
         <slot name="overlays" />
      </div>

    </div>
  </div>
</template>