export const NodeEntity = {
    'entity_spawn': {
        execute: (runner, node) => {
            const prefabName = runner.getInputValue(node, 'prefab') || node.data?.values?.prefabName;
            const posX = Number(runner.getInputValue(node, 'pos_x')) || 0;
            const posY = Number(runner.getInputValue(node, 'pos_y')) || 0;

            const layerScriptId = runner.getInputValue(node, 'layer_id');
            const zIndex = Number(runner.getInputValue(node, 'zindex')) || 0;
            
            const customScriptId = runner.getInputValue(node, 'custom_id') || node.data?.values?.custom_id;

            let newEntity = null;
            
            if (runner.game && typeof runner.game.spawnPrefab === 'function') {
                newEntity = runner.game.spawnPrefab(prefabName, posX, posY, layerScriptId, zIndex, customScriptId);
            }
            
            node._tempEntityScriptId = newEntity ? newEntity.scriptId : null;

            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'entity' ? node._tempEntityScriptId : null;
        }
    },

    'entity_destroy': {
        execute: (runner, node) => {
            const targetScriptId = runner.getInputValue(node, 'entity');
            const targetEntity = runner.resolveEntity(targetScriptId);
            
            if (targetEntity && runner.game && typeof runner.game.destroyEntity === 'function') {
                runner.game.destroyEntity(targetEntity);
            }
            
            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'entity_destroy_with_parent': {
        execute: (runner, node) => {
            const targetScriptId = runner.getInputValue(node, 'entity');
            const targetEntity = runner.resolveEntity(targetScriptId);
            
            if (targetEntity && runner.game && typeof runner.game.destroyEntity === 'function') {
                if (targetEntity.parentId) {
                    const parentId = targetEntity.parentId;
                    const parentEntity = runner.game.world.entities.find(e => e.id === parentId || e._id === parentId);
                    
                    if (parentEntity) {
                        runner.game.destroyEntity(parentEntity);
                    } else {
                        runner.game.destroyEntity(targetEntity);
                    }
                } else {
                    runner.game.destroyEntity(targetEntity);
                }
            }
            
            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'entity_clone': {
        execute: async (runner, node) => {
            const sourceScriptId = runner.getInputValue(node, 'entity'); 
            const sourceEntity = runner.resolveEntity(sourceScriptId);
            let clone = null;
            
            if (sourceEntity && runner.game && typeof runner.game.cloneEntity === 'function') {
                clone = await runner.game.cloneEntity(sourceEntity);
            }
            
            node._tempCloneScriptId = clone ? clone.scriptId : null;
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'clone' ? node._tempCloneScriptId : null;
        }
    },

    'entity_get_children': {
        execute: (runner, node) => {
            const parentScriptId = runner.getInputValue(node, 'parent');
            const indexVal = runner.getInputValue(node, 'index'); 
            
            const parentEntity = runner.resolveEntity(parentScriptId);
            
            let childrenIds = [];
            let specificChildId = null;
            
            if (parentEntity && runner.game && runner.game.world) {
                const parentInternalId = parentEntity.id || parentEntity._id;
                
                const children = runner.game.world.entities.filter(e => e.parentId === parentInternalId);
                
                childrenIds = children.map(c => c.scriptId).filter(id => id != null);
                
                if (indexVal !== undefined && indexVal !== null && !isNaN(indexVal)) {
                    const parsedIndex = Math.floor(Number(indexVal));
                    if (parsedIndex >= 0 && parsedIndex < childrenIds.length) {
                        specificChildId = childrenIds[parsedIndex];
                    }
                }
            }
            
            node._tempChildrenIds = childrenIds;
            node._tempSpecificChildId = specificChildId;
            
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            if (outputKey === 'children') return node._tempChildrenIds;
            if (outputKey === 'child_id') return node._tempSpecificChildId;
            return null;
        }
    },

    'entity_get_parent': {
        execute: (runner, node) => {
            const childScriptId = runner.getInputValue(node, 'entity');
            const childEntity = runner.resolveEntity(childScriptId);
            
            let parentScriptId = null;
            
            if (childEntity && childEntity.parentId && runner.game && runner.game.world) {
                const parentInternalId = childEntity.parentId;
                const parentEntity = runner.game.world.entities.find(e => e.id === parentInternalId || e._id === parentInternalId);
                
                if (parentEntity && parentEntity.scriptId) {
                    parentScriptId = parentEntity.scriptId;
                }
            }
            
            node._tempParentId = parentScriptId;
            
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'parent_id' ? node._tempParentId : null;
        }
    }
};