<template>
  <div class="relative inline-block select-none" data-component="base-crop-thumbnail">
    <!-- Thumbnail Button Trigger -->
    <button
      ref="triggerRef"
      type="button"
      data-element="crop-thumbnail-trigger"
      :data-loaded="!!resolvedSrc && imgMeta.w > 0"
      :disabled="disabled"
      :aria-label="`Crop and preview ${name}`"
      class="
        relative flex items-center justify-center overflow-hidden
        rounded border border-border bg-muted/40
        group transition-all duration-200 outline-none
        hover:border-primary/60 hover:shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      :class="sizeClass"
      @click="openModal"
      @dblclick.stop="openModal"
    >
      <!-- Cropped or Full Preview Image -->
      <div
        v-if="resolvedSrc && imgMeta.w > 0"
        class="w-full h-full"
        data-element="crop-thumbnail-image"
        :style="thumbnailStyle"
      ></div>

      <!-- Empty / Fallback State -->
      <span v-else class="text-[9px] text-muted-foreground font-mono" data-element="crop-thumbnail-empty">
        {{ fallbackText }}
      </span>

      <!-- Hover Overlay with Crop & Maximize Icon -->
      <div 
        v-if="resolvedSrc && imgMeta.w > 0 && !disabled"
        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-0.5 transition-opacity z-10 text-white"
      >
        <Crop class="w-3.5 h-3.5 text-primary drop-shadow" />
        <span class="text-[8px] font-mono leading-none tracking-tight text-white/90">Crop</span>
      </div>
    </button>

    <!-- Large Interactive Crop Modal / Popup -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-98"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-98"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 md:p-6"
          @click.self="closeModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-modal-title"
          data-testid="crop-image-dialog"
        >
          <div
            class="
              bg-background border border-border rounded-xl shadow-2xl flex flex-col
              w-full max-w-5xl h-[min(850px,calc(100vh-1.5rem))] sm:h-[min(850px,calc(100vh-2.5rem))] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] overflow-hidden
            "
          >
            <!-- Header -->
            <div class="px-4 py-2.5 border-b border-border bg-muted/40 flex justify-between items-center shrink-0">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-1 rounded bg-primary/10 text-primary">
                  <Crop class="w-4 h-4" />
                </div>
                <div class="truncate">
                  <h3 id="crop-modal-title" class="text-sm font-semibold text-foreground truncate">
                    {{ name }}
                  </h3>
                  <div class="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>Original: {{ imgMeta.w }}×{{ imgMeta.h }}px</span>
                    <span>•</span>
                    <span class="text-primary font-medium">Crop: {{ localRect.w }}×{{ localRect.h }}px (X:{{ localRect.x }}, Y:{{ localRect.y }})</span>
                  </div>
                </div>
              </div>

              <!-- Top Right Controls -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="resetToFullImage"
                  class="px-2.5 py-1 text-xs font-medium rounded border border-border bg-secondary/50 hover:bg-secondary text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                  title="Reset crop to full image bounds"
                >
                  <RotateCcw class="w-3 h-3" />
                  <span>Reset Full</span>
                </button>

                <button
                  type="button"
                  @click="closeModal"
                  class="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive p-1.5 rounded transition-colors"
                  title="Close (Esc)"
                  aria-label="Close modal"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Interactive Viewport Canvas -->
            <div
              ref="viewportRef"
              class="relative flex-1 w-full h-full overflow-hidden bg-[#121214] flex items-center justify-center select-none"
              :class="[
                isPanning ? 'cursor-grabbing' : (isSpacePressed ? 'cursor-grab' : 'cursor-default')
              ]"
              @wheel.prevent="handleWheel"
              @mousedown="handleViewportMouseDown"
              @mousemove="handleGlobalMouseMove"
              @mouseup="handleGlobalMouseUp"
              @dblclick.self="toggleCropMode"
              data-testid="crop-viewport"
            >
              <!-- Workspace Transform Layer -->
              <div
                class="absolute origin-center will-change-transform"
                :style="{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }"
              >
                <!-- Padded Workspace Container (e.g., 800x800 -> 1000x1000) -->
                <div
                  class="relative shadow-2xl rounded-sm"
                  :style="{
                    width: `${workspaceWidth}px`,
                    height: `${workspaceHeight}px`,
                    backgroundColor: '#18181b',
                    backgroundImage: `
                      radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)
                    `,
                    backgroundSize: '16px 16px'
                  }"
                  @dblclick="toggleCropMode"
                >
                  <!-- Workspace Outer Boundary Guide -->
                  <div class="absolute inset-0 border border-white/5 pointer-events-none rounded-sm"></div>

                  <!-- Actual Image Container (at offset padding) -->
                  <div
                    class="absolute overflow-hidden"
                    :style="{
                      left: `${pad}px`,
                      top: `${pad}px`,
                      width: `${imgMeta.w}px`,
                      height: `${imgMeta.h}px`,
                      backgroundImage: `
                        linear-gradient(45deg, #222 25%, transparent 25%),
                        linear-gradient(-45deg, #222 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #222 75%),
                        linear-gradient(-45deg, transparent 75%, #222 75%)
                      `,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                      backgroundColor: '#1f1f23'
                    }"
                  >
                    <!-- Background Image (Crisp pixelated) -->
                    <img
                      :src="resolvedSrc"
                      alt="Source asset"
                      class="w-full h-full object-contain pixelated pointer-events-none block"
                      draggable="false"
                    />

                    <!-- 4 High-Performance GPU-accelerated Dark Masks around the crop area -->
                    <div
                      class="absolute pointer-events-none bg-black/65"
                      :style="{
                        left: 0,
                        top: 0,
                        width: `${imgMeta.w}px`,
                        height: `${Math.max(0, localRect.y)}px`
                      }"
                    ></div>
                    <div
                      class="absolute pointer-events-none bg-black/65"
                      :style="{
                        left: 0,
                        top: `${Math.min(imgMeta.h, localRect.y + localRect.h)}px`,
                        width: `${imgMeta.w}px`,
                        bottom: 0
                      }"
                    ></div>
                    <div
                      class="absolute pointer-events-none bg-black/65"
                      :style="{
                        left: 0,
                        top: `${Math.max(0, localRect.y)}px`,
                        width: `${Math.max(0, localRect.x)}px`,
                        height: `${localRect.h}px`
                      }"
                    ></div>
                    <div
                      class="absolute pointer-events-none bg-black/65"
                      :style="{
                        left: `${Math.min(imgMeta.w, localRect.x + localRect.w)}px`,
                        top: `${Math.max(0, localRect.y)}px`,
                        right: 0,
                        height: `${localRect.h}px`
                      }"
                    ></div>
                  </div>

                  <!-- Image Border Outline (Shows exact 0 to width/height limits) -->
                  <div
                    class="absolute border border-white/20 pointer-events-none"
                    :style="{
                      left: `${pad}px`,
                      top: `${pad}px`,
                      width: `${imgMeta.w}px`,
                      height: `${imgMeta.h}px`
                    }"
                  >
                    <!-- Subtle boundary labels at corners -->
                    <span class="absolute -top-4 -left-1 text-[9px] font-mono text-white/40">0,0</span>
                    <span class="absolute -bottom-4 -right-1 text-[9px] font-mono text-white/40">{{ imgMeta.w }},{{ imgMeta.h }}</span>
                  </div>

                  <!-- Crop Box Layer (Positioned with padding offset) -->
                  <div
                    v-if="cropModeActive"
                    class="absolute z-20 group select-none"
                    :style="{
                      left: `${pad + localRect.x}px`,
                      top: `${pad + localRect.y}px`,
                      width: `${localRect.w}px`,
                      height: `${localRect.h}px`
                    }"
                  >
                    <!-- Crop Box Body (Draggable inside image bounds) -->
                    <div
                      class="w-full h-full border-2 border-primary relative cursor-move bg-primary/5 hover:bg-primary/10 transition-colors"
                      @mousedown.stop.prevent="startDrag('move', $event)"
                      title="Drag to reposition crop box"
                    >
                      <!-- Rule of Thirds Grid Lines -->
                      <div class="absolute inset-0 pointer-events-none opacity-25">
                        <div class="absolute left-1/3 top-0 bottom-0 w-px bg-white"></div>
                        <div class="absolute left-2/3 top-0 bottom-0 w-px bg-white"></div>
                        <div class="absolute top-1/3 left-0 right-0 h-px bg-white"></div>
                        <div class="absolute top-2/3 left-0 right-0 h-px bg-white"></div>
                      </div>

                      <!-- Floating Dimensions Info Pill -->
                      <div
                        class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 border border-white/20 text-white font-mono text-[10px] pointer-events-none whitespace-nowrap shadow-md z-30 flex items-center gap-1.5"
                      >
                        <span class="text-primary font-bold">{{ localRect.w }} × {{ localRect.h }}</span>
                        <span class="text-white/60">({{ localRect.x }}, {{ localRect.y }})</span>
                      </div>
                    </div>

                    <!-- Corner: Top-Left -->
                    <div
                      class="absolute -top-1.5 -left-1.5 w-4 h-4 cursor-nwse-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('nw', $event)"
                    >
                      <div class="w-2.5 h-2.5 bg-white border border-black/80 rounded-[2px] shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Edge: Top -->
                    <div
                      class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 cursor-ns-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('n', $event)"
                    >
                      <div class="w-4 h-1.5 bg-white border border-black/80 rounded-full shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Corner: Top-Right -->
                    <div
                      class="absolute -top-1.5 -right-1.5 w-4 h-4 cursor-nesw-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('ne', $event)"
                    >
                      <div class="w-2.5 h-2.5 bg-white border border-black/80 rounded-[2px] shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Edge: Right -->
                    <div
                      class="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-6 cursor-ew-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('e', $event)"
                    >
                      <div class="w-1.5 h-4 bg-white border border-black/80 rounded-full shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Corner: Bottom-Right -->
                    <div
                      class="absolute -bottom-1.5 -right-1.5 w-4 h-4 cursor-nwse-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('se', $event)"
                    >
                      <div class="w-2.5 h-2.5 bg-white border border-black/80 rounded-[2px] shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Edge: Bottom -->
                    <div
                      class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 cursor-ns-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('s', $event)"
                    >
                      <div class="w-4 h-1.5 bg-white border border-black/80 rounded-full shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Corner: Bottom-Left -->
                    <div
                      class="absolute -bottom-1.5 -left-1.5 w-4 h-4 cursor-nesw-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('sw', $event)"
                    >
                      <div class="w-2.5 h-2.5 bg-white border border-black/80 rounded-[2px] shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>

                    <!-- Edge: Left -->
                    <div
                      class="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-6 cursor-ew-resize z-30 flex items-center justify-center group/h"
                      @mousedown.stop.prevent="startDrag('w', $event)"
                    >
                      <div class="w-1.5 h-4 bg-white border border-black/80 rounded-full shadow-sm group-hover/h:scale-125 group-hover/h:bg-primary transition-transform"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Viewport Hint Overlay -->
              <div class="absolute top-3 left-3 text-[10px] text-white/70 bg-black/80 px-2.5 py-1 rounded-md pointer-events-none flex items-center gap-2">
                <span>Drag handles to crop</span>
                <span>•</span>
                <span>Space + drag to pan</span>
                <span>•</span>
                <span>Scroll to zoom</span>
              </div>
            </div>

            <!-- Bottom Toolbar & Inputs -->
            <div class="px-4 py-2.5 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <!-- Left: Numeric Inputs for Direct Precision Editing -->
              <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span class="text-[11px] font-sans font-bold text-muted-foreground uppercase tracking-wide mr-1">Source Rect</span>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">
                    <span class="text-[10px] text-muted-foreground mr-1">X</span>
                    <input
                      type="number"
                      v-model.number="inputX"
                      :min="0"
                      :max="Math.max(0, imgMeta.w - 1)"
                      class="w-12 text-xs bg-transparent text-foreground outline-none text-right font-mono"
                    />
                  </div>

                  <div class="flex items-center bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">
                    <span class="text-[10px] text-muted-foreground mr-1">Y</span>
                    <input
                      type="number"
                      v-model.number="inputY"
                      :min="0"
                      :max="Math.max(0, imgMeta.h - 1)"
                      class="w-12 text-xs bg-transparent text-foreground outline-none text-right font-mono"
                    />
                  </div>

                  <div class="flex items-center bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">
                    <span class="text-[10px] text-muted-foreground mr-1">W</span>
                    <input
                      type="number"
                      v-model.number="inputW"
                      :min="1"
                      :max="imgMeta.w"
                      class="w-12 text-xs bg-transparent text-foreground outline-none text-right font-mono font-bold text-primary"
                    />
                  </div>

                  <div class="flex items-center bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">
                    <span class="text-[10px] text-muted-foreground mr-1">H</span>
                    <input
                      type="number"
                      v-model.number="inputH"
                      :min="1"
                      :max="imgMeta.h"
                      class="w-12 text-xs bg-transparent text-foreground outline-none text-right font-mono font-bold text-primary"
                    />
                  </div>
                </div>

                <!-- Grid Snap Presets for Spritesheets -->
                <div class="flex items-center gap-1 ml-2">
                  <span class="text-[10px] font-sans text-muted-foreground">Snap:</span>
                  <button
                    v-for="step in [1, 16, 32, 64]"
                    :key="step"
                    type="button"
                    @click="gridSnap = step"
                    class="px-1.5 py-0.5 text-[10px] rounded transition-colors"
                    :class="gridSnap === step ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'"
                  >
                    {{ step === 1 ? 'Off' : `${step}px` }}
                  </button>
                </div>
              </div>

              <!-- Right: Zoom Controls & Done Button -->
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-background/80 border border-border rounded-md shadow-sm p-0.5">
                  <button
                    type="button"
                    @click="zoomOut"
                    class="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    @click="fitToView"
                    class="px-2 text-xs font-bold font-mono text-foreground hover:text-primary transition-colors"
                    title="Fit to view (click to reset zoom)"
                  >
                    {{ Math.round(zoom * 100) }}%
                  </button>

                  <button
                    type="button"
                    @click="zoomIn"
                    class="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn class="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  @click="closeModal"
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check class="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Crop, RotateCcw, X, Check, ZoomIn, ZoomOut } from 'lucide-vue-next'

