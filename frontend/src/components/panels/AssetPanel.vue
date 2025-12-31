<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useBackend } from '@/composables/useBackend.js';
import { useEditorState } from '@/composables/useEditorState.js';
import { addLocalAsset, renameLocalAsset, deleteLocalAsset, getLocalAssetsByProject } from '@/services/assetService.js';
import { useAssetActions } from '@/composables/useAssetActions.js';
import { bus } from "@engine/Util/EventBus.js";

const emit = defineEmits(['close']);
const { applyTextureToEntity } = useAssetActions();

const handleAssetDoubleClick = (item) => {
    applyTextureToEntity(item);
};

const viewMode = ref('grid');
const searchQuery = ref('');
const currentFolderId = ref(null);
const fileInput = ref(null);

const localAssets = ref([]); 
const uploadQueue = ref([]); 

const contextMenu = ref({ visible: false, x: 0, y: 0, item: null });
const clipboard = ref(null);

// --- STATE & LOGIC UNTUK TOOLTIP HOVER (BARU) ---
const hoveredItem = ref(null);
const tooltipPos = ref({ x: 0, y: 0 });

const onItemMouseEnter = (e, item) => {
    if (item.isGhost) return; // Jangan tampilkan tooltip untuk item loading
    hoveredItem.value = item;

    // Hitung posisi elemen di layar
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Posisikan tooltip di tengah horizontal item, dan sedikit di bawahnya
    tooltipPos.value = {
        x: rect.left + (rect.width / 2), 
        y: rect.bottom + 5 // +5px jarak dari bawah item
    };
};

const onItemMouseLeave = () => {
    hoveredItem.value = null;
};
// ------------------------------------------------

const { activeProjectId } = useEditorState();
const { folders, CDN_URL } = useBackend(); 

const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp3', '.wav', '.ogg', '.js', '.ts', '.json', '.ttf'];
const ACCEPT_ATTR = ALLOWED_EXTS.join(',');

const detectAssetType = (asset) => {
  if (asset.isFolder) return 'folder';
  if (['texture', 'sprite', 'image'].includes(asset.type)) return 'image';
  if (['audio', 'sound'].includes(asset.type)) return 'audio';
  if (['script', 'json'].includes(asset.type)) return 'script';
  if (asset.type === 'font') return 'font';

  if (asset.meta && asset.meta.extension) {
      const ext = asset.meta.extension.replace('.', '').toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
      if (['js', 'ts', 'json'].includes(ext)) return 'script';
  }

  const name = asset.name || "";
  if (name.includes('.')) {
      const ext = name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
  }

  return 'file';
};

const getThumbnailUrl = (item) => {
    if (item.localBlob) {
        return URL.createObjectURL(item.localBlob);
    }

    if (detectAssetType(item) !== 'image') return null;

    const baseUrl = CDN_URL ? CDN_URL.replace(/\/$/, "") : "";
    const pId = item.projectId || activeProjectId.value;
    const key = item.fileKey; 
    const ext = item.meta?.extension || '.png';

    if (!baseUrl || !pId || !key) return null;

    return `${baseUrl}/projects/${pId}/${key}${ext}`;
};


const breadcrumbs = computed(() => {
  const paths = [{ id: null, name: 'Assets' }];
  if (currentFolderId.value) {
    const folder = folders.value.find(f => f._id === currentFolderId.value);
    if (folder) paths.push({ id: folder._id, name: folder.name });
  }
  return paths;
});

const combinedItems = computed(() => {
  let displayedFolders = [];
  let displayedAssets = [];

  if (currentFolderId.value === null) {
    displayedFolders = folders.value.map(f => ({ ...f, isFolder: true, itemType: 'folder' }));
    displayedAssets = localAssets.value.filter(a => !a.folderId);
  } else {
    displayedAssets = localAssets.value.filter(a => a.folderId === currentFolderId.value);
  }

  const mappedAssets = displayedAssets.map(a => ({
      ...a,
      isFolder: false,
      itemType: detectAssetType(a)
  }));

  const ghostItems = uploadQueue.value.map(file => ({
      _id: 'ghost_' + file.name,
      name: file.name,
      itemType: 'image',
      isGhost: true, 
      folderId: currentFolderId.value
  }));

  let all = [...displayedFolders, ...mappedAssets, ...ghostItems];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    all = all.filter(item => item.name.toLowerCase().includes(q));
  }
  return all;
});

