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
      description: 'Instantiates a new entity prefab into the world at specified position.',
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
      description: 'Removes an entity from the world.',
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
  context.entity.destroy(topParent.scriptId);
} else {
  context.entity.destroy(entity.scriptId);
}
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'entityClone',
      label: 'Clone Entity',
      description: 'Creates a duplicate of an existing entity.',
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
      description: 'Retrieves all child entities or a specific child by index.',
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
      description: 'Get entity info like Entity ID, Name, Tag, Active, Visible',
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
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

outputs.entityId = entity.scriptId;
outputs.tagName = entity.tag;
outputs.active = entity.active;
outputs.visible = entity.visible;
return;`
        }
      }
    },
{
      type: 'setObject',
      label: 'Set Object Info',
      description: 'Set entity info like Tag, Active, Visible',
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
    entity[key] = inputs[key];
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
      description: 'Finds the nearest active entity with a specific tag relative to a 2D position',
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
      type: 'getTransform',
      label: 'Get Transform',
      description: 'Get specific transform properties of Self or Target.',
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
      description: 'Teleport or modify absolute transform properties.',
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
      description: 'Get layer info like ID, Name, Visible, Locked, Z-Index, Opacity',
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
      description: 'Set layer info like Visible, Locked, Z-Index, Opacity',
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
    }
  ]
};
