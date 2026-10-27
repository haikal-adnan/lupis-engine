<template>
  <div class="w-full h-full flex bg-background font-sans select-none overflow-hidden border-t border-border">
    
    <div class="w-44 border-r border-border bg-muted/5 flex flex-col p-4 gap-4 shrink-0">
      <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Playback</div>
      
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between bg-background border border-border rounded-lg p-1 shadow-sm">
          <button @click="stepBackward" class="p-2 hover:bg-accent rounded transition-colors group">
            <SkipBack class="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </button>
          
          <button 
            @click="togglePlay"
            class="p-2.5 rounded-md transition-all shadow-md"
            :class="isPlaying ? 'bg-amber-500 text-white animate-pulse' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
          >
            <Pause v-if="isPlaying" class="w-4 h-4" />
            <Play v-else class="w-4 h-4" />
          </button>
          
          <button @click="stepForward" class="p-2 hover:bg-accent rounded transition-colors group">
            <SkipForward class="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </button>
        </div>

        <div class="px-1 py-2 bg-secondary/30 rounded-md border border-border">
          <div class="flex justify-between items-center px-1">
            <span class="text-[9px] font-bold text-muted-foreground">FRAME</span>
            <span class="text-xs font-mono font-bold text-primary">{{ frames.length > 0 ? currentFrameIndex + 1 : 0 }} / {{ frames.length }}</span>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-4 border-t border-border flex flex-col gap-2">
         <button @click="addFrame" class="w-full py-2 flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary rounded-md hover:bg-primary/20 transition-all text-xs font-bold shadow-sm" :disabled="!activeClipData">
           <Plus class="w-3.5 h-3.5" /> Add Frame
         </button>
         
         <div class="grid grid-cols-2 gap-2">
           <button @click="autoFill" class="w-full py-1.5 flex items-center justify-center gap-1.5 bg-secondary/50 text-foreground border border-border rounded-md hover:bg-secondary transition-all text-[10px] font-bold shadow-sm" :disabled="!activeClipData">
             <Wand2 class="w-3 h-3" /> Auto Fill
           </button>
           <button @click="clearTimeline" class="w-full py-1.5 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive border border-destructive rounded-md hover:bg-destructive/20 transition-all text-[10px] font-bold shadow-sm" :disabled="!activeClipData || frames.length === 0">
             <Trash2 class="w-3 h-3" /> Clear
           </button>
         </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-w-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
      
      <ScrollArea orientation="horizontal" class="flex-1 w-full h-full">
        <div class="flex items-stretch gap-1 p-2 h-full w-max min-w-full">
          
          <div 
            v-for="(sourceId, index) in frames" 
            :key="index"
            @click="selectFrame(index)"
            class="relative w-28 h-full rounded-md border-2 flex flex-col items-center justify-center shrink-0 transition-all cursor-pointer group"
            :class="[
              currentFrameIndex === index 
                ? 'border-primary bg-primary/10 z-10 shadow-sm' 
                : 'border-transparent bg-background/60 hover:bg-background hover:border-border'
            ]"
          >
            <div class="absolute top-2 left-2 text-[10px] font-mono font-bold opacity-20">#{{ index }}</div>
            
            <button 
              @click.stop="removeFrame(index)"
              v-if="frames.length > 1"
              class="absolute top-1 right-1 p-1 rounded hover:bg-destructive/20 text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              :class="{ 'opacity-100 text-destructive/70': currentFrameIndex === index }"
              title="Delete Frame"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>

            <div class="flex-1 w-full flex items-center justify-center px-2 py-4">
              <div class="w-16 h-16 rounded bg-muted/20 flex items-center justify-center border border-dashed border-border group-hover:border-primary/30 transition-colors relative overflow-hidden">
                  <div class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVrv+Pv37//gZgAAgwAU2gOA70Q1P4AAAAASUVORK5CYII=')] opacity-10"></div>
                  
                  <div v-if="getFrameStyle(sourceId)" :style="getFrameStyle(sourceId)" class="relative z-10"></div>
                  <span v-else class="relative text-[10px] font-bold text-muted-foreground/40">{{ sourceId }}</span>
              </div>
            </div>
            
            <div class="w-full py-2 px-2 bg-muted/30 border-t border-border text-center truncate">
              <span class="text-[10px] font-mono font-bold" :class="currentFrameIndex === index ? 'text-primary' : 'text-muted-foreground'">
                  SRC: {{ sourceId }}
              </span>
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>

    <div class="w-[300px] bg-background flex flex-col shrink-0 border-l border-border overflow-hidden">
      
      <div v-if="frames.length > 0" class="p-3 mt-1 space-y-1">
        <PropertyRow label="Source ID">
          <div class="flex gap-1.5 w-full items-center">
            
            <BaseSelect 
              v-model="currentSourceId" 
              :options="sourceOptions" 
              placeholder="Select Source..." 
              class="flex-1 min-w-0"
              :editable="true"
              action-label="Create New Source..."
              @action="handleCreateSource"
              @delete="handleDeleteSource"
            />
            
          <BaseDropdown align="right">
              <template #trigger="{ isOpen }">
                <button class="h-7 w-7 flex items-center justify-center rounded-md border transition-colors shrink-0" :class="isOpen ? 'bg-muted text-foreground border-border' : 'border-transparent hover:bg-muted text-muted-foreground'"><MoreVertical class="w-4 h-4" /></button>
              </template>
              <template #default="{ close }">
                <div class="flex flex-col text-xs min-w-[160px] py-1">
                  <button @click="renameClip(); close()" class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-accent text-left">
                    <Pencil class="w-3.5 h-3.5 mr-2 opacity-70" /> Rename Clip
                  </button>
                  
                  <div class="h-px bg-border/50 my-1"></div>
                  
                  <button @click="deleteAllSources(); close()" class="flex items-center px-2 py-1.5 mx-1 rounded-sm hover:bg-destructive/20 text-destructive text-left">
                    <Trash2 class="w-3.5 h-3.5 mr-2 opacity-70" /> Delete All Sources
                  </button>
                </div>
              </template>
            </BaseDropdown>

          </div>
        </PropertyRow>

        <div class="h-px bg-border/50 my-3"></div>

        <PropertyRow label="Source Rect" :no-margin="true">
          <div class="grid grid-cols-2 gap-2">
            <BaseNumber v-model="currentRectX" prefix="X" :scrubbable="true" class="font-mono" />
            <BaseNumber v-model="currentRectY" prefix="Y" :scrubbable="true" class="font-mono" />
            <BaseNumber v-model="currentRectW" prefix="W" :min="0" :scrubbable="true" class="font-mono" />
            <BaseNumber v-model="currentRectH" prefix="H" :min="0" :scrubbable="true" class="font-mono" />
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
import { ref, computed, onUnmounted, watch } from 'vue';
import { Play, Pause, SkipBack, SkipForward, Plus, Pencil, Trash2, MoreVertical, Wand2 } from 'lucide-vue-next';
import { useAnimatorLogic } from '@editors/animator/composables/useAnimatorLogic.js';
import { usePrompt } from '@/composables/usePrompt';
import { useConfirm } from '@/composables/useConfirm';
import { useAssetStore } from '@/stores/useAssetStore.js';

