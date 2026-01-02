<script setup>
import { computed, watch, ref, reactive, nextTick } from "vue";
import { useInspectorLogic } from "@/composables/useInspectorLogic.js";
import { useBackend } from "@/composables/useBackend.js";
import { useEditorState } from "@/composables/useEditorState.js";
import { useEditorLayout } from "@/composables/useEditorLayout.js";
import TextureUtil from "@engine/Util/TextureUtil.js";
import { useAssetActions } from "@/composables/useAssetActions.js"; 

import BaseInput from "@/components/ui/BaseInput.vue";
import InspectorSection from '@/components/ui/InspectorSection.vue';
import PropertyRow from '@/components/ui/PropertyRow.vue';
import IconButton from '@/components/ui/IconButton.vue';

const { selectedEntity, removeComponent, bindNestedProp, bindComponentProp } = useInspectorLogic();
const { assets, CDN_URL } = useBackend();
const { activeProjectId } = useEditorState();
const { isLeftCollapsed, isRightCollapsed } = useEditorLayout();
const { autoResetRect } = useAssetActions(); 

const componentData = computed(() => selectedEntity.value?.components?.SpriteRenderer);
const boundAssetId = bindComponentProp('SpriteRenderer', 'assetId');

const sourceRaw = {
    x: bindNestedProp('SpriteRenderer', 'source', 'x'),
    y: bindNestedProp('SpriteRenderer', 'source', 'y'),
    w: bindNestedProp('SpriteRenderer', 'source', 'w'),
    h: bindNestedProp('SpriteRenderer', 'source', 'h'),
};

const isAdvancedOpen = ref(false);

const assetDisplayName = computed(() => {
    if (!boundAssetId.value) return "None (Sprite)";
    if (!assets.value) return "Loading...";
    const asset = assets.value.find(a => a._id === boundAssetId.value);
    return asset ? asset.name : "Unknown Asset"; // Atau tampilkan ID jika nama tidak ketemu
});

// --- Logic URL & Preview Thumbnail (Sama seperti sebelumnya) ---
const currentAssetUrl = computed(() => {
    if (!boundAssetId.value || !assets.value) return null;
    const asset = assets.value.find(a => a._id === boundAssetId.value);
    if (!asset) return null;

    if (asset.fileUrl && asset.fileUrl.startsWith('blob:')) return asset.fileUrl;
    if (asset.localBlob) return URL.createObjectURL(asset.localBlob);

    const baseUrl = CDN_URL ? CDN_URL.replace(/\/$/, "") : "";
    const pId = asset.projectId || activeProjectId.value;
    const key = asset.fileKey;
    const ext = asset.meta?.extension || '.png';

    if (!baseUrl || !pId || !key) return null;
    return `${baseUrl}/projects/${pId}/${key}${ext}`;
});

const showPopup = ref(false);
const triggerRef = ref(null);
const popupRef = ref(null);
const imgMeta = reactive({ w: 0, h: 0 });
const isPositioned = ref(false); 
const popupPosition = reactive({ top: '80vh', left: 0 });

watch(currentAssetUrl, async (url) => {
    if (!url) { imgMeta.w = 0; imgMeta.h = 0; return; }
    const size = await TextureUtil.fetchImageSize(url);
    imgMeta.w = size.width; imgMeta.h = size.height;
}, { immediate: true });

const thumbnailStyle = computed(() => {
    if (!currentAssetUrl.value || imgMeta.w === 0) return {};
    return TextureUtil.getThumbnailStyle(
        currentAssetUrl.value, 
        { x: sourceRaw.x.value, y: sourceRaw.y.value, w: sourceRaw.w.value, h: sourceRaw.h.value }, 
        { width: imgMeta.w, height: imgMeta.h }, 
        48
    );
});

const updatePopupPosition = () => {
    if (!triggerRef.value) return;
    const rect = triggerRef.value.getBoundingClientRect();
    popupPosition.top = '80vh'; 
    popupPosition.left = rect.left - 192 - 12; 
    isPositioned.value = true;
};

const togglePopup = async () => {
    if (!showPopup.value) {
        isPositioned.value = false; 
        showPopup.value = true;     
        await nextTick();           
        updatePopupPosition();      
    } else {
        showPopup.value = false;
    }
};

const handleClickOutside = (e) => {
    if (showPopup.value && popupRef.value && !popupRef.value.contains(e.target) && !triggerRef.value.contains(e.target)) {
        showPopup.value = false;
    }
};

watch([isLeftCollapsed, isRightCollapsed], () => {
    if (showPopup.value) showPopup.value = false;
});

watch(showPopup, (val) => {
    if (val) {
        window.addEventListener('resize', updatePopupPosition);
        setTimeout(() => window.addEventListener('click', handleClickOutside), 100);
    } else {
        window.removeEventListener('resize', updatePopupPosition);
        window.removeEventListener('click', handleClickOutside);
    }
});

