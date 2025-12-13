<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'

const props = defineProps({
  isLeftCollapsed: { type: Boolean, default: false },
  isRightCollapsed: { type: Boolean, default: false }
})

const emit = defineEmits(['update:isLeftCollapsed', 'update:isRightCollapsed'])

const CONFIG = {
  HEADER_HEIGHT: 48,
  COLLAPSED_WIDTH: 50,
  MIN_WIDTH: 200,
  MAX_WIDTH: 600,
  SNAP_CLOSE: 80,
  SNAP_OPEN: 100,
  DEFAULT_LEFT: 288,
  DEFAULT_RIGHT: 320,
  TRANSITION: '300ms cubic-bezier(0.25, 0.8, 0.25, 1)'
}

const usePanelResize = (side, defaultWidth, collapsedProp, updateCollapsed) => {
  const width = ref(defaultWidth)
  const isResizing = ref(false)
  const willSnapClose = ref(false)

  const activeWidth = computed(() => 
    isResizing.value || !collapsedProp.value ? width.value : CONFIG.COLLAPSED_WIDTH
  )

  const panelStyle = computed(() => ({
    width: `${activeWidth.value}px`,
    transition: isResizing.value ? 'none' : `width ${CONFIG.TRANSITION}`
  }))

  watch(collapsedProp, (isCollapsed) => {
    if (isResizing.value) return
    if (!isCollapsed && width.value < CONFIG.MIN_WIDTH) {
      width.value = defaultWidth
    }
  })

  const handleMove = (e) => {
    let newW = side === 'left' ? e.clientX : window.innerWidth - e.clientX
    
    willSnapClose.value = !collapsedProp.value && newW < CONFIG.SNAP_CLOSE

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
      if (newW < CONFIG.COLLAPSED_WIDTH) newW = CONFIG.COLLAPSED_WIDTH
    }
    width.value = newW
  }

  const start = () => {
    if (collapsedProp.value) width.value = CONFIG.COLLAPSED_WIDTH
    isResizing.value = true
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', stop)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const stop = () => {
    isResizing.value = false
    willSnapClose.value = false
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', stop)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    setTimeout(() => {
      if (!collapsedProp.value) {
        width.value = Math.max(Math.min(width.value, CONFIG.MAX_WIDTH), CONFIG.MIN_WIDTH)
      }
    }, 10)
  }

  onUnmounted(() => stop())

  return { width, activeWidth, isResizing, willSnapClose, start, panelStyle }
}

const left = usePanelResize(
  'left', 
  CONFIG.DEFAULT_LEFT, 
  computed(() => props.isLeftCollapsed), 
  (val) => emit('update:isLeftCollapsed', val)
)

const right = usePanelResize(
  'right', 
  CONFIG.DEFAULT_RIGHT, 
  computed(() => props.isRightCollapsed), 
  (val) => emit('update:isRightCollapsed', val)
)

const canvasStyle = computed(() => ({
  '--left-width': `${left.activeWidth.value}px`,
  '--right-width': `${right.activeWidth.value}px`,
  transition: (left.isResizing.value || right.isResizing.value) 
    ? 'none' 
    : `padding ${CONFIG.TRANSITION}`
}))
</script>

<template>
  <div class="w-screen h-screen relative bg-background text-primary overflow-hidden font-sans">
    
    <header 
      class="absolute inset-x-0 top-0 z-30 border-b border-border bg-panel"
      :style="{ height: CONFIG.HEADER_HEIGHT + 'px' }"
    >
      <slot name="topbar" />
    </header>

    <div 
      class="absolute inset-x-0 bottom-0 z-0"
      :style="{ top: CONFIG.HEADER_HEIGHT + 'px' }"
    >
      
      <div 
        class="absolute inset-0 z-0 pl-[var(--left-width)] pr-[var(--right-width)] will-change-[padding]"
        :style="canvasStyle"
      >
        <div class="h-full w-full overflow-auto relative">
          <slot name="canvas" />
        </div>
      </div>

      <aside 
        class="absolute top-0 bottom-0 left-0 z-20 bg-panel flex border-r border-border group/left will-change-[width]"
        :style="left.panelStyle.value"
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
          <div 
            class="w-1 h-full transition-colors duration-200 rounded-full"
            :class="left.willSnapClose.value ? 'bg-red-400' : 'group-hover:bg-blue-500/50 active:bg-blue-500'"
          ></div>
        </div>
      </aside>

      <aside 
        class="absolute top-0 bottom-0 right-0 z-20 bg-panel flex border-l border-border will-change-[width]"
        :style="right.panelStyle.value"
      >
        <div 
          class="w-4 -left-2 h-full cursor-col-resize absolute z-50 flex justify-center items-center group touch-none"
          @mousedown.prevent="right.start"
        >
          <div 
            class="w-1 h-full transition-colors duration-200 rounded-full"
            :class="right.willSnapClose.value ? 'bg-red-400' : 'group-hover:bg-blue-500/50 active:bg-blue-500'"
          ></div>
        </div>

        <div class="flex-1 overflow-hidden h-full w-full relative">
          <div :style="{ minWidth: isRightCollapsed ? 'auto' : CONFIG.MIN_WIDTH + 'px' }" class="h-full">
            <slot name="right-panel" />
          </div>
        </div>
      </aside>

      <div class="absolute inset-0 pointer-events-none z-40">
        <slot name="overlays" />
      </div>

    </div>
  </div>
</template>