const props = defineProps({
  src: { type: [String, Object, Promise], default: null },
  rect: { 
    type: Object, 
    default: () => ({ x: 0, y: 0, w: 0, h: 0 }) 
  },
  sizeClass: { type: String, default: 'w-12 h-12' },
  name: { type: String, default: 'Texture Crop' },
  fallbackText: { type: String, default: 'No Tex' },
  disabled: { type: Boolean, default: false },
  // Extra workspace margin in px around the image (e.g., 100px turns 800x800 into 1000x1000)
  padding: { type: Number, default: 100 }
})

const emit = defineEmits(['update:rect', 'change'])

const resolvedSrc = ref(null)
const imgMeta = reactive({ w: 0, h: 0 })
const isOpen = ref(false)
const cropModeActive = ref(true)

// Viewport zoom & pan
const triggerRef = ref(null)
const containerSize = reactive({ w: 0, h: 0 })
const viewportRef = ref(null)
const zoom = ref(1)
const pan = reactive({ x: 0, y: 0 })
const isPanning = ref(false)
const isSpacePressed = ref(false)
const panStart = { x: 0, y: 0 }

// Grid snapping for sprite tiles (1 = off, 8, 16, 32, 64)
const gridSnap = ref(1)

// Local editable crop rect
const localRect = reactive({
  x: 0,
  y: 0,
  w: 0,
  h: 0
})

