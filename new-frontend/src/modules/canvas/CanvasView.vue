<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useEditorStore } from "@/stores/useEditorStore.js";
import { useProjectStore } from "@/stores/useProjectStore.js"; 
import { startEngine } from "@engines/main.js"; 
import { prepareEngineData } from "@/services/engine/EngineBootstrapper.js";

// --- SYNC MODULES ---
import { EngineBridge } from "@/services/engine/EngineBridge.js";
import { useEngineSync } from "@/services/engine/useEngineSync.js";

const editorStore = useEditorStore();
const projectStore = useProjectStore(); 

// 1. Initialize Pinia -> Engine Sync
// Ini akan mulai mendengarkan semua Action di Store
const { initSync } = useEngineSync();
initSync();

const gameCanvas = ref(null);
const initError = ref(null);
let engineBus = null;
let engineInstance = null;
let isInitializing = false; 

// Handler: Engine -> Vue (Reverse Sync)
// Dipanggil ketika tools di engine (misal Gizmo) mengubah entity
const handleEntityModified = (updates) => {
    // console.log("[CanvasView] Entity Modified in Engine:", updates);
    // TODO: Di sini nanti Anda panggil action store untuk update state Vue
    // contoh: sceneStore.updateEntityFromEngine(updates);
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

        // Start Engine
        // GameLoader akan otomatis meng-init SyncComponent di dalamnya karena mode="editor"
        engineInstance = await startEngine(gameCanvas.value, "editor", enginePayload);

        if (engineInstance) {
            // 2. Set Bridge Instance
            // Agar Vue bisa mengirim perintah ke Engine (misal: create entity dari menu)
            EngineBridge.setInstance(engineInstance);
            
            // 3. Setup Listeners (Engine -> Vue)
            engineBus = engineInstance.bus;
            engineBus.on("entity:modified", handleEntityModified);

            console.log("[CanvasView] Engine initialized & Bridge connected");
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
    // Cleanup Listener
    if (engineBus) {
        engineBus.off("entity:modified", handleEntityModified);
    }
    
    // Putuskan koneksi Bridge
    EngineBridge.disconnect();

    // Hancurkan Engine
    if (engineInstance) {
        engineInstance.destroy();
        engineInstance = null;
    }
});
</script>

<template>
  <div class="w-full h-full relative overflow-hidden flex flex-col bg-slate-900 select-none">
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
  </div>
</template>