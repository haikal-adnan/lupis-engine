import PointerRaycast from '../../System/PointerRaycast.js'; // Ganti path ini sesuai proyek Anda

export const NodeMouse = {
    'mouse_entity_interact': {
        execute: (runner, node) => {
            const targetId = runner.getInputValue(node, 'target_in');
            const entity = runner.resolveEntity(targetId);

            if (!entity) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const hasTransform = entity.components && entity.components.Transform;
            const hasUITransform = entity.components && entity.components.UITransform;

            if (!hasTransform && !hasUITransform) {
                runner.executeFlow(node._id, 'exec_out');
                return;
            }

            const pointer = runner.game.input.getPointer();
            const isPointerDown = pointer.down; 
            const entityId = entity.id || entity._id;
            
            // Ambil input use_raycast (default: true)
            const useRaycast = runner.getInputValue(node, 'use_raycast') ?? true;

            let isHovering = false;
            let outputEntityScriptId = null;

            if (useRaycast) {
                // --- METODE 1: RAYCAST (Menghormati Z-Index & Occlusion) ---
                const topEntity = PointerRaycast.getTopEntityUnderPointer(runner.game);
                
                if (topEntity) {
                    outputEntityScriptId = topEntity.scriptId || topEntity.id || topEntity._id;

                    if (topEntity.id === entityId || topEntity._id === entityId) {
                        isHovering = true;
                    } else {
                        let currentParentId = topEntity.parentId;
                        while (currentParentId) {
                            if (currentParentId === entityId) {
                                isHovering = true;
                                break;
                            }
                            const pEntity = runner.game.world.entities.find(
                                e => e.id === currentParentId || e._id === currentParentId
                            );
                            currentParentId = pEntity ? pEntity.parentId : null;
                        }
                    }
                }
            } else {
                // --- METODE 2: DIRECT HIT-TEST (Mengabaikan Z-Index & Occlusion) ---
                const canvas = runner.game.renderer?.canvas || { width: 1920, height: 1080 };
                const uiSettings = runner.game.world.settings?.ui || { width: 1920, height: 1080 };
                const camera = runner.game.camera;

                const uiPointer = {
                    x: (pointer.x / canvas.width) * uiSettings.width,
                    y: (pointer.y / canvas.height) * uiSettings.height
                };

                const halfW = canvas.width / 2;
                const halfH = canvas.height / 2;
                const worldPointer = {
                    x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
                    y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
                };

                const globalT = PointerRaycast._getGlobalTransform(entity, runner.game.world);
                let drawX = globalT.x || 0;
                let drawY = globalT.y || 0;
                let targetPointer = hasUITransform ? uiPointer : worldPointer;

                if (hasUITransform) {
                    const t = entity.components.UITransform;
                    const anchorX = t.anchorX ?? 0.5;
                    const anchorY = t.anchorY ?? 0.5;
                    drawX = (uiSettings.width * anchorX) + (globalT.x || 0);
                    drawY = (uiSettings.height * anchorY) + (globalT.y || 0);
                }

                isHovering = PointerRaycast._checkIntersection(entity, globalT, drawX, drawY, targetPointer.x, targetPointer.y);
                
                if (isHovering) {
                    outputEntityScriptId = entity.scriptId || entity.id || entity._id;
                }
            }

            if (!node._interactStates) node._interactStates = {};
            
            let state = node._interactStates[entityId];
            if (!state) {
                state = { wasHovering: false, wasDown: false };
                node._interactStates[entityId] = state;
            }

            node._tempData = {
                is_hovering: isHovering,
                is_holding: isHovering && isPointerDown,
                entity_id: outputEntityScriptId 
            };

            runner.executeFlow(node._id, 'exec_out');
            
            if (isHovering) {
                runner.executeFlow(node._id, 'on_hover');

                if (isPointerDown && !state.wasDown) {
                    runner.executeFlow(node._id, 'on_down');
                }
                
                if (isPointerDown && state.wasDown) {
                    runner.executeFlow(node._id, 'on_hold');
                }

                if (!isPointerDown && state.wasDown) {
                    runner.executeFlow(node._id, 'on_up');
                }
            }

            state.wasHovering = isHovering;
            state.wasDown = isPointerDown;
        },
        
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'is_hovering') return node._tempData?.is_hovering || false;
            if (outputKey === 'is_holding') return node._tempData?.is_holding || false;
            if (outputKey === 'entityId') return node._tempData?.entity_id || null; 
            return null;
        }
    }
};