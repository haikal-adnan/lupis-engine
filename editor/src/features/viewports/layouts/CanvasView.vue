<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { useSceneStore } from '@scenes/scenes.js';
import { startEngine } from "@core/RuntimeEditor.js"; 
import { useTheme } from '@composables/composables.js';
import { useSceneHistory, useTilemapHistory } from '@historys/historys.js';

import { engineBridge, useEngineSync, prepareEngineData, useEngineToEditor } from "@engines/engines.js";
import { BaseContextMenu } from "@components/components.js";
import { useCanvasLogic, useCanvasMenu } from '@viewports/viewports.js';

const workspaceStore = useWorkspaceStore();
const projectStore = useProjectStore();
const sceneStore = useSceneStore();

const { listen: listenEngineToEditor } = useEngineToEditor(sceneStore);
const { recordTransformChange } = useSceneHistory();
const { startStrokeTransaction, endStrokeTransaction, recordTilemapPropChange } = useTilemapHistory();
const { initSync } = useEngineSync();
initSync();

const { isDark } = useTheme();
const gameCanvas = ref(null);
const initError = ref(null);
const isRestarting = ref(false);
let isInitializing = false; 

const canvasLogic = useCanvasLogic();
const { contextMenu, openMenu, closeMenu } = useCanvasMenu(canvasLogic);

const initialEntitySnapshots = new Map();
const initialTilemapSnapshots = new Map();
let isPointerDown = false;
let isDraggingEntity = false;

const deepClone = (data) => data ? JSON.parse(JSON.stringify(data)) : null;

const handlePointerDown = (e) => {
    isPointerDown = true;
    initialEntitySnapshots.clear();
    initialTilemapSnapshots.clear();

    const activeTab = workspaceStore.activeTab;
    let targetEntity = null;

    if (activeTab && activeTab.type === 'tilemap' && activeTab.id) {
        targetEntity = sceneStore.activeEntities.find(ent => String(ent.id) === String(activeTab.id));
    }

    if (!targetEntity && sceneStore.selectedEntityIds.length > 0) {
        targetEntity = sceneStore.activeEntities.find(ent => String(ent.id) === String(sceneStore.selectedEntityIds[0]));
    }

    if (targetEntity && targetEntity.components?.Tilemap) {
        startStrokeTransaction(targetEntity.id, targetEntity.components.Tilemap.data || []);
    }

    const selectedIds = sceneStore.selectedEntityIds || [];
    selectedIds.forEach(id => {
        const entity = sceneStore.activeEntities.find(e => String(e.id) === String(id));
        if (entity && entity.components) {
            initialEntitySnapshots.set(String(id), {
                components: deepClone(entity.components),
                visible: entity.visible,
                active: entity.active,
                _editor: deepClone(entity._editor || {})
            });

            if (entity.components.Tilemap) {
                initialTilemapSnapshots.set(String(id), deepClone(entity.components.Tilemap.data || []));
            }
        }
    });
};

