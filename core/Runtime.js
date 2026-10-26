import Game from "./Core/Game.js";
import RuntimeLoader from "./Loader/RuntimeLoader.js";
import { bus } from "./Util/EventBus.js";
import LupisPackageHelper from "./Util/LupisPackageHelper.js";

async function fetchJsonWithFallback(url, fallbackValue = null) {
    try {
        const result = await LupisPackageHelper.fetchJson(url, null);
        if (result !== null) return result;
        return fallbackValue;
    } catch (e) {
        console.warn(`[Main] Optional JSON not found at ${url}, using fallback.`);
        return fallbackValue;
    }
}

async function loadDetailedItems(baseURL, indexItems, folderName) {
    if (!Array.isArray(indexItems) || indexItems.length === 0) return [];

    const itemPromises = indexItems.map(async (item) => {
        if (typeof item === 'object' && (item.nodes || item.entities || item.localVariables)) {
            return item;
        }

        const fileName = item.fileName || item.file || (typeof item === 'string' ? `${item}.json` : (item.id ? `${item.id}.json` : null));
        if (!fileName) return item;

        const detailUrl = `${baseURL}/${folderName}/${fileName}`;
        const detailData = await fetchJsonWithFallback(detailUrl, null);
        
        if (detailData && typeof detailData === 'object') {
            return { ...item, ...detailData };
        }
        return item;
    });

    return await Promise.all(itemPromises);
}

export async function startEngine(canvasSource, baseURL, initialData = {}, mode = "runtime", onProgress = null) {
    let canvas = typeof canvasSource === 'string' ? document.getElementById(canvasSource) : canvasSource;

    if (!canvas) {
        console.error(`[Main] Canvas element not found.`);
        return null;
    }
    
    Object.assign(canvas.style, {
        display: "block",      
        touchAction: "none",   
        userSelect: "none", 
        outline: "none"      
    });

    canvas.oncontextmenu = (e) => e.preventDefault();

    const game = new Game(); 
    window.$game = game;

    const loader = new RuntimeLoader();

    try {
        let payload = initialData;
        let effectiveBaseURL = baseURL || "./data";

        if (!payload || !payload.assets) {
            let cleanBaseURL = effectiveBaseURL.replace(/\/$/, "");

            if (cleanBaseURL.endsWith(".lupisproject") || cleanBaseURL.endsWith(".data")) {
                const targetAlias = cleanBaseURL.endsWith(".data") ? "./data" : "./project";
                const archiveLoaded = await LupisPackageHelper.tryLoadArchiveFromUrl(cleanBaseURL, targetAlias);
                if (!archiveLoaded) {
                    throw new Error(`Failed to load or decode binary archive from ${cleanBaseURL}`);
                }
                cleanBaseURL = targetAlias;
                effectiveBaseURL = targetAlias;
            } else if (globalThis.__LUPIS_BUILD_MODE__ === "release" && !LupisPackageHelper.hasVirtualArchive()) {
                await LupisPackageHelper.tryLoadArchiveFromUrl(`${cleanBaseURL}/game.data`, cleanBaseURL);
            }

            let projectJsonUrl = `${cleanBaseURL}/project.json`;
            console.log(`[Main] ${mode.toUpperCase()} mode: Fetching project structure from ${cleanBaseURL}...`);

            let projectMeta = await LupisPackageHelper.fetchJson(projectJsonUrl, null);

            if (!projectMeta) {
                const archiveCandidates = [
                    `${cleanBaseURL}/game.data`,
                    "./data/game.data",
                    "./game.lupisproject"
                ];
                for (const candidateUrl of archiveCandidates) {
                    const loaded = await LupisPackageHelper.tryLoadArchiveFromUrl(candidateUrl, cleanBaseURL);
                    if (loaded) {
                        projectMeta = await LupisPackageHelper.fetchJson(projectJsonUrl, null);
                        if (projectMeta) break;
                    }
                }
            }

            if (!projectMeta && cleanBaseURL !== "./project") {
                const legacyMeta = await LupisPackageHelper.fetchJson("./project/project.json", null);
                if (legacyMeta) {
                    projectMeta = legacyMeta;
                    cleanBaseURL = "./project";
                    effectiveBaseURL = "./project";
                    projectJsonUrl = "./project/project.json";
                }
            }

            if (!projectMeta) {
                throw new Error(`Failed to load project.json from ${projectJsonUrl}`);
            }

            let [assetsData, scenesData, prefabsData, scriptsData] = await Promise.all([
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/assets.json`, []),
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/scenes.json`, []),
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/prefabs.json`, []),
                fetchJsonWithFallback(`${cleanBaseURL}/workspaces/scripts.json`, [])
            ]);

            const rawAssets = Array.isArray(assetsData) ? assetsData : (assetsData?.items || []);
            const rawScenes = Array.isArray(scenesData) ? scenesData : (scenesData?.items || []);
            const rawPrefabs = Array.isArray(prefabsData) ? prefabsData : (prefabsData?.items || []);
            const rawScripts = Array.isArray(scriptsData) ? scriptsData : (scriptsData?.items || []);

            const [fullScenes, fullPrefabs, fullScripts] = await Promise.all([
                loadDetailedItems(cleanBaseURL, rawScenes, "scenes"),
                loadDetailedItems(cleanBaseURL, rawPrefabs, "prefabs"),
                loadDetailedItems(cleanBaseURL, rawScripts, "scripts")
            ]);

            const resolvedAssets = rawAssets.map(asset => ({
                ...asset,
                fileUrl: asset.fileUrl || (asset.path ? `${cleanBaseURL}/${asset.path}` : null)
            }));

            const finalScripts = Array.isArray(fullScripts) ? fullScripts : Object.values(fullScripts);

            payload = {
                project: projectMeta,
                assets: resolvedAssets,
                scenes: fullScenes,
                prefabs: fullPrefabs,
                scripts: finalScripts,
                onProgress
            };
        } else if (onProgress && !payload.onProgress) {
            payload.onProgress = onProgress;
        }

        await loader.initializeGame(game, canvas, effectiveBaseURL, mode, payload);
        
        return { game, bus };
        
    } catch (error) {
        console.error("[Main] Fatal Error: Failed to start engine.", error);
        throw error;
    }
}