import PropertyRow from "@ui/display/PropertyRow.vue";
import BaseNumber from "@/commons/components/inputs/BaseNumber.vue";
import BaseSelect from "@/commons/components/inputs/BaseSelect.vue";
import BaseDropdown from '@ui/overlay/BaseDropdown.vue';
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue';

const { activeClipData, syncAnimatorData, currentFrameIndex } = useAnimatorLogic();
const { prompt } = usePrompt();
const { confirm } = useConfirm();
const assetStore = useAssetStore();

const isPlaying = ref(false);
let playbackTimer = null;

const frames = computed(() => activeClipData.value?.frames || []);
const sources = computed(() => activeClipData.value?.sources || {});
const fps = computed(() => activeClipData.value?.fps || 12);

const sourceOptions = computed(() => {
  return Object.keys(sources.value).map(key => ({ label: key, value: key }));
});

const currentSourceId = computed({
  get: () => frames.value[currentFrameIndex.value] || '',
  set: (val) => {
    if (activeClipData.value && val) {
      activeClipData.value.frames[currentFrameIndex.value] = val;
      syncAnimatorData();
    }
  }
});

const currentRectX = computed({
  get: () => sources.value[currentSourceId.value]?.x || 0,
  set: (val) => { 
    if (activeClipData.value && currentSourceId.value) {
      if (!activeClipData.value.sources[currentSourceId.value]) {
        activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w: 0, h: 0 };
      }
      activeClipData.value.sources[currentSourceId.value].x = val;
      syncAnimatorData();
    }
  }
});

