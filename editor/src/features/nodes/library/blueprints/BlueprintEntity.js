import { Box } from 'lucide-vue-next';

export const BlueprintEntity = {
  id: 'game_entity',
  label: 'Entity & Transform',
  color: '#64B5F6',
  icon: Box,
  items: [
{
      type: 'entitySpawn',
      label: 'Spawn Prefab',
      description: 'Instantiates a prefab entity into the scene at a specified position and layer.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Spawn Prefab',
          headerColor: '#E91E63',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'prefabName', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'x', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'layerId', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'zIndex', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'customId', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            prefabName: '',
            x: 0,
            y: 0,
            layerId: '',
            zIndex: 0,
            customId: ''
          },
          code: 
`const newEntity = context.prefab.spawn(inputs.prefabName, inputs.x, inputs.y, inputs.layerId, inputs.zIndex, inputs.customId);
outputs.targetEntity = newEntity ? newEntity.scriptId : '';
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'entityDestroy',
      label: 'Destroy Entity',
      description: 'Destroys an entity and removes it from the active scene.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy Entity',
          headerColor: '#D32F2F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'destroyParent', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            destroyParent: false
          },
          code: 
`const target = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(target), 'Target entity must exist');
if (inputs.destroyParent && entity.parentId) {
  let topParent = entity;
  while (topParent.parentId) {
    const parent = context.entity.get(topParent.parentId);
    if (parent) {
      topParent = parent;
    } else {
      break;
    }
  }
  context.entity.destroy(topParent);
} else {
  context.entity.destroy(entity);
}
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'entityDestroyByTag',
      label: 'Destroy Entities by Tag',
      description: 'Destroys all active entities matching the specified tag.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy by Tag',
          headerColor: '#D32F2F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'count', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: {
            tag: ''
          },
          code: 