const navigateTo = (folderId) => { currentFolderId.value = folderId; contextMenu.value.visible = false; };
const toggleViewMode = () => { viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'; };

const handleItemClick = (item) => {
  if (item.isGhost) return;
  if (item.itemType === 'folder') currentFolderId.value = item._id;
};

const refreshAssets = async () => { 
    if (activeProjectId.value) {
        localAssets.value = await getLocalAssetsByProject(activeProjectId.value);
    }
};

const triggerFileInput = () => fileInput.value.click();

const processFiles = async (files) => {
    const validFiles = files.filter(f => ALLOWED_EXTS.includes('.' + f.name.split('.').pop().toLowerCase()));
    if (validFiles.length === 0) return;

    uploadQueue.value = [...uploadQueue.value, ...validFiles];

    for (const file of validFiles) {
        await new Promise(r => setTimeout(r, 600)); 
        const newAsset = await addLocalAsset(file, activeProjectId.value, currentFolderId.value);
        bus.emit("engine:load_asset", newAsset);
    }

    uploadQueue.value = [];
    await refreshAssets();
};

const handleFileSelect = (e) => { processFiles(Array.from(e.target.files)); e.target.value = ''; };
const onDrop = (e) => { e.preventDefault(); processFiles(Array.from(e.dataTransfer.files)); };
const onDragOver = (e) => e.preventDefault();

const handleContextMenu = (e, item) => {
    e.preventDefault();
    contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, item };
};
const closeCtx = () => contextMenu.value.visible = false;

const handleMenuAction = async (action) => {
    const item = contextMenu.value.item;
    closeCtx();
    if (!item && action !== 'paste') return;

    if (action === 'delete') {
        if (confirm(`Hapus ${item.name}?`)) {
            await deleteLocalAsset(item._id);
            await refreshAssets();
        }
    } else if (action === 'rename') {
        const newName = prompt("Nama baru:", item.name);
        if (newName) {
            await renameLocalAsset(item._id, newName);
            await refreshAssets();
        }
    } else if (action === 'copy') {
        clipboard.value = item;
    } else if (action === 'paste') {
        alert("Fitur paste belum tersedia.");
    } else if (action === 'move') {
        alert("Fitur move belum tersedia.");
    }
};

onMounted(async () => { 
    if (activeProjectId.value) await refreshAssets(); 
    document.addEventListener('click', closeCtx);
});
watch(activeProjectId, async (newId) => { if (newId) await refreshAssets(); }); 
</script>

