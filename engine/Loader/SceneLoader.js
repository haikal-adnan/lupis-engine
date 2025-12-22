export default class SceneLoader {
    constructor(world) {
        this.world = world;
        this.prefabCache = {};
        
        // Strategy Pattern untuk handling Components
        // Agar _buildEntity tidak terlalu panjang
        this.componentHandlers = {
            SpriteRenderer: (e, data, assets) => this._applySpriteRenderer(e, data, assets),
            TextRenderer: (e, data, assets) => this._applyTextRenderer(e, data, assets),
            ShapeRenderer: (e, data) => this._applyShapeRenderer(e, data),
        };
    }

    async load(sceneData, projectConfig, baseURL, loadedAssets) {
        const layersSource = projectConfig.layers || ["layer_objects"];
        this.world.setupLayers(layersSource);

        const entitiesSource = sceneData.entities || sceneData.root || [];
        
        // Async Loop untuk resolve prefab dan build entity
        for (const entDesc of entitiesSource) {
            const resolvedDesc = await this._resolvePrefabIfNeeded(entDesc, baseURL);
            const entity = this._buildEntity(resolvedDesc, loadedAssets);
            
            // Default ke layer pertama jika tidak diset
            const targetLayer = resolvedDesc.layerId || resolvedDesc.layer || layersSource[0];
            this.world.addEntity(entity, targetLayer);
        }
    }

    async _resolvePrefabIfNeeded(desc, baseURL) {
        if (!desc.prefab) return desc;
        
        const name = desc.prefab;
        let prefabData = this.prefabCache[name];

        if (!prefabData) {
            try {
                const res = await fetch(`${baseURL}prefabs/${name}.json`);
                if (res.ok) {
                    prefabData = await res.json();
                    this.prefabCache[name] = prefabData;
                }
            } catch (e) {
                console.warn(`[SceneLoader] Prefab fetch failed: ${name}`, e);
            }
        }

        return prefabData ? this._mergePrefab(prefabData, desc) : desc;
    }

    _mergePrefab(prefab, instance) {
        // Deep clone prefab to avoid mutation issues
        const merged = structuredClone ? structuredClone(prefab) : JSON.parse(JSON.stringify(prefab));
        
        // Override with instance specific data
        return {
            ...merged,
            ...instance, // Instance properties win
            transform: { ...merged.transform, ...instance.transform },
            components: { ...merged.components, ...instance.components }
        };
    }

    _buildEntity(desc, assets) {
        // 1. Resolve Transform (tambahkan Pivot, Opacity)
        const transform = desc.transform || {};
        const { x, y, rotation, scaleX, scaleY, pivotX, pivotY } = this._resolveTransform(desc, transform);

        // Normalize Opacity (0-100 menjadi 0.0-1.0)
        // Cek property 'opacity' di root entity, lalu fallback ke transform (jika ada logic lama)
        const rawOpacity = desc.opacity ?? 100;
        const opacity = desc.opacity !== undefined ? desc.opacity : 100;

        // 2. Base Entity Structure
        const entity = {
            _id: desc._id || desc.id, 
            name: desc.name,
            layer: desc.layerId || desc.layer,
            components: desc.components || {},
            visible: desc.visible ?? true,
            zIndex: desc.zIndex ?? transform.zIndex ?? 0, // Ambil zIndex dari transform juga
            parentId: desc.parentId || null,
            // --- DATA BARU ---
            x, y, rotation, scaleX, scaleY, 
            pivotX, pivotY,
            opacity
        };

        // 3. Apply Components
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
            rotation: desc.rotation ?? t.rotation ?? 0, // Dalam radian
            scaleX: desc.scaleX ?? scale.x ?? 1,
            scaleY: desc.scaleY ?? scale.y ?? 1,
            // Default Pivot 0.5 (Tengah) atau 0 (Kiri Atas) tergantung preferensi
            // Di schema Anda default 0.5
            pivotX: desc.pivotX ?? pivot.x ?? 0.5, 
            pivotY: desc.pivotY ?? pivot.y ?? 0.5
        };
    }

    // --- Component Applicators ---

    _applySpriteRenderer(e, s, assets) {
        const stored = assets?.textures?.[s.assetId];
        
        e.image = stored || null;
        e.width = s.width ?? s.w ?? (stored?.width ?? 0);
        e.height = s.height ?? s.h ?? (stored?.height ?? 0);
        e.zIndex = s.zIndex ?? e.zIndex;
        e.alpha = s.alpha ?? 1;

        // Frame Logic
        if (s.source) {
            e.frame = { sx: s.source.x, sy: s.source.y, sw: s.source.w, sh: s.source.h };
        } else if (stored) {
            e.frame = { sx: 0, sy: 0, sw: stored.width, sh: stored.height };
        } else {
            e.frame = { sx: 0, sy: 0, sw: 0, sh: 0 };
        }

        // Pixel Perfect Logic
        const assetIsPixelated = ['pixelated', 'nearest'].includes(stored?.filterMode);
        e.pixelPerfect = s.pixelPerfect ?? assetIsPixelated;
    }

    _applyTextRenderer(e, text, assets) {
        e.text = {
            value: text.text,
            size: text.fontSize ?? text.size, 
            color: text.color,
            assetId: text.assetId,
            align: text.align || "left"
        };
        e.zIndex = text.zIndex ?? e.zIndex;

        const font = assets?.fonts?.[text.assetId];
        
        // Auto-calculate bounds if font is loaded
        if (font?.measureText) {
            const m = font.measureText(e.text.value, e.text.size);
            e.width = m.width ?? 0;
            e.height = m.boundsHeight ?? 0;
            
            // Hitbox for selection
            e.hitX = (e.x ?? 0) + (m.xMin ?? 0);
            e.hitY = (e.y ?? 0) + (m.yMin ?? 0);
            e.hitWidth = m.boundsWidth ?? m.width ?? 0;
            e.hitHeight = m.boundsHeight ?? 0;
        }
    }

    _applyShapeRenderer(e, sh) {
        e.shape = sh;
        e.zIndex = sh.zIndex ?? e.zIndex;

        if (['rectangle', 'rectStroke'].includes(sh.type)) {
            e.width = sh.width;
            e.height = sh.height;
        } else if (sh.type === "line") {
            this._calculateLineHitbox(e, sh);
        }
    }

    _calculateLineHitbox(e, sh) {
        const { x: x1, y: y1 } = e;
        const { x2, y2, thickness: th = 1 } = sh;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const epsilon = 0.0001;

        if (Math.abs(dy) < epsilon) { 
            // Horizontal
            e.hitX = Math.min(x1, x2); e.hitY = y1 - th / 2; 
            e.hitWidth = Math.abs(dx); e.hitHeight = th; 
        } else if (Math.abs(dx) < epsilon) { 
            // Vertical
            e.hitX = x1 - th / 2; e.hitY = Math.min(y1, y2); 
            e.hitWidth = th; e.hitHeight = Math.abs(dy); 
        } else { 
            // Angled (Simplified bounding box)
            e.hitX = Math.min(x1, x2) - th / 2; 
            e.hitY = Math.min(y1, y2) - th / 2; 
            e.hitWidth = Math.abs(dx) + th; 
            e.hitHeight = Math.abs(dy) + th; 
        }
    }
}