// Padding around image (default: 100px so 800x800 -> 1000x1000)
const pad = computed(() => {
  return Math.max(40, props.padding || 100)
})

const workspaceWidth = computed(() => (imgMeta.w || 0) + pad.value * 2)
const workspaceHeight = computed(() => (imgMeta.h || 0) + pad.value * 2)

// Synchronize props.rect to localRect
watch(() => props.rect, (newVal) => {
  if (newVal) {
    localRect.x = Math.max(0, newVal.x || 0)
    localRect.y = Math.max(0, newVal.y || 0)
    localRect.w = newVal.w || 0
    localRect.h = newVal.h || 0
  }
}, { immediate: true, deep: true })

// Real image size loader
const fetchImageSize = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve({ width: 0, height: 0 })
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0
      })
    }
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = url
  })
}

// Watch src change
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

      // If initial rect is 0 or empty, default to full image bounds
      if ((!props.rect || (props.rect.w === 0 && props.rect.h === 0)) && size.width > 0) {
        localRect.x = 0
        localRect.y = 0
        localRect.w = size.width
        localRect.h = size.height
      }
    } else {
      imgMeta.w = 0
      imgMeta.h = 0
    }
  } catch (err) {
    console.error("Failed to load crop thumbnail image:", err)
    resolvedSrc.value = null
    imgMeta.w = 0
    imgMeta.h = 0
  }
}, { immediate: true })

