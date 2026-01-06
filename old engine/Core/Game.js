import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import Config from "./Config.js";
import { bus } from "../Util/EventBus.js";
import { SyncEntityComponents } from "../Util/SyncEntity.js";

import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import TextureUtil from "../Util/TextureUtil.js";

export default class Game {
    constructor() {
        this.world = new World();
        this.camera = new Camera(0, 0);
        this.camera.scale = 1;
        this.renderer = null;

        this.loop = new GameLoop({
            update: dt => this.update(dt),
            render: a  => this.render(a),
        });

        bus.on("entity:modified", (entities) => {
            if (Array.isArray(entities)) {
                entities.forEach(entity => SyncEntityComponents(entity, this));
            }
        });

    }

    start() {
        this.loop.start();
    }

    update(dt) {
        if (Config.ENGINE_MODE !== "editor") {
            if (this.world.player) {
                this.camera.updateFollow(this.world.player, dt);
            }
        }
        this.world.update(dt);
    }

    getAssetMeta(assetId) {
        return TextureUtil.getAssetMetaFromWorld(this.world, assetId);
    }

    computeThumbnailStyle(url, source, assetId, containerSize) {
        const dims = this.getAssetMeta(assetId);
        if (!dims) return null; 
        return TextureUtil.getThumbnailStyle(url, source, dims, containerSize);
    }

    handleHierarchyUpdate({ _id, parentId, layerId, reorderInfo }) {
        const entity = this.world.entities.find(e => String(e._id) === String(_id));
        if (!entity) return;

        const nextParentId = parentId || null;
        const nextLayerId = layerId;

        entity.parentId = nextParentId;
        entity.layerId = nextLayerId;

        const siblings = this.world.entities.filter(e => {
            if (String(e._id) === String(_id)) return false;

            const eParent = e.parentId || null;
            return String(eParent) === String(nextParentId) && 
                   String(e.layerId) === String(nextLayerId);
        });

        siblings.sort((a, b) => {
            const zA = Number(a.transform?.zIndex ?? 0);
            const zB = Number(b.transform?.zIndex ?? 0);
            
            if (zA !== zB) return zA - zB;
            
            return String(a._id).localeCompare(String(b._id));
        });

        if (reorderInfo && reorderInfo.position !== 'inside') {
            const targetId = reorderInfo.targetId;
            const targetIndex = siblings.findIndex(e => String(e._id) === String(targetId));

            if (targetIndex !== -1) {
                if (reorderInfo.position === 'top') {
                    siblings.splice(targetIndex, 0, entity);
                } else {
                    siblings.splice(targetIndex + 1, 0, entity);
                }
            } else {
                siblings.push(entity);
            }
        } else {
            siblings.push(entity);
        }

        siblings.forEach((sib, index) => {
            if (!sib.transform) sib.transform = {};
            sib.transform.zIndex = index;
            
            sib.parentId = nextParentId;
            sib.layerId = nextLayerId;
        });

        bus.emit("entity:modified", siblings);
    }
    
    render(alpha) {
        const cam = this.camera.getInterpolated(alpha);
        this.history?.update();
        if(this.cameraController) this.cameraController.update();
        if (this.selection) this.selection.update();
        if (this.transform) this.transform.update();
        if (this.pointerCoords) this.pointerCoords.update();

        this.renderer?.render(this.world, cam, this);
    }
}