const currentRectY = computed({
  get: () => sources.value[currentSourceId.value]?.y || 0,
  set: (val) => { 
    if (activeClipData.value && currentSourceId.value) {
      if (!activeClipData.value.sources[currentSourceId.value]) {
        activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w: 0, h: 0 };
      }
      activeClipData.value.sources[currentSourceId.value].y = val;
      syncAnimatorData();
    }
  }
});

const currentRectW = computed({
  get: () => sources.value[currentSourceId.value]?.w || 0,
  set: (val) => { 
    if (activeClipData.value && currentSourceId.value) {
      if (!activeClipData.value.sources[currentSourceId.value]) {
        activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w: 0, h: 0 };
      }
      activeClipData.value.sources[currentSourceId.value].w = val;
      syncAnimatorData();
    }
  }
});

const currentRectH = computed({
  get: () => sources.value[currentSourceId.value]?.h || 0,
  set: (val) => { 
    if (activeClipData.value && currentSourceId.value) {
      if (!activeClipData.value.sources[currentSourceId.value]) {
        activeClipData.value.sources[currentSourceId.value] = { x: 0, y: 0, w: 0, h: 0 };
      }
      activeClipData.value.sources[currentSourceId.value].h = val;
      syncAnimatorData();
    }
  }
});

watch(frames, (newFrames) => {
  if (currentFrameIndex.value >= newFrames.length && newFrames.length > 0) {
    currentFrameIndex.value = Math.max(0, newFrames.length - 1);
  } else if (newFrames.length === 0) {
    currentFrameIndex.value = 0;
  }
});

const selectFrame = (index) => {
  currentFrameIndex.value = index;
  if (isPlaying.value) stopPlayback();
};
const stepForward = () => {
  if (frames.value.length === 0) return;
  currentFrameIndex.value = (currentFrameIndex.value + 1) % frames.value.length;
};
const stepBackward = () => {
  if (frames.value.length === 0) return;
  currentFrameIndex.value = (currentFrameIndex.value - 1 + frames.value.length) % frames.value.length;
};
const togglePlay = () => { isPlaying.value ? stopPlayback() : startPlayback(); };
const startPlayback = () => {
  if (frames.value.length <= 1) return;
  isPlaying.value = true;
  playbackTimer = setInterval(stepForward, 1000 / fps.value);
};
const stopPlayback = () => {
  isPlaying.value = false;
  if (playbackTimer) { clearInterval(playbackTimer); playbackTimer = null; }
};

const getFrameStyle = (sourceId) => {
  const clip = activeClipData.value;
  if (!clip || !clip.assetId) return null;

  const assetUrl = assetStore.getAssetUrlById(clip.assetId);
  if (!assetUrl) return null;

  const rect = clip.sources[sourceId] || { x: 0, y: 0, w: 0, h: 0 };
  
  if (rect.w <= 0 || rect.h <= 0) return null;

  const containerSize = 60; 
  const scale = Math.min(containerSize / rect.w, containerSize / rect.h, 1.5);
  const isFlipped = clip.flipX ? -1 : 1;

  return {
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    backgroundImage: `url('${assetUrl}')`,
    backgroundPosition: `-${rect.x}px -${rect.y}px`,
    backgroundRepeat: 'no-repeat',
    transform: `scale(${scale * isFlipped}, ${scale})`, 
    imageRendering: 'pixelated',
  };
};

const addFrame = () => {
  if (!activeClipData.value) return;

  const clip = activeClipData.value;
  const lastSourceId = frames.value[frames.value.length - 1];
  const lastRect = sources.value[lastSourceId];

  const newIndex = Object.keys(clip.sources || {}).length;
  const newSourceId = `s_${newIndex}`;

  if (!clip.sources) clip.sources = {};
  
  clip.sources[newSourceId] = {
    x: lastRect ? lastRect.x + lastRect.w : 0,
    y: lastRect ? lastRect.y : 0,
    w: clip.baseSize?.w || 32,
    h: clip.baseSize?.h || 32
  };

  clip.frames.push(newSourceId);
  currentFrameIndex.value = clip.frames.length - 1;
  syncAnimatorData();
};

const removeFrame = (index) => {
  if (frames.value.length <= 1) return;
  activeClipData.value.frames.splice(index, 1);
  if (currentFrameIndex.value >= frames.value.length) currentFrameIndex.value = frames.value.length - 1;
  syncAnimatorData();
};