`const tag = inputs.tag;
const count = context.entity && typeof context.entity.destroyByTag === 'function' ? context.entity.destroyByTag(tag) : 0;
outputs.count = count;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'entityClone',
      label: 'Clone Entity',
      description: 'Creates an exact clone of an existing entity with all its components.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Clone Entity',
          headerColor: '#E91E63',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'sourceEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { sourceEntity: 'self' },
          code: 
`const sourceEntity = context.entity.get(inputs.sourceEntity);
const res = context.entity.clone(sourceEntity);
outputs.targetEntity = res ? res.scriptId : '';
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'entityGetChildren',
      label: 'Get Entity Children',
      description: 'Retrieves all child entity IDs or a specific child entity by index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Entity Children',
          headerColor: '#8E24AA',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'childEntities', dataType: 'list', color: '#4DD0E1' },
          { id: 'childEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { targetEntity: 'self', index: 0 },
          code: 
`const parentEntity = context.entity.get(inputs.targetEntity);
const children = context.entity.getChildren(parentEntity);
const childrenIds = children.map(c => c.scriptId);
const indexVal = Math.floor(inputs.index);

outputs.childEntities = childrenIds;
outputs.childEntity = (indexVal >= 0 && indexVal < childrenIds.length) ? childrenIds[indexVal] : '';
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityGetChildByName',
      label: 'Get Child By Name',
      description: 'Finds a child entity under a parent by its name or prefab origin.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Child By Name',
          headerColor: '#8E24AA',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'childName', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'childEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'found', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { targetEntity: 'self', childName: '' },
          code:
`const targetEntity = inputs.targetEntity;
const childName = inputs.childName;

let matched = '';
if (context.entity && typeof context.entity.getChildByName === 'function') {
  const child = context.entity.getChildByName(targetEntity, childName);
  if (child) matched = child.scriptId || child.id || '';
} else if (context.entity && typeof context.entity.getChildren === 'function') {
  const parent = context.entity.get(targetEntity);
  const children = context.entity.getChildren(parent);
  const search = String(childName || '').trim().toLowerCase();
  if (search && children) {
    const item = children.find(c => {
      const sId = String(c.scriptId || '').toLowerCase();
      return sId === search || sId.startsWith(search + '_');
    });
    if (item) matched = item.scriptId || item.id || '';
  }
}

outputs.childEntity = matched;
outputs.found = Boolean(matched);
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityGetParent',
      label: 'Get Entity Parent',
      description: 'Retrieves the parent entity ID of the target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Entity Parent',
          headerColor: '#8E24AA',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'parentEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: { targetEntity: 'self' },
          code: 
`const childEntity = context.entity.get(inputs.targetEntity);
const parent = context.entity.getParent(childEntity);
outputs.parentEntity = parent ? parent.scriptId : '';
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getObject',
      label: 'Get Object Info',
      description: 'Retrieves entity metadata including ID, name, tag, active state, and visibility.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Object',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            targetEntity: 'self'
          },
          propertyOptions: [
            { value: 'entityId', label: 'Entity ID', type: 'string', color: '#F48FB1' },
            { value: 'tagName', label: 'Tag Name', type: 'string', color: '#F48FB1' },
            { value: 'tags', label: 'Tags', type: 'list', color: '#4DD0E1' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

outputs.entityId = entity.scriptId;
outputs.tagName = entity.tag;
outputs.tags = Array.isArray(entity.tags) ? [...entity.tags] : (entity.tag && entity.tag !== 'untagged' ? [entity.tag] : []);
outputs.active = entity.active;
outputs.visible = entity.visible;
return;`
        }
      }
    },
{
      type: 'setObject',
      label: 'Set Object Info',
      description: 'Updates entity metadata including tag, active state, and visibility.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Object',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self'
          },
          propertyOptions: [
            { value: 'tag', label: 'Tag', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

const propKeys = ['tag', 'active', 'visible'];
for (const key of propKeys) {
  if (key in inputs) {
    if (key === 'tag') {
      entity.tag = inputs.tag;
    } else {
      entity[key] = inputs[key];
    }
  }
}

outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'findClosestByTag',
      label: 'Find Closest By Tag',
      description: 'Finds the nearest active entity with a specific tag relative to a 2D position.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Find Closest Tag',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: 'Enemy' },
          { id: 'fromX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'fromY', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'found', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { tag: 'Enemy', fromX: 0, fromY: 0 },
          code: 
`const closest = context.entity.findClosestByTag(inputs.tag, inputs.fromX, inputs.fromY);

outputs.targetEntity = closest ? closest.scriptId : '';
outputs.found = Boolean(closest);
return;`
        }
      }
    },
    {
      type: 'entityCountByTag',
      label: 'Count Entities by Tag',
      description: 'Returns the total number of active entities in the scene with a specific tag.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Count by Tag',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: 'Enemy' }
        ],
        outputs: [
          { id: 'count', dataType: 'number', color: '#64B5F6' },
          { id: 'hasAny', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { tag: 'Enemy' },
          code: 
`const tag = inputs.tag;
const count = context.entity && typeof context.entity.countByTag === 'function'
  ? context.entity.countByTag(tag)
  : (context.entity && typeof context.entity.getAllByTag === 'function' ? context.entity.getAllByTag(tag).length : 0);

outputs.count = count;
outputs.hasAny = count > 0;
return;`
        }
      }
    },
    {
      type: 'entityHasTag',
      label: 'Entity Has Tag',
      description: 'Checks whether an entity has a specific tag assigned.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Has Tag',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: 'Enemy' }
        ],
        outputs: [
          { id: 'hasTag', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { targetEntity: 'self', tag: 'Enemy' },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const tag = inputs.tag;
const match = typeof entity.hasTag === 'function'
  ? entity.hasTag(tag)
  : (Array.isArray(entity.tags) ? entity.tags.some(t => String(t).trim().toLowerCase() === String(tag).trim().toLowerCase()) : String(entity.tag || '').trim().toLowerCase() === String(tag).trim().toLowerCase());

outputs.hasTag = Boolean(match);
return;`
        }
      }
    },
    {
      type: 'entityGetAllByTag',
      label: 'Get All Entities by Tag',
      description: 'Retrieves all active entity IDs in the scene matching a specific tag as a list.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get All by Tag',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: 'Enemy' }
        ],
        outputs: [
          { id: 'entities', dataType: 'list', color: '#4DD0E1' },
          { id: 'count', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { tag: 'Enemy' },
          code: 
`const tag = inputs.tag;
const list = context.entity && typeof context.entity.getAllByTag === 'function'
  ? context.entity.getAllByTag(tag)
  : [];

outputs.entities = list.map(e => e.scriptId || e.id);
outputs.count = list.length;
return;`
        }
      }
    },
    {
      type: 'entityAddTag',
      label: 'Add Tag to Entity',
      description: 'Adds a tag to the target entity at runtime.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Add Tag',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'success', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { targetEntity: 'self', tag: '' },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const tag = inputs.tag;
let success = false;
if (typeof entity.addTag === 'function') {
  success = entity.addTag(tag);
} else {
  if (!Array.isArray(entity.tags)) entity.tags = entity.tag && entity.tag !== 'untagged' ? [entity.tag] : [];
  const clean = String(tag || '').trim().replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  if (clean && !entity.tags.some(t => t.toLowerCase() === clean.toLowerCase())) {
    entity.tags.push(clean);
    entity.tag = entity.tags[0];
    success = true;
  }
}

outputs.success = success;
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'entityRemoveTag',
      label: 'Remove Tag from Entity',
      description: 'Removes a tag from the target entity at runtime.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Remove Tag',
          headerColor: '#00838F',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'success', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { targetEntity: 'self', tag: '' },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
const tag = inputs.tag;
let success = false;
if (typeof entity.removeTag === 'function') {
  success = entity.removeTag(tag);
} else {
  if (Array.isArray(entity.tags)) {
    const targetLower = String(tag || '').trim().toLowerCase();
    const prevLen = entity.tags.length;
    entity.tags = entity.tags.filter(t => t.toLowerCase() !== targetLower);
    entity.tag = entity.tags[0] || 'untagged';
    success = entity.tags.length !== prevLen;
  }
}

outputs.success = success;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getTransform',
      label: 'Get Transform',
      description: 'Retrieves transform properties (position, rotation, scale, z-index) of an entity.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Transform',
          headerColor: '#64B5F6',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#64B5F6' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#64B5F6' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#64B5F6' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#64B5F6' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#64B5F6' },
            { value: 'width', label: 'Width', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Height', type: 'number', color: '#64B5F6' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#64B5F6' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#64B5F6' },
            { value: 'anchorX', label: 'Anchor X', type: 'number', color: '#64B5F6' },
            { value: 'anchorY', label: 'Anchor Y', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

outputs.x = t.x;
outputs.y = t.y;
outputs.rotation = t.rotation;
outputs.scaleX = t.scaleX;
outputs.scaleY = t.scaleY;
outputs.width = t.width;
outputs.height = t.height;
outputs.pivotX = t.pivotX;
outputs.pivotY = t.pivotY;
outputs.anchorX = t.anchorX;
outputs.anchorY = t.anchorY;
return;`
        }
      }
    },
{
      type: 'setTransform',
      label: 'Set Transform',
      description: 'Sets transform properties (position, rotation, scale, z-index) on an entity.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Transform',
          headerColor: '#64B5F6',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { targetEntity: 'self' },
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#64B5F6' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#64B5F6' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#64B5F6' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#64B5F6' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#64B5F6' },
            { value: 'width', label: 'Width', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Height', type: 'number', color: '#64B5F6' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#64B5F6' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#64B5F6' },
            { value: 'anchorX', label: 'Anchor X', type: 'number', color: '#64B5F6' },
            { value: 'anchorY', label: 'Anchor Y', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const t = entity.components.UITransform || context.assert.hasComponent(entity, 'Transform');

const propKeys = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'width', 'height', 'pivotX', 'pivotY', 'anchorX', 'anchorY'];
for (const key of propKeys) {
  if (key in inputs) {
    const val = inputs[key];
    if (val !== '' && !isNaN(val)) {
      t[key] = Number(val);
    }
  }
}

outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'getLayer',
      label: 'Get Layer Info',
      description: 'Retrieves layer properties including name, visibility, locked state, z-index, and opacity.',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Layer',
          headerColor: '#6A1B9A',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'targetLayer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            targetLayer: 'self'
          },
          propertyOptions: [
            { value: 'layerId', label: 'Layer ID', type: 'string', color: '#F48FB1' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#E57373' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#64B5F6' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#64B5F6' },
            { value: 'freezeInput', label: 'Freeze Input', type: 'boolean', color: '#E57373' },
            { value: 'freezeInputType', label: 'Freeze Input Type', type: 'string', color: '#F48FB1' }
          ],
          code: 
`const layer = context.assert.exists(context.layer.get(inputs.targetLayer));

outputs.layerId = layer.scriptId;
outputs.visible = layer.visible;
outputs.active = layer.active;
outputs.locked = layer.locked;
outputs.zIndex = layer.zIndex;
outputs.opacity = Math.round(layer.opacity * 100);
outputs.freezeInput = Boolean(layer.freezeInput);
outputs.freezeInputType = layer.freezeInputType || 'all';
return;`
        }
      }
    },
{
      type: 'setLayer',
      label: 'Set Layer Info',
      description: 'Sets layer properties including visibility, locked state, z-index, and opacity.',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Layer',
          headerColor: '#6A1B9A',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetLayer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetLayer: 'self'
          },
          propertyOptions: [
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#E57373' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#64B5F6' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#64B5F6' },
            { value: 'freezeInput', label: 'Freeze Input', type: 'boolean', color: '#E57373' },
            { value: 'freezeInputType', label: 'Freeze Input Type', type: 'string', color: '#F48FB1' }
          ],
          code: 
`const layer = context.assert.exists(context.layer.get(inputs.targetLayer));

const propKeys = ['visible', 'active', 'locked', 'zIndex', 'freezeInput', 'freezeInputType'];
for (const key of propKeys) {
  if (key in inputs) {
    layer[key] = inputs[key];
  }
}
if ('opacity' in inputs) {
  layer.opacity = Math.max(0, Math.min(100, inputs.opacity)) / 100;
}

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'layerDestroy',
      label: 'Destroy Layer',
      description: 'Removes a layer from the scene, with an option to destroy all its entities.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Destroy Layer',
          headerColor: '#6A1B9A',
          category: 'Entity & Transform'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetLayer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'destroyEntities', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'success', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            targetLayer: 'self',
            destroyEntities: true
          },
          code: 
`const target = inputs.targetLayer;
const destroyEnts = inputs.destroyEntities !== false;
const success = context.layer && typeof context.layer.destroy === 'function'
  ? context.layer.destroy(target, destroyEnts)
  : false;
outputs.success = Boolean(success);
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};
