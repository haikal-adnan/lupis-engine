export const NodeEntity = {
    'entity_spawn': {
        execute: async (runner, node) => {
            const prefabName = runner.getInputValue(node, 'prefab') || node.data?.values?.prefabPath;
            const posX = Number(runner.getInputValue(node, 'pos_x')) || 0;
            const posY = Number(runner.getInputValue(node, 'pos_y')) || 0;

            console.log("klhnagef");
            
            // Mengambil input dari soket layer (Berupa Layer Script ID string)
            const layerScriptId = runner.getInputValue(node, 'layer');
            const zIndex = Number(runner.getInputValue(node, 'zindex')) || 0;

            let newEntity = null;
            
            // Oper layerScriptId ke fungsi engine
            if (runner.game && typeof runner.game.spawnPrefab === 'function') {
                newEntity = runner.game.spawnPrefab(prefabName, posX, posY, layerScriptId, zIndex);
            }
            
            // Output berupa Script ID (string) dari entity yang baru saja di-spawn
            node._tempEntityScriptId = newEntity ? newEntity.scriptId : null;
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'entity' ? node._tempEntityScriptId : null;
        }
    },

    'entity_destroy': {
        execute: (runner, node) => {
            const targetScriptId = runner.getInputValue(node, 'entity'); // Sekarang mengambil string
            const targetEntity = runner.resolveEntity(targetScriptId);
            
            if (targetEntity && runner.game && typeof runner.game.destroyEntity === 'function') {
                runner.game.destroyEntity(targetEntity);
            }
            
            runner.executeFlow(node._id, 'exec_out');
        }
    },

    'entity_clone': {
        execute: async (runner, node) => {
            const sourceScriptId = runner.getInputValue(node, 'entity'); // Sekarang mengambil string
            const sourceEntity = runner.resolveEntity(sourceScriptId);
            let clone = null;
            
            if (sourceEntity && runner.game && typeof runner.game.cloneEntity === 'function') {
                clone = await runner.game.cloneEntity(sourceEntity);
            }
            
            // Output berupa Script ID (string) dari clone tersebut
            node._tempCloneScriptId = clone ? clone.scriptId : null;
            runner.executeFlow(node._id, 'exec_out');
        },
        getOutput: (runner, node, outputKey) => {
            return outputKey === 'clone' ? node._tempCloneScriptId : null;
        }
    },
};