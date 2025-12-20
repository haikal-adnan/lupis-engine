export default class SceneLoader {
    constructor(world) {
        this.world = world;
        this.prefabCache = {};
    }

    async load(sceneData, projectConfig, baseURL, loadedAssets) {
        const layersSource = projectConfig.layers || projectConfig.editor?.layers || ["layer_objects"];
        this.world.setupLayers(layersSource);

        const entitiesSource = sceneData.entities || sceneData.root || [];
        
        for (const entDesc of entitiesSource) {
            const resolvedDesc = await this._resolvePrefabIfNeeded(entDesc, baseURL);
            const entity = this._buildEntity(resolvedDesc, loadedAssets);
            this.world.addEntity(entity, resolvedDesc.layerId || resolvedDesc.layer || layersSource[0]);
        }
    }

    async _resolvePrefabIfNeeded(desc, baseURL) {
        if (!desc.prefab) return desc;
        const name = desc.prefab;
        
        if (this.prefabCache[name]) {
            return this._mergePrefab(this.prefabCache[name], desc);
        }

        try {
            const res = await fetch(baseURL + "prefabs/" + name + ".json");
            if (!res.ok) return desc;
            const prefab = await res.json();
            this.prefabCache[name] = prefab;
            return this._mergePrefab(prefab, desc);
        } catch (e) {
            console.warn(`[SceneLoader] Failed to load prefab: ${name}`, e);
            return desc;
        }
    }

    _mergePrefab(prefab, instance) {
        const merged = JSON.parse(JSON.stringify(prefab));
        merged.id = instance.id ?? merged.id;
        merged.name = instance.name ?? merged.name;
        merged.layerId = instance.layerId ?? merged.layerId;
        merged.transform = Object.assign({}, merged.transform || {}, instance.transform || {});
        merged.components = Object.assign({}, merged.components || {}, instance.components || {});
        merged.visible = instance.visible ?? merged.visible;
        return merged;
    }

    _buildEntity(desc, assets) {
        const transform = desc.transform || {};
        const scale = transform.scale || {};
        const components = desc.components || {}; 

        const e = {
            id: desc.id,
            name: desc.name,
            layer: desc.layerId || desc.layer,
            components: components,
            visible: desc.visible ?? true,
            zIndex: 0,
            x: transform.translate?.x ?? transform.x ?? 0,
            y: transform.translate?.y ?? transform.y ?? 0,
            rotation: transform.rotation ?? 0,
            scaleX: scale.x ?? 1,
            scaleY: scale.y ?? 1,
            parentId: desc.parentId || null 
        };

        this._applySpriteRenderer(e, components.SpriteRenderer, assets);
        this._applyTextRenderer(e, components.TextRenderer, assets);
        this._applyShapeRenderer(e, components.ShapeRenderer);

        return e;
    }

    _applySpriteRenderer(e, s, assets) {
        if (!s) return;
        
        const stored = assets && assets.textures ? assets.textures[s.assetId] : null;
        
        if (stored) {
            e.image = stored;
        } else {
            e.image = null; 
        }

        if (s.source) {
            e.frame = { sx: s.source.x, sy: s.source.y, sw: s.source.w, sh: s.source.h };
        } else if (stored) {
            e.frame = { sx: 0, sy: 0, sw: stored.width, sh: stored.height };
        } else {
            e.frame = { sx: 0, sy: 0, sw: 0, sh: 0 };
        }

        e.width = s.width ?? s.w ?? (stored?.width ?? 0);
        e.height = s.height ?? s.h ?? (stored?.height ?? 0);
        
        const assetIsPixelated = stored?.filterMode === 'pixelated' || stored?.filterMode === 'nearest';
        e.pixelPerfect = (s.pixelPerfect !== undefined) ? s.pixelPerfect : assetIsPixelated;
        e.zIndex = s.zIndex ?? e.zIndex;
        e.alpha = s.alpha ?? 1;
    }

    _applyTextRenderer(e, text, assets) {
        if (!text) return;
        e.text = {
            value: text.text,
            size: text.fontSize ?? text.size, // Support nama baru fontSize
            color: text.color,
            assetId: text.assetId,
            align: text.align || "left"
        };
        e.zIndex = text.zIndex ?? e.zIndex;

        // Ambil instance font class yang sudah diload
        const f = (assets && assets.fonts ? assets.fonts[text.assetId] : null);
        
        // Hitung bounding box text jika font sudah tersedia
        if (f && f.measureText) {
            // Gunakan e.text.size agar konsisten
            const m = f.measureText(e.text.value, e.text.size);
            
            e.hitX = (e.x ?? 0) + (m.xMin ?? 0);
            e.hitY = (e.y ?? 0) + (m.yMin ?? 0);
            e.hitWidth = m.boundsWidth ?? m.width ?? 0;
            e.hitHeight = m.boundsHeight ?? 0;
            
            // Opsional: set width/height entity agar selection box pas
            e.width = m.width ?? e.width;
            e.height = m.boundsHeight ?? e.height;
        }
    }

    _applyShapeRenderer(e, sh) {
        if (!sh) return;
        e.shape = sh;
        e.zIndex = sh.zIndex ?? e.zIndex;

        if (sh.type === "rectangle" || sh.type === "rectStroke") {
            e.width = sh.width;
            e.height = sh.height;
        }

        if (sh.type === "line") {
            const x1 = e.x; const y1 = e.y; 
            const x2 = sh.x2; const y2 = sh.y2; 
            const th = sh.thickness ?? 1;
            const dx = x2 - x1; const dy = y2 - y1;
            
            if (Math.abs(dy) < 0.0001) { 
                e.hitX = Math.min(x1, x2); e.hitY = y1 - th / 2; e.hitWidth = Math.abs(dx); e.hitHeight = th; 
            } else if (Math.abs(dx) < 0.0001) { 
                e.hitX = x1 - th / 2; e.hitY = Math.min(y1, y2); e.hitWidth = th; e.hitHeight = Math.abs(dy); 
            } else { 
                const minX = Math.min(x1, x2); const maxX = Math.max(x1, x2); 
                const minY = Math.min(y1, y2); const maxY = Math.max(y1, y2); 
                e.hitX = minX - th / 2; e.hitY = minY - th / 2; 
                e.hitWidth = (maxX - minX) + th; e.hitHeight = (maxY - minY) + th; 
            }
        }
    }
}