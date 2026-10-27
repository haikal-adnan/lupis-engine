<template>
  <div class="w-full h-full flex bg-background font-sans select-none overflow-hidden border-t border-border" data-testid="animator-timeline-section">
    
    <!-- Controls Sidebar -->
    <div class="w-44 border-r border-border bg-muted/5 flex flex-col p-4 gap-4 shrink-0">
      <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Playback</div>
      
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between bg-background border border-border rounded-lg p-1 shadow-sm">
          <button @click="stepBackward" class="p-2 hover:bg-accent rounded transition-colors group" data-testid="animator-timeline-step-back-btn">
            <SkipBack class="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </button>
          
          <button @click="togglePlay" :aria-pressed="isPlaying" class="p-2.5 rounded-md transition-colors shadow-md" :class="isPlaying ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'" data-testid="animator-timeline-play-toggle">
            <Pause v-if="isPlaying" class="w-4 h-4" />
            <Play v-else class="w-4 h-4" />
          </button>
          
          <button @click="stepForward" class="p-2 hover:bg-accent rounded transition-colors group" data-testid="animator-timeline-step-forward-btn">
            <SkipForward class="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        <div class="px-1 py-2 bg-secondary/30 rounded-md border border-border">
          <div class="flex justify-between items-center px-1">
            <span class="text-[9px] font-bold text-muted-foreground">FRAME</span>
            <span class="text-xs font-mono font-bold text-primary" data-testid="animator-timeline-frame-counter">{{ frames.length > 0 ? currentFrameIndex + 1 : 0 }} / {{ frames.length }}</span>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-4 border-t border-border flex flex-col gap-2">
        <button @click="addFrame" class="w-full py-2 flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary rounded-md hover:bg-primary/20 transition-all text-xs font-bold shadow-sm" :disabled="!activeClipData" data-testid="animator-timeline-add-frame-btn">
          <Plus class="w-3.5 h-3.5" /> Add Frame
        </button>
        
        <div class="grid grid-cols-2 gap-2">
          <button @click="autoFill" class="w-full py-1.5 flex items-center justify-center gap-1.5 bg-secondary/50 text-foreground border border-border rounded-md hover:bg-secondary transition-all text-[10px] font-bold shadow-sm" :disabled="!activeClipData" data-testid="animator-timeline-autofill-btn">
            <Wand2 class="w-3 h-3" /> Auto Fill
          </button>
          <button @click="clearTimeline" class="w-full py-1.5 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive border border-destructive rounded-md hover:bg-destructive/20 transition-all text-[10px] font-bold shadow-sm" :disabled="!activeClipData || frames.length === 0" data-testid="animator-timeline-clear-btn">
            <Trash2 class="w-3 h-3" /> Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Timeline Strip -->
    <div class="flex-1 flex flex-col min-w-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
      <ScrollArea orientation="horizontal" class="flex-1 w-full h-full">
        <div class="flex items-stretch gap-1 p-2 h-full w-max min-w-full">
          <div v-for="(sourceId, index) in frames" :key="index" @click="selectFrame(index)" class="relative w-28 h-full rounded-md border-2 flex flex-col items-center justify-center shrink-0 transition-all cursor-pointer group" :class="[ currentFrameIndex === index ? 'border-primary bg-primary/10 z-10 shadow-sm' : 'border-transparent bg-background/60 hover:bg-background hover:border-border' ]" data-testid="animator-timeline-frame-item" :data-frame-index="index">
            <div class="absolute top-2 left-2 text-[10px] font-mono font-bold opacity-20">#{{ index }}</div>
            
            <button @click.stop="removeFrame(index)" v-if="frames.length > 1" class="absolute top-1 right-1 p-1 rounded hover:bg-destructive/20 text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" :class="{ 'opacity-100 text-destructive/70': currentFrameIndex === index }" data-testid="animator-timeline-remove-frame-btn">
              <Trash2 class="w-3.5 h-3.5" />
            </button>

            <div class="flex-1 w-full flex items-center justify-center px-2 py-4">
              <div class="w-16 h-16 rounded bg-muted/20 flex items-center justify-center border border-dashed border-border group-hover:border-primary/30 transition-colors relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVrv+Pv37//gZgAAgwAU2gOA70Q1P4AAAAASUVORD5CYII=')] opacity-10"></div>
                <div v-if="getFrameStyle(sourceId)" :style="getFrameStyle(sourceId)" class="relative z-10"></div>
                <span v-else class="relative text-[10px] font-bold text-muted-foreground/40">{{ sourceId }}</span>
              </div>
            </div>
            
            <div class="w-full py-2 px-2 bg-muted/30 border-t border-border text-center truncate">
              <span class="text-[10px] font-mono font-bold" :class="currentFrameIndex === index ? 'text-primary' : 'text-muted-foreground'">SRC: {{ sourceId }}</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- Source Inspector -->
    <div class="w-[300px] bg-background flex flex-col shrink-0 border-l border-border overflow-hidden" data-testid="animator-timeline-source-inspector">
      <div v-if="frames.length > 0" class="p-3 mt-1 space-y-1">
        <PropertyRow label="Source ID">
          <div class="flex gap-1.5 w-full items-center">
            <BaseSelect v-model="currentSourceId" :options="sourceOptions" placeholder="Select Source..." class="flex-1 min-w-0" :editable="true" action-label="Create New Source..." @action="handleCreateSource" @delete="handleDeleteSource" data-testid="animator-timeline-source-select" />
            
            <BaseDropdown align="right">
              <template #trigger="{ isOpen }">
                <button class="h-7 w-7 flex items-center justify-center rounded-md border transition-colors shrink-0" :class="isOpen ? 'bg-muted text-foreground border-border' : 'border-transparent hover:bg-muted text-muted-foreground'" data-testid="animator-timeline-source-more-menu"><MoreVertical class="w-4 h-4" /></button>
              </template>
              <template #default="{ close }">
                <div class="flex flex-col text-xs min-w-[160px] py-1">
                  <button 
                    @click="resetToNativeSize(); close()" 
                    :disabled="!canResetSize"
                    class="relative flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    data-testid="animator-timeline-reset-size-btn"
                  >
                    <Maximize class="w-3.5 h-3.5 mr-2 opacity-70" /> 
                    Reset to Native Size
                  </button>
                  <div class="h-px bg-border/50 my-1"></div>
                  <button @click="deleteAllSources(); close()" class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-destructive/20 text-destructive text-left" data-testid="animator-timeline-delete-all-sources-btn">
                    <Trash2 class="w-3.5 h-3.5 mr-2 opacity-70" /> Delete All Sources
                  </button>
                </div>
              </template>
            </BaseDropdown>
          </div>
        </PropertyRow>

        <!-- Source Crop Thumbnail Preview -->
        <div class="flex gap-2.5 my-2.5 p-2 rounded-lg border border-border/60 bg-muted/20 items-center">
          <BaseCropThumbnail 
            ref="cropThumbnailRef"
            :src="resolvedAssetUrl"
            :rect="currentSourceRect"
            @update:rect="updateCurrentSourceRect"
            name="Source Frame Crop"
            sizeClass="w-12 h-12 bg-muted/40 border-border/80 shrink-0 rounded-md shadow-inner"
            data-testid="animator-timeline-crop-thumbnail"
          />
          <div class="flex-1 flex flex-col justify-center min-w-0">
            <span class="text-xs font-mono font-bold text-foreground truncate">{{ currentSourceId }}</span>
            <span class="text-[10px] text-muted-foreground font-mono">Frame #{{ currentFrameIndex + 1 }}</span>
            <span class="text-[9px] text-primary font-mono font-medium">{{ currentRectW }} × {{ currentRectH }} px</span>
          </div>
        </div>

        <div class="h-px bg-border/50 my-2"></div>

        <PropertyRow label="Source Rect" :no-margin="true">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber v-model="currentRectX" prefix="X" :scrubbable="true" class="font-mono" data-testid="animator-timeline-rect-x" />
            <BaseNumber v-model="currentRectY" prefix="Y" :scrubbable="true" class="font-mono" data-testid="animator-timeline-rect-y" />
            <BaseNumber v-model="currentRectW" prefix="W" :min="0" :scrubbable="true" class="font-mono" data-testid="animator-timeline-rect-w" />
            <BaseNumber v-model="currentRectH" prefix="H" :min="0" :scrubbable="true" class="font-mono" data-testid="animator-timeline-rect-h" />
          </div>
        </PropertyRow>
      </div>

      <div v-else class="flex-1 flex items-center justify-center p-6 text-center">
        <span class="text-[10px] text-muted-foreground italic">No frames available.</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Play, Pause, SkipBack, SkipForward, Plus, Maximize, Trash2, MoreVertical, Wand2 } from 'lucide-vue-next';
