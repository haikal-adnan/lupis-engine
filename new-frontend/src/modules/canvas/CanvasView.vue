<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useEditorStore } from "@/stores/useEditorStore.js";
import { useProjectStore } from "@/stores/useProjectStore.js"; 
import { startEngine } from "@engines/main.js"; 
import { prepareEngineData } from "@/services/engine/EngineBootstrapper.js";

const editorStore = useEditorStore();
const projectStore = useProjectStore(); 

const gameCanvas = ref(null);
const initError = ref(null);
let engineBus = null;
let engineInstance = null;
let isInitializing = false; 

const handleEntityModified = (updates) => {
    // console.log("Entity Modified:", updates);
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
        const baseUrl = editorStore.assetBaseUrl;

        if (!gameCanvas.value) throw new Error("Canvas DOM Missing");

        engineInstance = await startEngine(gameCanvas.value, "editor", enginePayload);

        if (engineInstance) {
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
    if (engineBus) engineBus.off("entity:modified", handleEntityModified);
    if (engineInstance) engineInstance.destroy();
});
</script>

<template>
  <div class="w-full h-full relative overflow-hidden flex flex-col bg-slate-900 select-none">
    <div v-if="initError" class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-red-500 pointer-events-none">
        <p class="font-bold bg-black px-4 py-2 rounded border border-red-900">
            Error: {{ initError }}
        </p>
    </div>
    <canvas ref="gameCanvas" class="absolute inset-0 w-full h-full block outline-none"></canvas>
  </div>
</template>