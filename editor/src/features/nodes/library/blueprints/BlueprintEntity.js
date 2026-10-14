import { Box } from 'lucide-vue-next';

export const BlueprintEntity = {
  id: 'game_entity',
  label: 'Entity Management',
  color: '#E91E63',
  icon: Box,
  items: [
    {
      type: 'entity_spawn',
      label: 'Spawn Prefab',
      description: 'Instantiates a new entity prefab into the world at specified position.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Spawn Prefab',
          headerColor: '#E91E63',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'prefab', label: 'Prefab Name', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'pos_x', label: 'Pos X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'pos_y', label: 'Pos Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'layer_id', label: 'Layer ID', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'zindex', label: 'Z-Index', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'custom_id', label: 'Custom ID', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'entity', label: 'Entity ID', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            prefab: '',
            pos_x: 0,
            pos_y: 0,
            layer_id: '',
            zindex: 0,
            custom_id: ''
          },
          code: 
`const prefabName = inputs['Prefab Name'] ?? inputs['prefab'] ?? node.data?.values?.prefabName;
const posX = Number(inputs['Pos X'] ?? inputs['pos_x'] ?? 0);
const posY = Number(inputs['Pos Y'] ?? inputs['pos_y'] ?? 0);
const layerScriptId = inputs['Layer ID'] ?? inputs['layer_id'];
const zIndex = Number(inputs['Z-Index'] ?? inputs['zindex'] ?? 0);
const customScriptId = inputs['Custom ID'] ?? inputs['custom_id'] ?? node.data?.values?.custom_id;

let newEntity = null;
const spawnFn = context.prefab?.spawn || context.game?.spawnPrefab || context.game?.prefabSystem?.spawnPrefab;
if (typeof spawnFn === 'function') {
  newEntity = spawnFn(prefabName, posX, posY, layerScriptId, zIndex, customScriptId);
}

const entityId = newEntity ? newEntity.scriptId : null;
outputs['Entity ID'] = entityId;
outputs['entity'] = entityId;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'entity_destroy',
      label: 'Destroy Entity',
      description: 'Removes an entity from the world.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy Entity',
          headerColor: '#D32F2F',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'entity', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { entity: 'self' },
          code: 
`const targetScriptId = inputs['Target Entity'] ?? inputs['entity'] ?? 'self';
const getEntityFn = context.entity?.get || context.getEntity;
let targetEntity = typeof getEntityFn === 'function' ? getEntityFn(targetScriptId) : null;

// Validasi guard: Jika ID bukan 'self', pastikan entitas yang ditemukan benar-benar cocok
if (targetEntity && targetScriptId !== 'self' && targetScriptId !== '') {
  const matches = targetEntity.id === targetScriptId || 
                  targetEntity.scriptId === targetScriptId || 
                  (targetEntity.name && targetEntity.name.toLowerCase() === String(targetScriptId).toLowerCase());
  if (!matches) {
    targetEntity = null;
  }
}

const destroyFn = context.entity?.destroy || context.game?.destroyEntity || context.game?.entitySystem?.destroyEntity;
if (targetEntity && typeof destroyFn === 'function') {
  destroyFn(targetEntity);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'entity_destroy_with_parent',
      label: 'Destroy With Parent',
      description: 'Destroys the top-level parent entity if available, otherwise destroys target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy With Parent',
          headerColor: '#D32F2F',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'entity', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { entity: 'self' },
          code: 
`const targetScriptId = inputs['Target Entity'] ?? inputs['entity'] ?? 'self';
const getEntityFn = context.entity?.get || context.getEntity;
let targetEntity = typeof getEntityFn === 'function' ? getEntityFn(targetScriptId) : null;

if (targetEntity && targetScriptId !== 'self' && targetScriptId !== '') {
  const matches = targetEntity.id === targetScriptId || 
                  targetEntity.scriptId === targetScriptId || 
                  (targetEntity.name && targetEntity.name.toLowerCase() === String(targetScriptId).toLowerCase());
  if (!matches) {
    targetEntity = null;
  }
}

const destroyFn = context.entity?.destroy || context.game?.destroyEntity || context.game?.entitySystem?.destroyEntity;

if (targetEntity && typeof destroyFn === 'function') {
  if (targetEntity.parentId) {
    const parentId = targetEntity.parentId;
    const parentEntity = context.game?.world?.entities?.find(e => e.id === parentId);
    
    if (parentEntity) {
      destroyFn(parentEntity);
    } else {
      destroyFn(targetEntity);
    }
  } else {
    destroyFn(targetEntity);
  }
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'entity_clone',
      label: 'Clone Entity',
      description: 'Creates a duplicate of an existing entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Clone Entity',
          headerColor: '#E91E63',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'entity', label: 'Source Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'clone', label: 'Clone ID', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { entity: 'self' },
          code: 
`const sourceScriptId = inputs['Source Entity'] ?? inputs['entity'] ?? 'self';
const getEntityFn = context.entity?.get || context.getEntity;
let sourceEntity = typeof getEntityFn === 'function' ? getEntityFn(sourceScriptId) : null;

if (sourceEntity && sourceScriptId !== 'self' && sourceScriptId !== '') {
  const matches = sourceEntity.id === sourceScriptId || 
                  sourceEntity.scriptId === sourceScriptId || 
                  (sourceEntity.name && sourceEntity.name.toLowerCase() === String(sourceScriptId).toLowerCase());
  if (!matches) {
    sourceEntity = null;
  }
}

let clone = null;
const cloneFn = context.entity?.clone || context.game?.cloneEntity || context.game?.entitySystem?.cloneEntity;

if (sourceEntity && typeof cloneFn === 'function') {
  const res = cloneFn(sourceEntity);
  if (res && typeof res.then === 'function') {
    res.then(cloned => {
      const cloneId = cloned ? cloned.scriptId : null;
      outputs['Clone ID'] = cloneId;
      outputs['clone'] = cloneId;
    });
  } else if (res) {
    clone = res;
  }
}

const cloneId = clone ? clone.scriptId : null;
outputs['Clone ID'] = cloneId;
outputs['clone'] = cloneId;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'entity_get_children',
      label: 'Get Entity Children',
      description: 'Retrieves all child entities or a specific child by index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Entity Children',
          headerColor: '#8E24AA',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'parent', label: 'Parent Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'index', label: 'Child Index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'children', label: 'Children IDs', dataType: 'list', color: '#4DD0E1' },
          { id: 'child_id', label: 'Child ID', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { parent: 'self', index: 0 },
          code: 
`const parentScriptId = inputs['Parent Entity'] ?? inputs['parent'] ?? 'self';
const indexVal = inputs['Child Index'] ?? inputs['index'];

const getEntityFn = context.entity?.get || context.getEntity;
let parentEntity = typeof getEntityFn === 'function' ? getEntityFn(parentScriptId) : null;

if (parentEntity && parentScriptId !== 'self' && parentScriptId !== '') {
  const matches = parentEntity.id === parentScriptId || 
                  parentEntity.scriptId === parentScriptId || 
                  (parentEntity.name && parentEntity.name.toLowerCase() === String(parentScriptId).toLowerCase());
  if (!matches) {
    parentEntity = null;
  }
}

let childrenIds = [];
let specificChildId = null;

if (parentEntity) {
  const parentInternalId = parentEntity.id;
  const entities = context.game?.world?.entities || [];
  const children = entities.filter(e => e.parentId === parentInternalId);
  
  childrenIds = children.map(c => c.scriptId).filter(id => id != null);
  
  if (indexVal !== undefined && indexVal !== null && !isNaN(indexVal)) {
    const parsedIndex = Math.floor(Number(indexVal));
    if (parsedIndex >= 0 && parsedIndex < childrenIds.length) {
      specificChildId = childrenIds[parsedIndex];
    }
  }
}

outputs['Children IDs'] = childrenIds;
outputs['children'] = childrenIds;
outputs['Child ID'] = specificChildId;
outputs['child_id'] = specificChildId;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'entity_get_parent',
      label: 'Get Entity Parent',
      description: 'Retrieves the parent entity ID of the target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Entity Parent',
          headerColor: '#8E24AA',
          category: 'Entity Management'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'entity', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'parent_id', label: 'Parent ID', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { entity: 'self' },
          code: 
`const childScriptId = inputs['Target Entity'] ?? inputs['entity'] ?? 'self';
const getEntityFn = context.entity?.get || context.getEntity;
let childEntity = typeof getEntityFn === 'function' ? getEntityFn(childScriptId) : null;

if (childEntity && childScriptId !== 'self' && childScriptId !== '') {
  const matches = childEntity.id === childScriptId || 
                  childEntity.scriptId === childScriptId || 
                  (childEntity.name && childEntity.name.toLowerCase() === String(childScriptId).toLowerCase());
  if (!matches) {
    childEntity = null;
  }
}

let parentScriptId = null;

if (childEntity && childEntity.parentId && context.game?.world?.entities) {
  const parentInternalId = childEntity.parentId;
  const parentEntity = context.game.world.entities.find(e => e.id === parentInternalId);
  
  if (parentEntity && parentEntity.scriptId) {
    parentScriptId = parentEntity.scriptId;
  }
}

outputs['Parent ID'] = parentScriptId;
outputs['parent_id'] = parentScriptId;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};