const handleEntityModified = (entities) => {
    if (workspaceStore.engine?.syncComponent?.isInternalUpdate) return;

    const list = Array.isArray(entities) ? entities : [entities];

    list.forEach(engEnt => {
        const id = String(engEnt.id);
        const currentEntity = sceneStore.activeEntities.find(e => String(e.id) === id);
        if (!currentEntity) return;

        if (!initialEntitySnapshots.has(id) && currentEntity.components) {
            initialEntitySnapshots.set(id, {
                components: deepClone(currentEntity.components),
                visible: currentEntity.visible,
                active: currentEntity.active,
                _editor: deepClone(currentEntity._editor || {})
            });

            if (currentEntity.components.Tilemap) {
                initialTilemapSnapshots.set(id, deepClone(currentEntity.components.Tilemap.data || []));
            }
        }

        const comps = engEnt.components;
        if (!comps) return;

        const t = comps.Transform || comps.UITransform;
        const compName = comps.UITransform ? 'UITransform' : 'Transform';

        if (t) {
            const payload = {
                x: t.x, 
                y: t.y,
                width: t.width,    
                height: t.height, 
                rotation: t.rotation,
                scaleX: t.scaleX, 
                scaleY: t.scaleY,
                pivotX: t.pivotX, 
                pivotY: t.pivotY,
                flipX: t.flipX ?? false,
                flipY: t.flipY ?? false,
                isRatioLocked: t.isRatioLocked ?? false,
                overridden: t.overridden ?? false
            };

            if (t.anchorX !== undefined) payload.anchorX = t.anchorX;
            if (t.anchorY !== undefined) payload.anchorY = t.anchorY;

            sceneStore.syncTransformFromEngine(id, payload);

            if (t.overridden) {
                sceneStore.updateComponentProp(id, compName, 'overridden', true);
            }
        }

        if (comps.Tilemap && comps.Tilemap.data) {
            sceneStore.updateComponentProp(id, 'Tilemap', 'data', comps.Tilemap.data);
        }

        if (comps.ShapeRenderer) {
            if (comps.ShapeRenderer.elements !== undefined) {
                sceneStore.updateComponentProp(id, 'ShapeRenderer', 'elements', comps.ShapeRenderer.elements);
            }
        }

        if (comps.TextRenderer && comps.TextRenderer.fontSize !== undefined) {
            if (currentEntity.components?.TextRenderer?.fontSize !== comps.TextRenderer.fontSize) {
                sceneStore.updateComponentData(id, 'TextRenderer', { fontSize: comps.TextRenderer.fontSize });
            }
        }
    });

    if (isPointerDown) {
        isDraggingEntity = true;
    }
};

const handlePointerUp = () => {
    endStrokeTransaction('Paint Tilemap on Canvas');

    if (initialEntitySnapshots.size > 0) {
        const records = [];

        initialEntitySnapshots.forEach((oldSnapshot, id) => {
            const currentEntity = sceneStore.activeEntities.find(e => String(e.id) === String(id));
            if (!currentEntity || !currentEntity.components) return;

            const newSnapshot = {
                components: deepClone(currentEntity.components),
                visible: currentEntity.visible,
                active: currentEntity.active,
                _editor: deepClone(currentEntity._editor || {})
            };

            if (JSON.stringify(oldSnapshot) !== JSON.stringify(newSnapshot)) {
                records.push({ id, oldSnapshot, newSnapshot });
            }
        });

        if (records.length > 0) {
            recordTransformChange(records);
        }
    }

    if (initialTilemapSnapshots.size > 0) {
        initialTilemapSnapshots.forEach((oldTileData, id) => {
            const currentEntity = sceneStore.activeEntities.find(e => String(e.id) === String(id));
            const newTileData = currentEntity?.components?.Tilemap?.data;

            if (newTileData && JSON.stringify(oldTileData) !== JSON.stringify(newTileData)) {
                recordTilemapPropChange(id, 'data', oldTileData, newTileData);
            }
        });
    }

    isPointerDown = false;
    isDraggingEntity = false;
    initialEntitySnapshots.clear();
    initialTilemapSnapshots.clear();
};

const handleWindowBlur = () => {
    if (isPointerDown || isDraggingEntity) {
        handlePointerUp();
    }
};

// Canvas / Engine initialization function
const initializeCanvas = async () => {
    if (isInitializing || workspaceStore.isEngineReady) return;

    initError.value = null;
    isInitializing = true;
    await nextTick();

    if (!gameCanvas.value) {
        console.warn("[CanvasView] Canvas DOM ref not ready, postponing initialization.");
        isInitializing = false;
        return;
    }

    // Ensure Project ID is retrieved from store / localStorage
    let currentProjectId = workspaceStore.activeProjectId;

    if (!currentProjectId) {
        initError.value = "Project ID is not initialized in Store.";
        isInitializing = false;
        return;
    }

    // Apabila instans engine lama masih menggantung, bersihkan dulu
    if (workspaceStore.engine) {
        try {
            workspaceStore.engine.destroy?.();
        } catch (e) {
            console.warn("Destroy engine error:", e);
        }
        workspaceStore.setEngine(null);
    }

    try {
        const enginePayload = await prepareEngineData();
        if (!gameCanvas.value) throw new Error("Canvas DOM Missing");

        const opfsContext = { projectId: currentProjectId };
        const instance = await startEngine(gameCanvas.value, opfsContext, "editor", enginePayload);

        if (instance) {
            workspaceStore.setEngine(instance);
            engineBridge.setupListeners();
            listenEngineToEditor();
            
            workspaceStore.engine.bus.on("entity:modified", handleEntityModified);
            engineBridge.updateTheme(isDark.value);
        }

    } catch (err) {
        console.error("Engine Init Failed:", err);
        initError.value = err.message || "Failed to start Engine.";
    } finally {
        isInitializing = false;
    }
};