<template>
  <div 
    class="h-full flex flex-col bg-background text-foreground font-sans text-sm select-none relative"
    @dragover="onDragOver"
    @drop="onDrop"
    @contextmenu.stop="handleContextMenu($event, null)"
  >
    <input type="file" ref="fileInput" multiple :accept="ACCEPT_ATTR" class="hidden" @change="handleFileSelect" />
    
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background h-10 min-h-[40px]">
      <button @click="toggleViewMode" class="p-1.5 mr-2 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <svg v-if="viewMode === 'grid'" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v4H4zm0 6h16v4H4zm0 6h16v4H4z"/></svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
      </button>

      <div class="w-px h-4 bg-border mr-2 shrink-0"></div>

      <div class="flex items-center text-xs font-medium whitespace-nowrap overflow-x-auto no-scrollbar">
        <div v-for="(crumb, index) in breadcrumbs" :key="crumb.id || 'root'" class="flex items-center">
          <svg v-if="index > 0" class="w-3 h-3 mx-1 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          <span @click="navigateTo(crumb.id)" class="cursor-pointer px-1.5 py-0.5 rounded transition-colors" :class="[index === breadcrumbs.length - 1 ? 'text-foreground font-bold bg-secondary/50 cursor-default' : 'text-muted-foreground hover:text-foreground hover:bg-secondary']">{{ crumb.name }}</span>
        </div>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-2">
         <input v-model="searchQuery" type="text" placeholder="Search..." class="w-24 focus:w-40 text-xs rounded-md pl-2 pr-2 py-1 outline-none bg-background border border-border">
         <button @click="refreshAssets" class="p-1.5 hover:bg-secondary rounded text-muted-foreground"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 bg-background/50 relative">
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
        
        <button @click.stop="triggerFileInput" class="flex flex-col items-center justify-center gap-2 p-2 rounded-md border-2 border-dashed border-border/60 hover:bg-primary/5 h-[84px] group">
          <div class="w-8 h-8 rounded-full bg-secondary/50 group-hover:bg-primary/20 flex items-center justify-center transition-colors"><svg class="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg></div>
          <span class="text-[10px] text-muted-foreground group-hover:text-primary">Add New</span>
        </button>

        <div v-for="item in combinedItems" :key="item._id || item.id" 
             class="group flex flex-col items-center gap-2 p-2 rounded-md cursor-pointer border border-transparent relative overflow-hidden"
             :class="[item.isGhost ? 'opacity-80 pointer-events-none' : 'hover:bg-secondary/50 hover:border-border active:scale-95 transition-all']"
             @click.stop="!item.isGhost && handleItemClick(item)"
             @dblclick.stop="!item.isGhost && handleAssetDoubleClick(item)"
             @contextmenu.stop="!item.isGhost && handleContextMenu($event, item)"
             @mouseenter="onItemMouseEnter($event, item)"
             @mouseleave="onItemMouseLeave"
        >
          
          <div v-if="item.isGhost" class="absolute inset-0 z-20 striped-loading rounded-md bg-black/10"></div>
          
          <div class="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden rounded-sm relative">
            
            <svg v-if="item.itemType === 'folder'" class="w-full h-full text-orange-400/90" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>

            <div 
                 v-else-if="item.itemType === 'image'" 
                 class="w-full h-full bg-gray-800 flex items-center justify-center bg-checkerboard"
            >
                 <img 
                    v-if="getThumbnailUrl(item)"
                    :src="getThumbnailUrl(item)" 
                    class="max-w-full max-h-full object-contain"
                    style="image-rendering: pixelated;"
                    alt="thumb"
                 />
                 <svg v-else class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>

            <svg v-else-if="item.itemType === 'audio'" class="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            <svg v-else class="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>

          <span class="text-[11px] text-center text-muted-foreground font-medium truncate w-full group-hover:text-foreground">
             {{ item.name }}
          </span>
        </div>
      </div>

      <div v-else class="flex flex-col gap-1">
        <button @click="triggerFileInput" class="flex items-center gap-3 p-1.5 rounded-sm border border-dashed border-border/60 hover:bg-primary/5 cursor-pointer text-left"><span class="text-xs text-muted-foreground">Create New...</span></button>
        
        <div v-for="item in combinedItems" :key="item._id || item.id" 
             class="flex items-center gap-2 p-1.5 rounded-sm hover:bg-secondary cursor-pointer group" 
             :class="{'opacity-70': item.isGhost}"
             @click.stop="!item.isGhost && handleItemClick(item)"
             @dblclick.stop="!item.isGhost && handleAssetDoubleClick(item)"
             @contextmenu.stop="!item.isGhost && handleContextMenu($event, item)">
            <div class="w-4 h-4 shrink-0 flex items-center justify-center">
                 <svg v-if="item.itemType === 'folder'" class="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                 <img v-else-if="item.itemType === 'image' && getThumbnailUrl(item)" :src="getThumbnailUrl(item)" class="w-4 h-4 object-contain bg-gray-700" />
                 <svg v-else class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span class="text-xs text-muted-foreground group-hover:text-foreground truncate" :title="item.name">{{ item.name }}</span>
        </div>
      </div>

      <div v-if="!localAssets.length && combinedItems.length === 0" class="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50"><span class="text-xs">No assets found</span></div>
    </div>

  <Teleport to="body">
      <div 
          v-if="contextMenu.visible" 
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" 
          class="fixed z-[1900] min-w-[140px] bg-popover border border-border rounded-md shadow-lg py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100"
      >
          <template v-if="contextMenu.item">
              <button @click="handleMenuAction('copy')" class="px-3 py-1.5 text-xs text-left hover:bg-secondary flex items-center gap-2 text-foreground">Copy</button>
              <button @click="handleMenuAction('rename')" class="px-3 py-1.5 text-xs text-left hover:bg-secondary flex items-center gap-2 text-foreground">Rename</button>
              <button @click="handleMenuAction('move')" class="px-3 py-1.5 text-xs text-left hover:bg-secondary flex items-center gap-2 text-foreground">Move to...</button>
              <div class="h-px bg-border my-1"></div>
              <button @click="handleMenuAction('delete')" class="px-3 py-1.5 text-xs text-left hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 flex items-center gap-2">Delete</button>
          </template>
          <template v-else>
              <button @click="triggerFileInput" class="px-3 py-1.5 text-xs text-left hover:bg-secondary flex items-center gap-2 text-foreground">Import Asset...</button>
              <button @click="handleMenuAction('paste')" :disabled="!clipboard" class="px-3 py-1.5 text-xs text-left hover:bg-secondary disabled:opacity-50 text-foreground">Paste</button>
          </template>
      </div>
  </Teleport>

    <Teleport to="body">
      <div 
        v-if="hoveredItem && viewMode === 'grid'"
        class="fixed z-[900] bg-popover text-foreground border border-border shadow-lg shadow-black/20 rounded px-2 py-1.5 text-[11px] max-w-[200px] break-words pointer-events-none font-medium leading-tight animate-in fade-in zoom-in-95 duration-75"
        :style="{ 
            top: `${tooltipPos.y}px`, 
            left: `${tooltipPos.x}px`, 
            transform: 'translateX(-50%)' 
        }"
      >
        {{ hoveredItem.name }}
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.striped-loading {
    background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.05) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.05) 50%,
        rgba(255, 255, 255, 0.05) 75%,
        transparent 75%,
        transparent
    );
    background-size: 20px 20px;
    animation: move-stripes 1s linear infinite;
    pointer-events: none;
}

@keyframes move-stripes {
    0% { background-position: 0 0; }
    100% { background-position: 20px 20px; }
}

.bg-checkerboard {
  background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}
</style>