import { useAnimatorLogic } from '@animators/animators.js';
import { useAssetStore } from '@assets/assets.js';
import { PropertyRow, BaseNumber, BaseSelect, BaseDropdown, BaseCropThumbnail, ScrollArea } from '@components/components.js';

const { 
  activeClipData, selectedEntity, syncAnimatorData, currentFrameIndex, resolvedAssetUrl, frames, sources, isPlaying,
  stepForward, stepBackward, togglePlay, stopPlayback, addFrame, removeFrame, clearTimeline, autoFill, 
  handleCreateSource, handleDeleteSource, deleteAllSources 
} = useAnimatorLogic();

const assetStore = useAssetStore();

const sourceOptions = computed(() => Object.keys(sources.value).map(key => ({ label: key, value: key })));

const selectFrame = (index) => {
  currentFrameIndex.value = index;
  if (isPlaying.value) stopPlayback();
};

const currentSourceId = computed({
  get: () => frames.value[currentFrameIndex.value] || '',
  set: (val) => {
    if (activeClipData.value && val) {
      activeClipData.value.frames[currentFrameIndex.value] = val;
      syncAnimatorData();
    }
  }
});

const createRectProxy = (key) => computed({
  get: () => sources.value[currentSourceId.value]?.[key] || 0,
  set: (val) => {
    if (activeClipData.value && currentSourceId.value) {
      if (!activeClipData.value.sources[currentSourceId.value]) {
        activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w: 0, h: 0 };
      }
      activeClipData.value.sources[currentSourceId.value][key] = val;
      syncAnimatorData();
    }
  }
});

