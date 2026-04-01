<script setup>
import { ref, watch, nextTick } from 'vue';
import { X, Crop, Loader2, ZoomIn, ZoomOut } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  imageFile: File,
  isUploading: Boolean
});

const emit = defineEmits(['close', 'crop']);

const imageSrc = ref('');
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imageRef = ref(null);
const containerRef = ref(null);

const MIN_SCALE = 0.1; 
const MAX_SCALE = 10;  

// TARGET OUTPUT RESOLUTION (16:9)
const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

watch(() => props.imageFile, (newFile) => {
  if (newFile) {
    const reader = new FileReader();
    reader.onload = async (e) => { 
      imageSrc.value = e.target.result; 
      await nextTick();
      resetView(); 
    };
    reader.readAsDataURL(newFile);
  } else {
    imageSrc.value = '';
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) resetView();
});

const resetView = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
  
  if (imageRef.value && containerRef.value) {
    // Hitung area crop (16:9 dari lebar container visual)
    const guideWidth = containerRef.value.clientWidth * 0.9; // Guide takes 90% of width
    const guideHeight = guideWidth * (9/16); 

    const scaleX = guideWidth / imageRef.value.naturalWidth;
    const scaleY = guideHeight / imageRef.value.naturalHeight;
    scale.value = Math.max(scaleX, scaleY);
  }
};

const handleZoom = (e) => {
  if (props.isUploading) return;
  const zoomSensitivity = 0.1; 
  const delta = e.deltaY < 0 ? 1 : -1;
  let newScale = scale.value * (1 + delta * zoomSensitivity);
  scale.value = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
};

const zoomIn = () => { if(!props.isUploading) scale.value = Math.min(scale.value * 1.2, MAX_SCALE); };
const zoomOut = () => { if(!props.isUploading) scale.value = Math.max(scale.value / 1.2, MIN_SCALE); };

const startDrag = (e) => {
  if (props.isUploading) return;
  isDragging.value = true;
  dragStart.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y };
};
const onDrag = (e) => {
  if (!isDragging.value || props.isUploading) return;
  position.value = { x: e.clientX - dragStart.value.x, y: e.clientY - dragStart.value.y };
};
const stopDrag = () => { isDragging.value = false; };

const handleCrop = () => {
  if (!imageRef.value || !containerRef.value) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  const containerWidth = containerRef.value.clientWidth;
  const guideWidth = containerWidth * 0.9; 
  const outputRatio = OUTPUT_WIDTH / guideWidth;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2);
  ctx.translate(position.value.x * outputRatio, position.value.y * outputRatio);

  const finalScale = scale.value * outputRatio;
  ctx.scale(finalScale, finalScale);
  
  const img = imageRef.value;
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  canvas.toBlob((blob) => {
    const croppedFile = new File([blob], 'thumbnail_cropped.jpg', { type: 'image/jpeg' });
    emit('crop', croppedFile);
  }, 'image/jpeg', 0.9);
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 select-none">
    <div class="bg-background border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col transition-all animate-in fade-in scale-in-95 duration-200">
      
      <div class="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0 rounded-t-2xl">
        <h3 class="font-bold flex items-center gap-2 text-foreground">
          <Crop class="w-4 h-4 text-cyan-500" /> Potong Thumbnail Game
        </h3>
        <button @click="$emit('close')" :disabled="isUploading" class="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive p-1 rounded-lg transition-colors disabled:opacity-50">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div 
        ref="containerRef"
        class="relative w-full aspect-video overflow-hidden bg-checkerboard flex items-center justify-center group"
        :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @wheel.prevent="handleZoom"
        @mousedown.prevent="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        @dblclick="resetView"
      >
        <img 
          ref="imageRef"
          :src="imageSrc" 
          class="max-w-none max-h-none origin-center pointer-events-none transition-transform duration-75 ease-out"
          :style="{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }"
          draggable="false"
          @load="resetView"
        />

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div class="w-[90%] aspect-video shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] border-2 border-white/50 pointer-events-none relative rounded-sm">
              <div class="absolute inset-0 border border-dashed border-white/30"></div>
           </div>
        </div>

        <div v-if="isUploading" class="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
          <Loader2 class="w-10 h-10 text-cyan-500 animate-spin" />
        </div>

        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background p-1.5 rounded-lg border border-border shadow-lg z-20" @mousedown.stop>
          <button @click="zoomOut" :disabled="isUploading" class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <ZoomOut class="w-4 h-4" />
          </button>
          
          <div class="w-14 text-center text-xs font-bold text-foreground tabular-nums cursor-pointer hover:text-cyan-500 transition-colors" @click="resetView">
             {{ Math.round(scale * 100) }}%
          </div>

          <button @click="zoomIn" :disabled="isUploading" class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <ZoomIn class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="p-4 border-t border-border flex justify-between items-center bg-muted/30 rounded-b-2xl">
        <p class="text-[10px] text-muted-foreground hidden sm:block">Scroll: Zoom | Drag: Pan</p>
        <div class="flex justify-end gap-2 w-full sm:w-auto">
          <button @click="$emit('close')" :disabled="isUploading" class="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50">
            Batal
          </button>
          <button @click="handleCrop" :disabled="isUploading" class="px-5 py-2 rounded-lg text-sm font-bold bg-cyan-500 hover:bg-cyan-600 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-w-[140px]">
            <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" />
            <span v-else>Simpan Thumbnail</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.bg-checkerboard {
  background-image: linear-gradient(45deg, #1e1e1e 25%, transparent 25%), linear-gradient(-45deg, #1e1e1e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e1e1e 75%), linear-gradient(-45deg, transparent 75%, #1e1e1e 75%);
  background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
</style>