<script setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore } from '@scenes/scenes.js';
import { startEngine } from "@core/RuntimeEditor.js"; 
import { useTheme } from '@composables/composables.js';
import { useSceneHistory, useTilemapHistory } from '@historys/historys.js';

import { engineBridge, useEngineSync, prepareEngineData, useEngineToEditor } from "@engines/engines.js";
import { BaseContextMenu } from "@components/components.js";
import { useCanvasLogic, useCanvasMenu } from '@viewports/viewports.js';

const workspaceStore = useWorkspaceStore();
const sceneStore = useSceneStore();

const { listen: listenEngineToEditor } = useEngineToEditor(sceneStore);
const { recordTransformChange } = useSceneHistory();
const { startStrokeTransaction, endStrokeTransaction, recordTilemapPropChange } = useTilemapHistory();
const { initSync } = useEngineSync();
initSync();

const { isDark } = useTheme();
const gameCanvas = ref(null);
const initError = ref(null);
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

const initializeCanvas = async () => {
    if (isInitializing || workspaceStore.isEngineReady) return;

    isInitializing = true;
    await nextTick();

    if (!gameCanvas.value) {
        console.warn("[CanvasView] Canvas DOM ref belum siap, menunda inisialisasi.");
        isInitializing = false;
        return;
    }

    if (workspaceStore.engine) {
        workspaceStore.engine.destroy();
        workspaceStore.setEngine(null);
    }

    const currentProjectId = workspaceStore.activeProjectId;

    if (!currentProjectId) {
        initError.value = "Project ID is not initialized in Store.";
        isInitializing = false;
        return;
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
        initError.value = err.message;
    } finally {
        isInitializing = false;
    }
};

watch(isDark, (newVal) => {
    if (workspaceStore.isEngineReady) {
        engineBridge.updateTheme(newVal);
    }
});

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
        engine.game.destroy(); 
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