const parseSizeClass = (sizeClass) => {
  if (!sizeClass) return { w: 48, h: 48 };
  const customW = sizeClass.match(/w-\[(\d+)px\]/)?.[1];
  const customH = sizeClass.match(/h-\[(\d+)px\]/)?.[1];
  const twW = sizeClass.match(/\bw-(\d+)\b/)?.[1];
  const twH = sizeClass.match(/\bh-(\d+)\b/)?.[1];

  let w = 48;
  let h = 48;
  if (customW) {
    w = parseInt(customW, 10);
  } else if (twW) {
    w = parseInt(twW, 10) * 4;
  }
  if (customH) {
    h = parseInt(customH, 10);
  } else if (twH) {
    h = parseInt(twH, 10) * 4;
  } else {
    h = w;
  }
  return { w, h };
};

const updateContainerSize = () => {
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      containerSize.w = rect.width;
      containerSize.h = rect.height;
    }
  }
};

// Thumbnail background style calculation
const thumbnailStyle = computed(() => {
  if (!resolvedSrc.value || imgMeta.w === 0 || imgMeta.h === 0) return {};

  const isFull = !localRect.w || !localRect.h || (localRect.w === 0 && localRect.h === 0) || 
    (localRect.x === 0 && localRect.y === 0 && localRect.w === imgMeta.w && localRect.h === imgMeta.h);

  if (isFull) {
    return {
      backgroundImage: `url('${resolvedSrc.value}')`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated'
    };
  }

  // Calculate pixel-accurate subregion preview for the container
  const parsed = parseSizeClass(props.sizeClass);
  const cw = containerSize.w || parsed.w || 48;
  const ch = containerSize.h || parsed.h || 48;
  const rw = Math.max(1, localRect.w);
  const rh = Math.max(1, localRect.h);

  const scale = Math.min(cw / rw, ch / rh);
  const ox = (cw - rw * scale) / 2;
  const oy = (ch - rh * scale) / 2;

  const bgX = ox - localRect.x * scale;
  const bgY = oy - localRect.y * scale;

  return {
    backgroundImage: `url('${resolvedSrc.value}')`,
    backgroundSize: `${imgMeta.w * scale}px ${imgMeta.h * scale}px`,
    backgroundPosition: `${bgX}px ${bgY}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated'
  };
});

// Clamping helper
const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

// Emit changes to parent
const notifyRectChange = () => {
  const payload = {
    x: Math.round(localRect.x),
    y: Math.round(localRect.y),
    w: Math.round(localRect.w),
    h: Math.round(localRect.h)
  }
  emit('update:rect', payload)
  emit('change', payload)
}

// Input computed models with validation
const inputX = computed({
  get: () => localRect.x,
  set: (val) => {
    const num = isNaN(val) ? 0 : Number(val)
    localRect.x = clamp(num, 0, Math.max(0, imgMeta.w - localRect.w))
    notifyRectChange()
  }
})

const inputY = computed({
  get: () => localRect.y,
  set: (val) => {
    const num = isNaN(val) ? 0 : Number(val)
    localRect.y = clamp(num, 0, Math.max(0, imgMeta.h - localRect.h))
    notifyRectChange()
  }
})

const inputW = computed({
  get: () => localRect.w,
  set: (val) => {
    const num = isNaN(val) ? 1 : Number(val)
    localRect.w = clamp(num, 1, imgMeta.w - localRect.x)
    notifyRectChange()
  }
})

const inputH = computed({
  get: () => localRect.h,
  set: (val) => {
    const num = isNaN(val) ? 1 : Number(val)
    localRect.h = clamp(num, 1, imgMeta.h - localRect.y)
    notifyRectChange()
  }
})

// Fit canvas nicely to viewport
const fitToView = () => {
  if (!viewportRef.value || !workspaceWidth.value || !workspaceHeight.value) return
  const rect = viewportRef.value.getBoundingClientRect()
  const availW = rect.width - 60
  const availH = rect.height - 60

  const scaleW = availW / workspaceWidth.value
  const scaleH = availH / workspaceHeight.value
  let bestScale = Math.min(scaleW, scaleH)

  // Cap zoom to 1 or 2 if image is small, otherwise minimum 0.1
  bestScale = Math.max(0.1, Math.min(bestScale, 4))
  zoom.value = parseFloat(bestScale.toFixed(2))
  pan.x = 0
  pan.y = 0
}

const openModal = () => {
  if (props.disabled) return
  isOpen.value = true
  cropModeActive.value = true

  // Ensure initial rect is valid
  if ((localRect.w === 0 || localRect.h === 0) && imgMeta.w > 0) {
    localRect.x = 0
    localRect.y = 0
    localRect.w = imgMeta.w
    localRect.h = imgMeta.h
  }

  nextTick(() => {
    fitToView()
  })
}

const closeModal = () => {
  isOpen.value = false
  notifyRectChange()
}

const toggleCropMode = () => {
  cropModeActive.value = !cropModeActive.value
}

const resetToFullImage = () => {
  if (imgMeta.w > 0 && imgMeta.h > 0) {
    localRect.x = 0
    localRect.y = 0
    localRect.w = imgMeta.w
    localRect.h = imgMeta.h
    notifyRectChange()
  }
}

// Drag & Resize handles logic
const activeDrag = ref(null)

const startDrag = (handle, event) => {
  event.stopPropagation()
  activeDrag.value = {
    handle,
    startX: event.clientX,
    startY: event.clientY,
    initialRect: { ...localRect }
  }
}

const handleGlobalMouseMove = (event) => {
  // Viewport panning
  if (isPanning.value) {
    pan.x += event.clientX - panStart.x
    pan.y += event.clientY - panStart.y
    panStart.x = event.clientX
    panStart.y = event.clientY
    return
  }

  // Handle crop resizing / moving
  if (!activeDrag.value) return

  const { handle, startX, startY, initialRect } = activeDrag.value
  const currentZoom = zoom.value || 1

  let dx = (event.clientX - startX) / currentZoom
  let dy = (event.clientY - startY) / currentZoom

  // Apply grid snapping if active
  if (gridSnap.value > 1) {
    const snap = gridSnap.value
    dx = Math.round(dx / snap) * snap
    dy = Math.round(dy / snap) * snap
  }

  const imgW = imgMeta.w
  const imgH = imgMeta.h

  if (handle === 'move') {
    // Reposition crop box within image boundaries [0, 0, imgW, imgH]
    const maxNewX = Math.max(0, imgW - initialRect.w)
    const maxNewY = Math.max(0, imgH - initialRect.h)

    localRect.x = clamp(Math.round(initialRect.x + dx), 0, maxNewX)
    localRect.y = clamp(Math.round(initialRect.y + dy), 0, maxNewY)
  } else {
    // Resize via 8 handles, strictly bounded within [0, 0, imgW, imgH]
    let newX = initialRect.x
    let newY = initialRect.y
    let newW = initialRect.w
    let newH = initialRect.h

    // Handle horizontal adjustment
    if (handle.includes('e')) {
      newW = clamp(Math.round(initialRect.w + dx), 1, imgW - initialRect.x)
    } else if (handle.includes('w')) {
      const candidateX = clamp(Math.round(initialRect.x + dx), 0, initialRect.x + initialRect.w - 1)
      newW = initialRect.w + (initialRect.x - candidateX)
      newX = candidateX
    }

    // Handle vertical adjustment
    if (handle.includes('s')) {
      newH = clamp(Math.round(initialRect.h + dy), 1, imgH - initialRect.y)
    } else if (handle.includes('n')) {
      const candidateY = clamp(Math.round(initialRect.y + dy), 0, initialRect.y + initialRect.h - 1)
      newH = initialRect.h + (initialRect.y - candidateY)
      newY = candidateY
    }

    localRect.x = newX
    localRect.y = newY
    localRect.w = newW
    localRect.h = newH
  }

  scheduleNotify()
}

let notifyRaf = null
const scheduleNotify = () => {
  if (notifyRaf) return
  notifyRaf = requestAnimationFrame(() => {
    notifyRaf = null
    notifyRectChange()
  })
}

const handleGlobalMouseUp = () => {
  if (activeDrag.value) {
    activeDrag.value = null
    if (notifyRaf) {
      cancelAnimationFrame(notifyRaf)
      notifyRaf = null
    }
    notifyRectChange()
  }
  isPanning.value = false
}

// Viewport pan & zoom
const handleViewportMouseDown = (event) => {
  // Middle click (button 1) or Space + Left click
  if (event.button === 1 || (event.button === 0 && isSpacePressed.value)) {
    event.preventDefault()
    isPanning.value = true
    panStart.x = event.clientX
    panStart.y = event.clientY
  }
}

const handleWheel = (event) => {
  const delta = event.deltaY < 0 ? 1 : -1
  const factor = 1.15
  let newZoom = delta > 0 ? zoom.value * factor : zoom.value / factor
  newZoom = Math.max(0.1, Math.min(newZoom, 25))
  zoom.value = parseFloat(newZoom.toFixed(2))
}

const zoomIn = () => {
  zoom.value = parseFloat(Math.min(zoom.value * 1.25, 25).toFixed(2))
}

const zoomOut = () => {
  zoom.value = parseFloat(Math.max(zoom.value / 1.25, 0.1).toFixed(2))
}

// Keyboard shortcuts
const handleKeyDown = (event) => {
  if (!isOpen.value) return

  if (event.code === 'Space' && !event.repeat) {
    if (event.target.tagName !== 'INPUT') {
      isSpacePressed.value = true
    }
  } else if (event.key === 'Escape') {
    closeModal()
  } else if (event.key === 'Enter' && event.target.tagName !== 'INPUT') {
    closeModal()
  } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    if (event.target.tagName !== 'INPUT') {
      event.preventDefault()
      const step = event.shiftKey ? 10 : 1
      if (event.key === 'ArrowLeft') inputX.value = localRect.x - step
      if (event.key === 'ArrowRight') inputX.value = localRect.x + step
      if (event.key === 'ArrowUp') inputY.value = localRect.y - step
      if (event.key === 'ArrowDown') inputY.value = localRect.y + step
    }
  }
}

const handleKeyUp = (event) => {
  if (event.code === 'Space') {
    isSpacePressed.value = false
    isPanning.value = false
  }
}

let resizeObserver = null
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('mouseup', handleGlobalMouseUp)
  window.addEventListener('mousemove', handleGlobalMouseMove)
  updateContainerSize()
  if (typeof window !== 'undefined' && window.ResizeObserver && triggerRef.value) {
    resizeObserver = new ResizeObserver(() => updateContainerSize())
    resizeObserver.observe(triggerRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

defineExpose({
  openModal,
  closeModal,
  resetToFullImage,
  localRect,
  imgMeta,
  isOpen
})
</script>

<style scoped>
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
</style>