// Handler untuk Restart Engine secara manual via Tombol
const restartEngine = async () => {
    isRestarting.value = true;
    initError.value = null;

    try {
        // Jika project store tersedia, muat ulang scene dari OPFS untuk merefresh data
        if (projectStore.project?.id) {
            await projectStore.syncFromServer();
        } else {
            if (workspaceStore.engine) {
                try {
                    workspaceStore.engine.destroy?.();
                } catch (e) {}
                workspaceStore.setEngine(null);
            }
            await initializeCanvas();
        }
    } catch (err) {
        console.error("Failed to restart engine:", err);
        initError.value = "Restart failed: " + (err.message || "Unknown error");
    } finally {
        isRestarting.value = false;
    }
};

watch(isDark, (newVal) => {
    if (workspaceStore.isEngineReady) {
        engineBridge.updateTheme(newVal);
    }
});

watch(
    () => workspaceStore.activeProjectId,
    async (newId) => {
        if (newId && !workspaceStore.isEngineReady) {
            await nextTick();
            await initializeCanvas();
        }
    }
);

const getWorldPosition = (pointerX, pointerY) => {
    const engine = workspaceStore.engine;
    if (!gameCanvas.value || !engine) return { x: 0, y: 0 };

    const camPos = engineBridge.getCameraPosition ? engineBridge.getCameraPosition() : { x: 0, y: 0 };
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
    const engine = workspaceStore.engine;
    if (!engine) return;

    if (workspaceStore.activeTab && ['tilemap', 'shape_editor'].includes(workspaceStore.activeTab.type)) {
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
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('blur', handleWindowBlur);

    if (!workspaceStore.isLoading) {
        await initializeCanvas();
    }
});

watch(
    () => workspaceStore.isLoading,
    async (loading) => {
        if (!loading && !workspaceStore.isEngineReady) {
            await nextTick();
            await initializeCanvas();
        }
    }
);

onUnmounted(() => {
    window.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('blur', handleWindowBlur);

    const engine = workspaceStore.engine;

    if (engine) {
        engine.bus.off("entity:modified", handleEntityModified);
        try {
            engine.game.destroy(); 
        } catch (e) {}
        workspaceStore.setEngine(null);
    }

    engineBridge.disconnect();
});
</script>

<template>
  <div 
    class="w-full h-full relative overflow-hidden flex flex-col bg-slate-900 select-none"
    @contextmenu.prevent="handleContextMenu"
    @click="closeMenu"
  >
    <!-- Overlay Error & Tombol Restart Engine -->
    <div 
      v-if="initError" 
      class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-red-400 p-4 gap-4 pointer-events-auto"
    >
      <div class="flex flex-col items-center max-w-md bg-slate-900/90 border border-red-900/80 p-6 rounded-lg shadow-xl text-center">
        <svg class="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>

        <h3 class="text-lg font-bold text-white mb-1">Engine Disconnected / Failed</h3>
        <p class="text-xs text-red-300 bg-red-950/50 p-2.5 rounded border border-red-900/50 w-full break-words mb-4 font-mono">
          {{ initError }}
        </p>

        <button 
          @click="restartEngine"
          :disabled="isRestarting"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
        >
          <svg v-if="isRestarting" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ isRestarting ? 'Restarting Engine...' : 'Restart Engine' }}
        </button>
      </div>
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