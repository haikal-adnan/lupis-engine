<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useEditorStore } from "@/stores/useEditorStore.js";
import { useProjectStore } from "@/stores/useProjectStore.js"; 
import { useSceneStore } from "@/stores/scene/useSceneStore.js";
import { startEngine } from "@engines/main.js"; 
import { prepareEngineData } from "@/services/engine/EngineBootstrapper.js";

import { EngineBridge } from "@/services/engine/EngineBridge.js";
import { useEngineSync } from "@/services/engine/useEngineSync.js";

import BaseContextMenu from '@ui/overlay/BaseContextMenu.vue';
import { useCanvasLogic } from '@/modules/canvas/composables/useCanvasLogic.js';
import { useCanvasMenu } from '@/modules/canvas/composables/useCanvasMenu.js';

const editorStore = useEditorStore();
const projectStore = useProjectStore(); 
const sceneStore = useSceneStore();

const { initSync } = useEngineSync();
initSync();

const gameCanvas = ref(null);
const initError = ref(null);
let engineBus = null;
let engineInstance = null;
let isInitializing = false; 

const canvasLogic = useCanvasLogic();
const { contextMenu, openMenu, closeMenu } = useCanvasMenu(canvasLogic);

const handleEntityModified = (updates) => {
};

const initializeCanvas = async () => {
    if (isInitializing || engineInstance) return;
    
    isInitializing = true;
    await nextTick();

    if (!editorStore.activeProjectId) {
        const devId = import.meta.env.VITE_DEV_PROJECT_ID;
        if (devId) editorStore.setProjectId(devId);
        else {
            initError.value = "Project ID Missing";
            isInitializing = false;
            return;
        }
    }

    try {
        const enginePayload = await prepareEngineData();

        if (!gameCanvas.value) throw new Error("Canvas DOM Missing");

        engineInstance = await startEngine(gameCanvas.value, "editor", enginePayload);

        if (engineInstance) {
            EngineBridge.setInstance(engineInstance);
            
            engineBus = engineInstance.bus;
            engineBus.on("entity:modified", handleEntityModified);
        }

    } catch (err) {
        console.error("Engine Init Failed:", err);
        initError.value = err.message;
    } finally {
        isInitializing = false;
    }
};

const getWorldPosition = (pointerX, pointerY) => {
    if (!gameCanvas.value || !engineInstance) return { x: 0, y: 0 };
    
    const camPos = EngineBridge.getCameraPosition ? EngineBridge.getCameraPosition() : { x: 0, y: 0 };
    
    const scale = engineInstance.camera ? (engineInstance.camera.scale || 1) : 1;

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
    if (!engineInstance) return;

    const gamePointer = engineInstance.game.input.getPointer();
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
        if (!loading && !engineInstance) {
            await initializeCanvas();
        }
    }
);

onUnmounted(() => {
    if (engineBus) {
        engineBus.off("entity:modified", handleEntityModified);
    }
    EngineBridge.disconnect();
    if (engineInstance) {
        engineInstance.destroy();
        engineInstance = null;
    }
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