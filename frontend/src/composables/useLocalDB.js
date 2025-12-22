import { ref } from "vue";
import { db } from "@/db/index.js";
import { initLocalDB as serviceInit } from "@/services/initService.js";
import { updateSceneEntities } from "@/services/sceneService.js";

export function useLocalDB() {
    const isReady = ref(false);

    const initDB = async () => {
        try {
            await db.open();
            isReady.value = true;
            return true;
        } catch (e) {
            console.error("Dexie open failed:", e);
            return false;
        }
    };

    const hydrateFromBackend = async (serverData) => {
        await serviceInit(serverData);
    };

    const saveEntitiesToLocal = async (sceneId, entities) => {
        await updateSceneEntities(sceneId, entities);
    };

    const getSceneFromLocal = async (sceneId) => {
        if (!sceneId) return null;
        try {
            return await db.scenes.get(sceneId);
        } catch (e) {
            console.error("Failed to get local scene:", e);
            return null;
        }
    };

    return {
        isReady,
        initDB,
        hydrateFromBackend,
        saveEntitiesToLocal,
        getSceneFromLocal
    };
}