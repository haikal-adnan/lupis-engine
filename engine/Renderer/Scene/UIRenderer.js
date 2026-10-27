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
    }

    render(world, proj, isSceneMode = false) {
        const isEditor = Config.ENGINE_MODE === "editor";
        const uiSettings = world.settings?.ui || { 
            active: true, width: 1920, height: 1080, showUIBorder: true 
        };

        if (!uiSettings.active) return;

        if (isEditor) {
            if (isSceneMode && uiSettings.showUIBorder) {
                this._renderDashedBorder(proj, uiSettings.width, uiSettings.height);
            } else if (!isSceneMode) {
                this._renderWorkspaceGizmos(proj, uiSettings.width, uiSettings.height);
            }
        }

        const rootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };
        this.renderQueue.length = 0;
        this._collectUIEntities(world, proj, rootBounds);
        RenderUtils.executeRenderQueue(this.renderQueue, this.renderer, proj, world);
    }

    _collectUIEntities(world, proj, rootBounds) {
        const layers = [...(world.layersUI || [])];
        RenderUtils.sortItems(layers);

        for (const layer of layers) {
            if (layer.active === false || !layer.visible || !layer.entities) continue;
            
            const layerOpacity = layer.opacity ?? 1.0;
            const allEntities = [...layer.entities];
            RenderUtils.sortItems(allEntities);
            
            for (const entity of allEntities) {
                this._processUIEntity(entity, world, proj, layerOpacity, rootBounds); 
            }
        }
    }

    _processUIEntity(e, world, proj, parentOpacity, parentBounds) {
        if (e.active === false || e.visible === false) return;

        const comps = e.components;
        if (!comps) return;

        const rawT = comps.UITransform || comps.Transform;
        if (!rawT) return;

        const globalT = RenderUtils.getGlobalTransform(e, world);

        const anchorX = rawT.anchorX ?? 0.5;
        const anchorY = rawT.anchorY ?? 0.5;
        const anchorPointX = parentBounds.x + (parentBounds.width * anchorX);
        const anchorPointY = parentBounds.y + (parentBounds.height * anchorY);

        const trans = {
            x: anchorPointX + (globalT.x || 0),
            y: anchorPointY + (globalT.y || 0),
            width: globalT.width || 0,
            height: globalT.height || 0,
            rotation: (globalT.rotation || 0) * (Math.PI / 180),
            scaleX: globalT.scaleX ?? 1,
            scaleY: globalT.scaleY ?? 1,
            pivotX: globalT.pivotX ?? 0.5,
            pivotY: globalT.pivotY ?? 0.5
        };

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;
        const flipX = rawT.flipX || false;
        const flipY = rawT.flipY || false;
        const entityId = e.id || e._id;

        if (comps.SpriteRenderer) {
            RenderUtils.processSprite(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
        }
        
        if (comps.ShapeRenderer) {
            RenderUtils.processShape(comps, currentOpacity, flipX, flipY, entityId, this.renderQueue, trans);
        }

        if (comps.TextRenderer) {
            RenderUtils.processText(comps, currentOpacity, flipX, flipY, rawT, world, this.renderQueue, trans);
        }

        RenderUtils.processColliderDebug(comps, globalT, trans, this.renderQueue, this.colliderColorSolid, this.colliderColorTrigger);
    }

    _renderWorkspaceGizmos(proj, w, h) {
        RenderUtils.drawShape(
            this.renderer.shape,
            { type: "rectStroke", color: this.borderColor, thickness: 4 },
            { x: 0, y: 0, width: w, height: h, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0, pivotY: 0 },
            proj, null, null
        );
        this.renderer.shape.flush();
    }

    _renderDashedBorder(proj, width, height) {
        const scale = this.game.camera.scale || 1;
        const dashLen = 20 / scale;
        const gapLen = 10 / scale;
        const shape = this.renderer.shape;

        RenderUtils.drawDashedLine(shape, 0, 0, width, 0, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        RenderUtils.drawDashedLine(shape, width, 0, width, height, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        RenderUtils.drawDashedLine(shape, width, height, 0, height, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        RenderUtils.drawDashedLine(shape, 0, height, 0, 0, dashLen, gapLen, 2 / scale, this.dashedColor, proj);
        shape.flush();
    }
}