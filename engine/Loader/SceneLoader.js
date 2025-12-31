export default class SceneLoader {
    constructor(world) {
        this.world = world;
        this.prefabCache = {};
        
        this.componentHandlers = {
            SpriteRenderer: (e, data, assets) => this._applySpriteRenderer(e, data, assets),
            TextRenderer: (e, data, assets) => this._applyTextRenderer(e, data, assets),
            ShapeRenderer: (e, data) => this._applyShapeRenderer(e, data),
        };
    }

    async load(sceneData, projectConfig, loadedAssets, prefabsLibrary = {}) {
        const layersSource = projectConfig.layers || ["layer_objects"];
        this.world.setupLayers(layersSource);

        const entitiesSource = sceneData.entities || sceneData.root || [];
        
        this.prefabCache = { ...this.prefabCache, ...prefabsLibrary };

        for (const entDesc of entitiesSource) {
            const resolvedDesc = this._resolvePrefab(entDesc);
            
            // 3. Build
            const entity = this._buildEntity(resolvedDesc, loadedAssets);
            
            const targetLayer = resolvedDesc.layerId || resolvedDesc.layer || layersSource[0];
            this.world.addEntity(entity, targetLayer);
        }
    }

    _resolvePrefab(desc) {
        const pId = desc.prefabId || desc.prefab;
        
        if (!pId) return desc;
        
        const prefabMaster = this.prefabCache[pId];

        if (!prefabMaster) {
            console.warn(`[SceneLoader] Missing Prefab Master: ${pId} for Entity: ${desc.name}`);
            return desc;
        }

        // Jika ketemu, lakukan Merge
        return this._mergePrefab(prefabMaster, desc);
    }

    _mergePrefab(master, instance) {
        // ... (LOGIC SAMA SEPERTI SEBELUMNYA) ...
        const masterData = master.data || master; 

        const mergedTransform = {
            ...masterData.transform,
            ...instance.transform
        };

        const mergedComponents = {};
        
        // Copy Master Components
        if (masterData.components) {
            for (const key in masterData.components) {
                mergedComponents[key] = { ...masterData.components[key] };
            }
        }

        // Override with Instance Components
        if (instance.components) {
            for (const key in instance.components) {
                if (mergedComponents[key]) {
                    mergedComponents[key] = {
                        ...mergedComponents[key],
                        ...instance.components[key]
                    };
                } else {
                    mergedComponents[key] = instance.components[key];
                }
            }
        }

        return {
            ...masterData, 
            ...instance,   
            transform: mergedTransform,
            components: mergedComponents,
            prefabId: instance.prefabId || instance.prefab 
        };
    }

    _buildEntity(desc, assets) {
        const transformData = desc.transform || {};
        const { x, y, rotation, scaleX, scaleY, pivotX, pivotY } = this._resolveTransform(desc, transformData);

        const entity = {
            _id: desc._id || desc.id,
            name: desc.name,
            prefabId: desc.prefabId || null,
            layer: desc.layerId || desc.layer,
            
            // --- PERBAIKAN DI SINI ---
            // Ambil width/height dari root object atau transform object terlebih dahulu
            width: desc.width ?? transformData.width ?? 0,
            height: desc.height ?? transformData.height ?? 0,
            // -------------------------

            transform: {
                x, y, rotation,
                scaleX, scaleY,
                pivotX, pivotY,
                zIndex: desc.zIndex ?? transformData.zIndex ?? 0
            },
            components: desc.components || {},
            visible: desc.visible ?? true,
            opacity: desc.opacity !== undefined ? desc.opacity : 100,
            parentId: desc.parentId || null,
        };

        if (entity.components) {
            for (const [key, handler] of Object.entries(this.componentHandlers)) {
                if (entity.components[key]) {
                    handler(entity, entity.components[key], assets);
                }
            }
        }

        return entity;
    }

    _resolveTransform(desc, t) {
        const scale = t.scale || {};
        const pivot = t.pivot || {};

        return {
            x: desc.x ?? t.translate?.x ?? t.x ?? 0,
            y: desc.y ?? t.translate?.y ?? t.y ?? 0,
            rotation: desc.rotation ?? t.rotation ?? 0, 
            scaleX: desc.scaleX ?? scale.x ?? 1,
            scaleY: desc.scaleY ?? scale.y ?? 1,
            pivotX: desc.pivotX ?? pivot.x ?? 0.5, 
            pivotY: desc.pivotY ?? pivot.y ?? 0.5
        };
    }
    
    _applySpriteRenderer(e, s, assets) {
        const stored = assets?.textures?.[s.assetId];
        e.image = stored || null;
        
        e.transform.zIndex = s.zIndex ?? e.transform.zIndex;

        if (s.source) {
            e.frame = { sx: s.source.x, sy: s.source.y, sw: s.source.w, sh: s.source.h };
        } else if (stored) {
            e.frame = { sx: 0, sy: 0, sw: stored.width, sh: stored.height };
        } else {
            e.frame = { sx: 0, sy: 0, sw: 0, sh: 0 };
        }
        const assetIsPixelated = ['pixelated', 'nearest'].includes(stored?.filterMode);
        e.pixelPerfect = s.pixelPerfect ?? assetIsPixelated;
    }

    _applyTextRenderer(e, text, assets) {
       e.text = {
           value: text.value,
           size: text.fontSize ?? text.size, 
           color: text.color || "#FFFFFF",
           assetId: text.assetId,
           align: text.align || "left"
       };
       e.transform.zIndex = text.zIndex ?? e.transform.zIndex;

       const font = assets?.fonts?.[text.assetId];
       if (font?.measureText) {
           const m = font.measureText(e.text.value, e.text.size);
           e.width = m.width ?? 0;
           e.height = m.boundsHeight ?? 0;
           e.hitX = (e.transform.x ?? 0) + (m.xMin ?? 0);
           e.hitY = (e.transform.y ?? 0) + (m.yMin ?? 0);
           e.hitWidth = m.boundsWidth ?? m.width ?? 0;
           e.hitHeight = m.boundsHeight ?? 0;
       }
    }

    _applyShapeRenderer(e, sh) {
       e.shape = sh;
       e.transform.zIndex = sh.zIndex ?? e.transform.zIndex;
       if (['rectangle', 'rectStroke'].includes(sh.type)) {
           e.width = sh.width;
           e.height = sh.height;
       } else if (sh.type === "line") {
           this._calculateLineHitbox(e, sh);
       }
    }

    _calculateLineHitbox(e, sh) {
       const { x: x1, y: y1 } = e.transform;
       const { x2, y2, thickness: th = 1 } = sh;
       const dx = x2 - x1;
       const dy = y2 - y1;
       const epsilon = 0.0001;
       if (Math.abs(dy) < epsilon) { 
           e.hitX = Math.min(x1, x2); e.hitY = y1 - th / 2; e.hitWidth = Math.abs(dx); e.hitHeight = th; 
       } else if (Math.abs(dx) < epsilon) { 
           e.hitX = x1 - th / 2; e.hitY = Math.min(y1, y2); e.hitWidth = th; e.hitHeight = Math.abs(dy); 
       } else { 
           e.hitX = Math.min(x1, x2) - th / 2; e.hitY = Math.min(y1, y2) - th / 2; 
           e.hitWidth = Math.abs(dx) + th; e.hitHeight = Math.abs(dy) + th; 
       }
    }
}