const currentRectX = createRectProxy('x');
const currentRectY = createRectProxy('y');
const currentRectW = createRectProxy('w');
const currentRectH = createRectProxy('h');

const cropThumbnailRef = ref(null);

const currentSourceRect = computed(() => ({
  x: currentRectX.value || 0,
  y: currentRectY.value || 0,
  w: currentRectW.value || 0,
  h: currentRectH.value || 0
}));

const updateCurrentSourceRect = (rect) => {
  if (!rect || !activeClipData.value || !currentSourceId.value) return;
  if (!activeClipData.value.sources) activeClipData.value.sources = {};
  if (!activeClipData.value.sources[currentSourceId.value]) {
    activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w: 0, h: 0 };
  }
  const s = activeClipData.value.sources[currentSourceId.value];
  s.x = rect.x;
  s.y = rect.y;
  s.w = rect.w;
  s.h = rect.h;
  syncAnimatorData();
};

const getFrameStyle = (sourceId) => {
  const clip = activeClipData.value;
  if (!clip || !resolvedAssetUrl.value) return null;

  const rect = clip.sources[sourceId] || { x: 0, y: 0, w: 0, h: 0 };
  if (rect.w <= 0 || rect.h <= 0) return null;

  const scale = Math.min(60 / rect.w, 60 / rect.h, 1.5);
  const isFlipped = clip.flipX ? -1 : 1;

  return {
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    backgroundImage: `url('${resolvedAssetUrl.value}')`,
    backgroundPosition: `-${rect.x}px -${rect.y}px`,
    backgroundRepeat: 'no-repeat',
    transform: `scale(${scale * isFlipped}, ${scale})`,
    imageRendering: 'pixelated'
  };
};

const canResetSize = computed(() => {
  const assetId = activeClipData.value?.assetId || selectedEntity.value?.components?.SpriteRenderer?.assetId;
  return !!assetId && !!currentSourceId.value;
});

const resetToNativeSize = async () => {
  const targetAssetId = activeClipData.value?.assetId || selectedEntity.value?.components?.SpriteRenderer?.assetId;
  if (!targetAssetId) return;
  let w = 0, h = 0;
  const asset = assetStore.getAssetById(targetAssetId);
  if (asset?.meta?.dimensions) {
    w = asset.meta.dimensions.w;
    h = asset.meta.dimensions.h;
  } else {
    const url = (await assetStore.getAssetUrlById(targetAssetId)) || resolvedAssetUrl.value;
    if (url) {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          w = img.naturalWidth || img.width;
          h = img.naturalHeight || img.height;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    }
  }

  if (w > 0 && h > 0) {
    if (activeClipData.value) {
      activeClipData.value.baseSize = { w, h };
      if (currentSourceId.value) {
        if (!activeClipData.value.sources) activeClipData.value.sources = {};
        activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w, h };
      }
      syncAnimatorData();
    }
    if (selectedEntity.value?.components?.UITransform) {
      selectedEntity.value.components.UITransform.width = w;
      selectedEntity.value.components.UITransform.height = h;
    } else if (selectedEntity.value?.components?.Transform) {
      selectedEntity.value.components.Transform.width = w;
      selectedEntity.value.components.Transform.height = h;
    }
  }
};
</script>