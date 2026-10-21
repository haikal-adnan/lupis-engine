import { HexToVec4 } from "../../Util/HexToVec4.js";
import Config from "../../Core/Config.js";
import RenderUtils from "./RenderUtils.js";

export default class UIRenderer {
    constructor(image, shape, text, game) {
        this.renderer = { image, shape, text };
        this.game = game;
        this.renderQueue = [];
        this.borderColor = HexToVec4("#00aaff");
        this.dashedColor = [0, 0.66, 1, 0.5];
        
        this.colliderColorSolid = [0, 1, 0, 0.8]; 
        this.colliderColorTrigger = [1, 1, 0, 0.8]; 
        this.colliderColorHitbox = [1, 0.15, 0.15, 0.85];
        this.colliderColorHurtbox = [0, 0.75, 1, 0.85]; 
    }

    render(world, proj, isSceneMode = false) {
        const isEditor = Config.ENGINE_MODE === "editor";
        const uiSettings = world?.settings?.ui || { 
            active: true, width: 1920, height: 1080, showUIBorder: true 
        };

        if (!uiSettings.active || uiSettings.visible === false) return;

        if (isEditor) {
            if (isSceneMode && uiSettings.showUIBorder) {
                this._renderDashedBorder(proj, uiSettings.width, uiSettings.height);
            } else if (!isSceneMode) {
                this._renderWorkspaceGizmos(proj, uiSettings.width, uiSettings.height);
            }
        }

        this.renderQueue.length = 0;
        this._collectUIEntities(world, proj);
        RenderUtils.executeRenderQueue(this.renderQueue, this.renderer, proj, world);
    }

    _collectUIEntities(world, proj) {
        const layers = [...(world?.layersUI || [])];
        RenderUtils.sortItems(layers);

        for (const layer of layers) {
            if (!layer || layer.active === false || !layer.visible || !layer.entities) continue;
            
            const layerOpacity = layer.opacity ?? 1.0;
            const allEntities = RenderUtils.getHierarchicalOrder(layer.entities);
            
            for (const entity of allEntities) {
                this._processUIEntity(entity, world, proj, layerOpacity); 
            }
        }
    }

    _processUIEntity(e, world, proj, parentOpacity) {
        if (!e || !RenderUtils.isEntityEffectivelyActive(e, world) || !RenderUtils.isEntityEffectivelyVisible(e, world)) return;

        const comps = e.components;
        if (!comps) return;

        const rawT = comps.UITransform || comps.Transform;
        if (!rawT) return;

        const absT = RenderUtils.calculateAbsoluteTransform(e, world);

        const trans = {
            x: absT.x,
            y: absT.y,
            width: absT.width || 0,
            height: absT.height || 0,
            rotation: (absT.rotation || 0) * (Math.PI / 180),
            scaleX: absT.scaleX ?? 1,
            scaleY: absT.scaleY ?? 1,
            pivotX: absT.pivotX ?? 0.5,
            pivotY: absT.pivotY ?? 0.5
        };

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;
        const flipX = rawT.flipX || false;
        const flipY = rawT.flipY || false;
        const entityId = e.id;

        if (comps.SpriteRenderer) {
            RenderUtils.processSprite(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
        }
        
        if (comps.ShapeRenderer) {
            RenderUtils.processShape(comps, currentOpacity, flipX, flipY, entityId, this.renderQueue, trans);
        }

        if (comps.TextRenderer) {
            RenderUtils.processText(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
        }

        RenderUtils.processColliderDebug(comps, absT, trans, this.renderQueue, this.colliderColorSolid, this.colliderColorTrigger, this.colliderColorHitbox, this.colliderColorHurtbox, world?.settings?.colliders);
    }

    _renderWorkspaceGizmos(proj, w, h) {
        RenderUtils.drawShape(
            this.renderer.shape,
            { type: "rectStroke", color: this.borderColor, thickness: 4 },
            { x: 0, y: 0, width: w, height: h, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0, pivotY: 0 },
            proj, null, null
        );
        this.renderer.shape?.flush();
    }

    _renderDashedBorder(proj, width, height) {
        const scale = this.game?.camera?.scale || 1;
        const dashLen = 20 / scale;
        const gapLen = 10 / scale;
        const shape = this.renderer.shape;

        RenderUtils.drawDashedLine(shape, 0, 0, width, 0, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        RenderUtils.drawDashedLine(shape, width, 0, width, height, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        RenderUtils.drawDashedLine(shape, width, height, 0, height, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        RenderUtils.drawDashedLine(shape, 0, height, 0, 0, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        shape?.flush();
    }
}