const clearTimeline = async () => {
  if (!activeClipData.value || frames.value.length === 0) return;
  
  const isConfirmed = await confirm({ 
    title: 'Clear Timeline', 
    message: 'Apakah kamu yakin ingin menghapus semua frame dari timeline ini?', 
    type: 'danger', 
    confirmText: 'Clear' 
  });
  
  if (isConfirmed) {
    activeClipData.value.frames = [];
    currentFrameIndex.value = 0;
    syncAnimatorData();
  }
};

const autoFill = async () => {
  if (!activeClipData.value) return;

  const clip = activeClipData.value;
  let maxWidth = 0;

  if (clip.assetId) {
    const assetInfo = assetStore.getAssetById(clip.assetId);
    if (assetInfo?.meta?.dimensions?.w) {
      maxWidth = assetInfo.meta.dimensions.w;
    }
  }

  if (!maxWidth || maxWidth <= 0) {
    const maxWidthStr = await prompt({ 
      title: 'Auto Fill Frames', 
      message: 'Asset belum dipilih atau width tidak terbaca. Masukkan total width manual:', 
      placeholder: 'misal: 160', 
      confirmText: 'Auto Fill' 
    });

    if (!maxWidthStr) return;
    maxWidth = parseInt(maxWidthStr, 10);
    if (isNaN(maxWidth) || maxWidth <= 0) return;
  }

  const baseW = clip.baseSize?.w || 32;
  const baseH = clip.baseSize?.h || 32;

  if (!clip.sources) clip.sources = {};
  if (!clip.frames) clip.frames = [];

  let currentX = 0;
  let currentY = 0;

  if (clip.frames.length > 0) {
    const lastSourceId = clip.frames[clip.frames.length - 1];
    const lastRect = clip.sources[lastSourceId];
    if (lastRect) {
      currentX = lastRect.x + lastRect.w;
      currentY = lastRect.y;
    }
  }

  let addedCount = 0;
  let sourceIndex = Object.keys(clip.sources).length;
  const uniqueSuffix = Date.now().toString().slice(-4); 

  while (currentX + baseW <= maxWidth) {
    const newSourceId = `s_auto_${uniqueSuffix}_${sourceIndex}`;
    
    clip.sources[newSourceId] = {
      x: currentX,
      y: currentY,
      w: baseW,
      h: baseH
    };
    
    clip.frames.push(newSourceId);
    
    currentX += baseW;
    sourceIndex++;
    addedCount++;
  }

  if (addedCount > 0) {
    currentFrameIndex.value = clip.frames.length - 1;
    syncAnimatorData();
  }
};

const handleCreateSource = async () => {
  const newSourceName = await prompt({ title: 'New Source', message: 'Name:', placeholder: 'e.g. run_01', confirmText: 'Create' });
  if (!newSourceName) return;
  
  const cleanName = newSourceName.trim().toLowerCase().replace(/\s+/g, '_');
  if (!cleanName || sources.value[cleanName]) return; 

  if (!activeClipData.value.sources) activeClipData.value.sources = {};
  
  activeClipData.value.sources[cleanName] = { 
    x: 0, y: 0, 
    w: activeClipData.value.baseSize?.w || 32, 
    h: activeClipData.value.baseSize?.h || 32 
  };
  
  activeClipData.value.frames[currentFrameIndex.value] = cleanName;
  syncAnimatorData();
};

const handleDeleteSource = (sourceToDelete) => {
  if (activeClipData.value && activeClipData.value.sources[sourceToDelete]) {
    delete activeClipData.value.sources[sourceToDelete];
    syncAnimatorData();
  }
};

const renameClip = async () => {
  if (!activeClipData.value) return;
  const newName = await prompt({
    title: 'Rename Clip',
    message: 'Masukkan nama baru untuk clip ini:',
    placeholder: activeClipData.value.name || 'New Clip Name',
    confirmText: 'Rename'
  });
  
  if (newName && newName.trim()) {
    activeClipData.value.name = newName.trim();
    syncAnimatorData();
  }
};

const deleteAllSources = async () => {
  if (!activeClipData.value) return;
  
  const isConfirmed = await confirm({
    title: 'Delete All Sources?',
    message: 'Apakah kamu yakin ingin menghapus semua Source dari clip ini?',
    type: 'danger',
    confirmText: 'Delete All'
  });
  
  if (isConfirmed) {
    activeClipData.value.sources = {};
    syncAnimatorData();
  }
};

const pickFromCanvas = () => {};
const autoCalcRect = () => {};

onUnmounted(stopPlayback);
</script>