// --- NEW HANDLERS FOR ASSET PICKER ---

const openAssetPicker = () => {
    console.log("TODO: Open Modal Asset Picker here");
    // Nanti Anda panggil emit('open-picker') atau state global untuk buka modal
};

const clearAsset = () => {
    // 1. Set assetId jadi null di Component Data
    boundAssetId.value = null; 
    
    // 2. (Opsional tapi Bagus) Reset Source Rect agar kembali default
    // Karena kalau tidak di-reset, mungkin masih ada sisa koordinat crop dari gambar sebelumnya
    if (componentData.value && componentData.value.source) {
         componentData.value.source = { x: 0, y: 0, w: 0, h: 0 };
    }
    
    // Trigger update (NotifyChange sudah dipanggil oleh setter boundAssetId)
};

const handleDropAsset = (event) => {
    // Contoh logic drop
    // const assetId = event.dataTransfer.getData("application/lupis-asset-id");
    // if(assetId) boundAssetId.value = assetId;
    console.log("Dropped asset on slot", event);
};

</script>

<template>
  <InspectorSection title="Sprite Renderer" v-if="componentData">
    <template #icon><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></template>
    <template #header-extra>
        <IconButton @click="removeComponent('SpriteRenderer')" class="hover:text-destructive">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </IconButton>
    </template>
    
    <div class="flex gap-3 mb-2 px-1">
        <div class="relative">
            <button 
                ref="triggerRef"
                class="w-12 h-12 rounded border border-gray-600 bg-gray-800 overflow-hidden relative flex items-center justify-center group hover:border-blue-500 transition-colors"
                @click="togglePopup"
            >
                <div v-if="currentAssetUrl && imgMeta.w > 0" :style="thumbnailStyle"></div>
                <span v-else class="text-[9px] text-gray-500">Empty</span>

                <div class="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center z-10">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
            </button>
            
            <Teleport to="body">
                <div 
                     v-if="showPopup && currentAssetUrl && isPositioned" 
                     ref="popupRef"
                     class="fixed z-[9999] p-2 bg-gray-900 border border-gray-700 rounded shadow-xl flex flex-col gap-2 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
                     style="transform: translateY(-50%)"
                     :style="{ top: popupPosition.top, left: `${popupPosition.left}px` }"
                >
                    <div class="text-[10px] text-gray-400 border-b border-gray-800 pb-1">
                        {{ imgMeta.w }} x {{ imgMeta.h }}
                    </div>
                    <div class="w-48 h-48 bg-gray-800 rounded border border-gray-700 flex items-center justify-center overflow-hidden">
                        <img :src="currentAssetUrl" class="max-w-full max-h-full object-contain" style="image-rendering: pixelated;" />
                    </div>
                </div>
            </Teleport>
        </div>

        <div class="flex-1 flex flex-col justify-center">
            <PropertyRow label="Texture" :no-padding="true">
                <div 
                    class="relative w-full flex items-center bg-gray-900 border border-gray-700 rounded px-2 py-1.5 cursor-pointer hover:bg-gray-800 hover:border-blue-500/50 transition-all group"
                    @click="openAssetPicker"
                    @dragover.prevent
                    @drop.prevent="handleDropAsset"
                    title="Click to change texture"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-blue-400 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>

                    <span class="text-xs text-gray-300 truncate select-none flex-grow">
                        {{ assetDisplayName }}
                    </span>

                    <button 
                        v-if="boundAssetId"
                        @click.stop="clearAsset"
                        class="absolute right-1 p-0.5 rounded-sm hover:bg-red-500/20 hover:text-red-400 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Clear Texture"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            </PropertyRow>
        </div>
    </div>

    <PropertyRow label="Source Rect" class="items-start border-t border-gray-800 pt-2 mt-1">
        <div class="grid grid-cols-2 gap-2">
            <BaseInput v-model="sourceRaw.x.value" prefix="X" type="number" :scrubbable="true" />
            <BaseInput v-model="sourceRaw.y.value" prefix="Y" type="number" :scrubbable="true" />
            <BaseInput v-model="sourceRaw.w.value" prefix="W" type="number" :scrubbable="true" />
            <BaseInput v-model="sourceRaw.h.value" prefix="H" type="number" :scrubbable="true" />
        </div>
    </PropertyRow>

    <div class="mt-3 pt-2 border-t border-gray-800/50">
      <button @click="isAdvancedOpen = !isAdvancedOpen" class="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 w-full select-none">
        <svg class="w-3 h-3 transition-transform duration-200" :class="{ 'rotate-90': isAdvancedOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
        Advanced Settings
      </button>

      <div v-show="isAdvancedOpen" class="mt-2 pl-2">
        <label class="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" v-model="autoResetRect" />
          <span class="text-[10px] text-gray-400">Reset Rect on Texture Change</span>
        </label>
      </div>
    </div>
  </InspectorSection>
</template>