<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useEditorStore } from "@/stores/useEditorStore.js";
import { useProjectStore } from "@/stores/useProjectStore.js"; 
import { useSceneStore } from "@/stores/scene/useSceneStore.js";
import { startEngine } from "@engines/main.js"; 
import { prepareEngineData } from "@/services/engine/EngineBootstrapper.js";
import { CDN_URL } from "@/services/api/useFetchProjectById.js";
import { useTheme } from "@commons/composables/useTheme.js";

import { EngineBridge } from "@/services/engine/EngineBridge.js";
import { useEngineSync } from "@/services/engine/useEngineSync.js";

import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue';
import { useCanvasLogic } from '@editors/canvas/composables/useCanvasLogic.js';
import { useCanvasMenu } from '@editors/canvas/composables/useCanvasMenu.js';

const editorStore = useEditorStore();
const projectStore = useProjectStore(); 
const sceneStore = useSceneStore();

const { initSync } = useEngineSync();
initSync();

const { isDark, initTheme } = useTheme();
const gameCanvas = ref(null);
const initError = ref(null);
let isInitializing = false; 

const canvasLogic = useCanvasLogic();
const { contextMenu, openMenu, closeMenu } = useCanvasMenu(canvasLogic);

const handleEntityModified = (updates) => {
};

const initializeCanvas = async () => {
    if (isInitializing || editorStore.isEngineReady) return;
    
    isInitializing = true;
    await nextTick();

    if (editorStore.engine) {
        editorStore.engine.destroy();
        editorStore.setEngine(null);
    }

    const currentProjectId = editorStore.activeProjectId;

    if (!currentProjectId) {
        initError.value = "Project ID belum diinisialisasi di Store.";
        isInitializing = false;
        return;
    }

    try {
        const enginePayload = await prepareEngineData();
        if (!gameCanvas.value) throw new Error("Canvas DOM Missing");

        const cleanCdnUrl = CDN_URL.replace(/\/$/, ""); 
        const fullBaseUrl = `${cleanCdnUrl}/projects/${currentProjectId}/`;

        const instance = await startEngine(gameCanvas.value, fullBaseUrl, "editor", enginePayload);

        if (instance) {
            editorStore.setEngine(instance);
            
            EngineBridge.setupListeners();
            editorStore.engine.bus.on("entity:modified", handleEntityModified);

            EngineBridge.updateTheme(isDark.value);
        }

    } catch (err) {
        console.error("Engine Init Failed:", err);
        initError.value = err.message;
    } finally {
        isInitializing = false;
    }
};

watch(isDark, (newVal) => {
    if (editorStore.isEngineReady) {
        EngineBridge.updateTheme(newVal);
    }
});

const getWorldPosition = (pointerX, pointerY) => {
    const engine = editorStore.engine;
    if (!gameCanvas.value || !engine) return { x: 0, y: 0 };
    
    const camPos = EngineBridge.getCameraPosition ? EngineBridge.getCameraPosition() : { x: 0, y: 0 };
    const scale = engine.camera ? (engine.camera.scale || 1) : 1;

    const rect = gameCanvas.value.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const offsetScreenX = pointerX - centerX;
    const offsetScreenY = pointerY - centerY;

    const worldX = camPos.x + (offsetScreenX / scale);
    const worldY = camPos.y + (offsetScreenY / scale);

    return { x: Math.round(worldX), y: Math.round(worldY) };
};

const handleContextMenu = (e) => {
    const engine = editorStore.engine;
    if (!engine) return;

    if (editorStore.activeTab && editorStore.activeTab.type === 'tilemap') {
        return;
    }

    const gamePointer = engine.game.input.getPointer();
    const pointerX = gamePointer.x;
    const pointerY = gamePointer.y;

    const { x: worldX, y: worldY } = getWorldPosition(pointerX, pointerY);

    const screenX = e.clientX;
    const screenY = e.clientY;

    const selectedIds = sceneStore.selectedEntityIds;
    const isEntitySelected = selectedIds && selectedIds.length > 0;

    openMenu(screenX, screenY, worldX, worldY, isEntitySelected);
};

onMounted(async () => {
    if (!projectStore.isLoading) {
        await initializeCanvas();
    }
});

watch(
    () => projectStore.isLoading,
    async (loading) => {
        if (!loading && !editorStore.isEngineReady) {
            await initializeCanvas();
        }
    }
);

onUnmounted(() => {
    const engine = editorStore.engine;
    
    if (engine) {
        engine.bus.off("entity:modified", handleEntityModified);

        console.log(engine)
        
        engine.game.destroy(); 
        
        editorStore.setEngine(null);
    }
    
    EngineBridge.disconnect();
});


</script>

<template>
  <div 
    class="w-full h-full relative overflow-hidden flex flex-col bg-slate-900 select-none"
    @contextmenu.prevent="handleContextMenu"
    @click="closeMenu"
  >
    <div v-if="initError" class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-red-500 pointer-events-none">
        <p class="font-bold bg-black px-4 py-2 rounded border border-red-900">
            Error: {{ initError }}
        </p>
    </div>

    <canvas 
        ref="gameCanvas" 
        class="absolute inset-0 w-full h-full block outline-none"
        tabindex="0"
    ></canvas>

    <BaseContextMenu 
      v-if="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :items="contextMenu.items"
      @close="closeMenu"
    />
  </div>
</template>