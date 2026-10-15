import Game from "./Core/Game.js";
import RuntimeLoader from "./Loader/RuntimeLoader.js";
import { bus } from "./Util/EventBus.js";

async function fetchJsonWithFallback(url, fallbackValue = null) {
    try {
        const response = await fetch(url);
        if (!response.ok) return fallbackValue;
        return await response.json();
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

        if (!payload || !payload.assets) {
            const cleanBaseURL = baseURL.replace(/\/$/, "");
            const projectJsonUrl = `${cleanBaseURL}/project.json`;
            
            console.log(`[Main] ${mode.toUpperCase()} mode: Fetching project structure from ${cleanBaseURL}...`);
            
            const response = await fetch(projectJsonUrl);
            if (!response.ok) {
                throw new Error(`Failed to load project.json from ${projectJsonUrl} (Status: ${response.status})`);
            }
            
            const projectMeta = await response.json();

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

            const [fullScenes, fullScripts] = await Promise.all([
                loadDetailedItems(cleanBaseURL, rawScenes, "scenes"),
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
                prefabs: rawPrefabs,
                scripts: finalScripts,
                onProgress
            };
        } else if (onProgress && !payload.onProgress) {
            payload.onProgress = onProgress;
        }

        await loader.initializeGame(game, canvas, baseURL, mode, payload);
        
        return { game, bus };
        
    } catch (error) {
        console.error("[Main] Fatal Error: Failed to start engine.", error);
        throw error;
    }
}