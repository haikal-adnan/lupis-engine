export default class SceneLoader {
    // [UPDATE] Terima textRenderer di constructor
    constructor(world, textRenderer = null) {
        this.world = world;
        this.textRenderer = textRenderer;
        this.prefabCache = {};
        
        this.componentHandlers = {
            SpriteRenderer: (e, d, a) => this._applySpriteRenderer(e, d, a),
            TextRenderer: (e, d, a) => this._applyTextRenderer(e, d, a),
            ShapeRenderer: (e, d) => this._applyShapeRenderer(e, d),
        };
    }

    async load(sceneData, projectConfig, loadedAssets, prefabsLibrary = {}) {
        const rawLayers = projectConfig.layers || [];
        const layerIds = rawLayers.map(l => l.id || l);
        if (layerIds.length === 0) layerIds.push("layer_root");
        
        this.world.setupLayers(layerIds);

        const entitiesSource = sceneData.entities || sceneData.root || [];
        this.prefabCache = { ...this.prefabCache, ...prefabsLibrary };

        for (const entDesc of entitiesSource) {
            const resolvedDesc = this._resolvePrefab(entDesc);
            const entity = this._buildEntity(resolvedDesc, loadedAssets);
            
            let targetLayer = resolvedDesc.layerId || resolvedDesc.layer;
            if (!targetLayer || !layerIds.includes(targetLayer)) targetLayer = layerIds[0];

            this.world.addEntity(entity, targetLayer);
        }
    }

    _resolvePrefab(desc) {
        const pId = desc.prefabId || desc.prefab;
        if (!pId) return desc;
        const prefabMaster = this.prefabCache[pId];
        if (!prefabMaster) return desc;
        return this._mergePrefab(prefabMaster, desc);
    }

    _mergePrefab(master, instance) {
        const masterData = master.data || master; 
        const mergedComponents = {};
        const mComps = masterData.components || {};
        const iComps = instance.components || {};

        for (const key in mComps) mergedComponents[key] = { ...mComps[key] };
        for (const key in iComps) {
            mergedComponents[key] = mergedComponents[key] ? { ...mergedComponents[key], ...iComps[key] } : iComps[key];
        }
        const mergedTransform = { ...(masterData.transform || {}), ...(instance.transform || {}) };
        return { ...masterData, ...instance, transform: mergedTransform, components: mergedComponents, prefabId: instance.prefabId };
    }

    _buildEntity(desc, assets) {
        const t = desc.transform || {};
        const tr = t.translate || { x: 0, y: 0 };
        const sc = t.scale || { x: 1, y: 1 };
        const pv = t.pivot || { x: 0.5, y: 0.5 };

        const entity = {
            _id: desc._id || desc.id,
            name: desc.name || 'Entity',
            prefabId: desc.prefabId || null,
            layer: desc.layerId || desc.layer,
            width: desc.width ?? t.width ?? 0,
            height: desc.height ?? t.height ?? 0,
            transform: {
                x: desc.x ?? tr.x ?? 0,
                y: desc.y ?? tr.y ?? 0,
                rotation: desc.rotation ?? t.rotation ?? 0,
                scaleX: desc.scaleX ?? sc.x ?? 1,
                scaleY: desc.scaleY ?? sc.y ?? 1,
                pivotX: desc.pivotX ?? pv.x ?? 0.5,
                pivotY: desc.pivotY ?? pv.y ?? 0.5,
                zIndex: desc.zIndex ?? t.zIndex ?? 0
            },
            components: desc.components || {},
            visible: desc.isVisible ?? desc.visible ?? true,
            opacity: desc.opacity ?? 100,
            parentId: desc.parentId || null,
            _editor: desc._editor || {}
        };

        if (entity.components) {
            for (const key in entity.components) {
                const handler = this.componentHandlers[key];
                if (handler) handler(entity, entity.components[key], assets);
            }
        }
        return entity;
    }

    _applySpriteRenderer(e, s, assets) {
        const stored = assets?.textures?.[s.assetId];
        e.image = stored || null;
        e.color = s.color || "#FFFFFF"; 
        if (s.source) e.frame = { sx: s.source.x, sy: s.source.y, sw: s.source.w, sh: s.source.h };
        else if (stored) e.frame = { sx: 0, sy: 0, sw: stored.width, sh: stored.height };
        else e.frame = { sx: 0, sy: 0, sw: 0, sh: 0 };
        e.pixelPerfect = s.pixelPerfect ?? (stored?.filterMode === 'nearest');
    }

    _applyTextRenderer(e, t, assets) {
       e.text = {
           value: t.value || t.text || "",
           size: t.fontSize || t.size || 12, 
           color: t.color || "#FFFFFF",
           assetId: t.assetId,
           align: t.align || "left"
       };

       // [UPDATED] Hitung hitbox menggunakan instance TextRenderer
       // Pastikan renderer sudah punya font yang terload (dari fallback atau user)
       if (this.textRenderer && this.textRenderer.font) {
           const m = this.textRenderer.measureText(e.text.value, e.text.size);
           e.width = m.width || 0; e.height = m.boundsHeight || 0;
           e.hitX = (e.transform.x||0) + (m.xMin||0); e.hitY = (e.transform.y||0) + (m.yMin||0);
           e.hitWidth = m.boundsWidth || 0; e.hitHeight = m.boundsHeight || 0;
       }
    }

    _applyShapeRenderer(e, s) {
       e.shape = s;
       if (['rectangle', 'rectStroke'].includes(s.type)) {
           e.width = s.width ?? e.width; e.height = s.height ?? e.height;
       }
       if (s.type === "line") {
           const {x:x1, y:y1} = e.transform;
           const {x2, y2, thickness:th=1} = s;
           e.hitX = Math.min(x1, x2) - th; e.hitY = Math.min(y1, y2) - th;
           e.hitWidth = Math.abs(x2-x1) + th*2; e.hitHeight = Math.abs(y2-y1) + th*2;
       }
    }
}