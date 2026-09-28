import { 
  Box, 
  PlusCircle, 
  Trash2, 
  Copy, 
  ListTree, 
  FolderTree,
  Tag
} from 'lucide-vue-next';

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
      icon: PlusCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Spawn Prefab', headerColor: '#E91E63', category: 'Entity' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'prefab', label: 'Prefab Name', dataType: 'string', color: '#FFB74D' },
          { id: 'pos_x', label: 'Pos X', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'pos_y', label: 'Pos Y', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'layer_id', label: 'Layer ID', dataType: 'string', color: '#FFB74D' },
          { id: 'zindex', label: 'Z-Index', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'custom_id', label: 'Custom ID', dataType: 'string', color: '#FFB74D' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'entity', label: 'Entity ID', dataType: 'string', color: '#fbbf24' }
        ],
        data: {
          code: `const prefabName = inputs['Prefab Name'] || node.data?.values?.prefabName;
const posX = Number(inputs['Pos X']) || 0;
const posY = Number(inputs['Pos Y']) || 0;
const layerScriptId = inputs['Layer ID'];
const zIndex = Number(inputs['Z-Index']) || 0;
const customScriptId = inputs['Custom ID'] || node.data?.values?.custom_id;

let newEntity = null;
if (context.game && typeof context.game.spawnPrefab === 'function') {
  newEntity = context.game.spawnPrefab(prefabName, posX, posY, layerScriptId, zIndex, customScriptId);
}

outputs['Entity ID'] = newEntity ? newEntity.scriptId : null;
outputs['Out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'entity_destroy', 
      label: 'Destroy Entity', 
      description: 'Removes an entity from the world.',
      icon: Trash2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Destroy Entity', headerColor: '#D32F2F', category: 'Entity' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'entity', label: 'Target Entity', dataType: 'string', color: '#fbbf24', defaultValue: 'self' }
        ],
        outputs: [{ id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }],
        data: {
          code: `const targetScriptId = inputs['Target Entity'];
const targetEntity = context.getEntity(targetScriptId);

if (targetEntity && context.game && typeof context.game.destroyEntity === 'function') {
  context.game.destroyEntity(targetEntity);
}

outputs['Out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'entity_destroy_with_parent', 
      label: 'Destroy With Parent', 
      description: 'Destroys the top-level parent entity if available, otherwise destroys target entity.',
      icon: Trash2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Destroy With Parent', headerColor: '#D32F2F', category: 'Entity' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'entity', label: 'Target Entity', dataType: 'string', color: '#fbbf24', defaultValue: 'self' }
        ],
        outputs: [{ id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }],
        data: {
          code: `const targetScriptId = inputs['Target Entity'];
const targetEntity = context.getEntity(targetScriptId);

if (targetEntity && context.game && typeof context.game.destroyEntity === 'function') {
  if (targetEntity.parentId) {
    const parentId = targetEntity.parentId;
    const parentEntity = context.game.world?.entities?.find(e => e.id === parentId);
    
    if (parentEntity) {
      context.game.destroyEntity(parentEntity);
    } else {
      context.game.destroyEntity(targetEntity);
    }
  } else {
    context.game.destroyEntity(targetEntity);
  }
}

outputs['Out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'entity_clone', 
      label: 'Clone Entity', 
      description: 'Creates a duplicate of an existing entity.',
      icon: Copy,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Clone Entity', headerColor: '#E91E63', category: 'Entity' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'entity', label: 'Source Entity', dataType: 'string', color: '#fbbf24', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'clone', label: 'Clone ID', dataType: 'string', color: '#fbbf24' }
        ],
        data: {
          code: `const sourceScriptId = inputs['Source Entity'];
const sourceEntity = context.getEntity(sourceScriptId);
let clone = null;

if (sourceEntity && context.game && typeof context.game.cloneEntity === 'function') {
  clone = await context.game.cloneEntity(sourceEntity);
}

outputs['Clone ID'] = clone ? clone.scriptId : null;
outputs['Out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'entity_get_children', 
      label: 'Get Entity Children', 
      description: 'Retrieves all child entities or a specific child by index.',
      icon: ListTree,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Entity Children', headerColor: '#8E24AA', category: 'Entity' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'parent', label: 'Parent Entity', dataType: 'string', color: '#fbbf24', defaultValue: 'self' },
          { id: 'index', label: 'Child Index', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'children', label: 'Children IDs', dataType: 'any', color: '#FFB74D' },
          { id: 'child_id', label: 'Child ID', dataType: 'string', color: '#fbbf24' }
        ],
        data: {
          code: `const parentScriptId = inputs['Parent Entity'];
const indexVal = inputs['Child Index'];

const parentEntity = context.getEntity(parentScriptId);

let childrenIds = [];
let specificChildId = null;

if (parentEntity && context.game?.world) {
  const parentInternalId = parentEntity.id;
  const children = context.game.world.entities.filter(e => e.parentId === parentInternalId);
  
  childrenIds = children.map(c => c.scriptId).filter(id => id != null);
  
  if (indexVal !== undefined && indexVal !== null && !isNaN(indexVal)) {
    const parsedIndex = Math.floor(Number(indexVal));
    if (parsedIndex >= 0 && parsedIndex < childrenIds.length) {
      specificChildId = childrenIds[parsedIndex];
    }
  }
}

outputs['Children IDs'] = childrenIds;
outputs['Child ID'] = specificChildId;
outputs['Out'] = true;
return;`
        }
      } 
    },
    { 
      type: 'entity_get_parent', 
      label: 'Get Entity Parent', 
      description: 'Retrieves the parent entity ID of the target entity.',
      icon: FolderTree,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Entity Parent', headerColor: '#8E24AA', category: 'Entity' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'entity', label: 'Target Entity', dataType: 'string', color: '#fbbf24', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'parent_id', label: 'Parent ID', dataType: 'string', color: '#fbbf24' }
        ],
        data: {
          code: `const childScriptId = inputs['Target Entity'];
const childEntity = context.getEntity(childScriptId);

let parentScriptId = null;

if (childEntity && childEntity.parentId && context.game?.world) {
  const parentInternalId = childEntity.parentId;
  const parentEntity = context.game.world.entities.find(e => e.id === parentInternalId);
  
  if (parentEntity && parentEntity.scriptId) {
    parentScriptId = parentEntity.scriptId;
  }
}

outputs['Parent ID'] = parentScriptId;
outputs['Out'] = true;
return;`
        }
      } 
    }
  ]
};