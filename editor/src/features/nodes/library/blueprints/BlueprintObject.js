import { Box } from 'lucide-vue-next';

export const BlueprintObject = {
  id: 'game_object_basic',
  label: 'Basic Object',
  color: '#00BCD4',
  icon: Box,
  items: [
    {
      type: 'get_object',
      label: 'Get Object Info',
      description: 'Get entity info like Entity ID, Name, Tag, Active, Visible',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Object',
          headerColor: '#00838F',
          category: 'Basic Object'
        },
        inputs: [
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'entityId', label: 'Entity ID', type: 'string', color: '#F48FB1' },
            { value: 'name', label: 'Name', type: 'string', color: '#F48FB1' },
            { value: 'tagName', label: 'Tag Name', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity) {
  const entityIdVal = entity.scriptId || entity.id || null;
  const nameVal = entity.name || 'Unknown';
  const tagVal = entity.tag || 'Untagged';
  const activeVal = Boolean(entity.active);
  const visibleVal = Boolean(entity.visible);

  outputs['Entity ID'] = entityIdVal;
  outputs['entityId'] = entityIdVal;
  outputs['Name'] = nameVal;
  outputs['name'] = nameVal;
  outputs['Tag Name'] = tagVal;
  outputs['tagName'] = tagVal;
  outputs['Active'] = activeVal;
  outputs['active'] = activeVal;
  outputs['Visible'] = visibleVal;
  outputs['visible'] = visibleVal;
}
return;`
        }
      }
    },
    {
      type: 'set_object',
      label: 'Set Object Info',
      description: 'Set entity info like Name, Tag, Active, Visible',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Object',
          headerColor: '#00838F',
          category: 'Basic Object'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#F48FB1' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#F48FB1' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' }
          ],
          code: 
`const targetId = inputs['Target Entity'] ?? inputs['target_in'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity) {
  const newName = inputs['Name'] ?? inputs['name'];
  const newTag = inputs['Tag'] ?? inputs['tag'];
  const newActive = inputs['Active'] ?? inputs['active'];
  const newVisible = inputs['Visible'] ?? inputs['visible'];

  if (newName !== undefined && newName !== null && newName !== '') {
    entity.name = String(newName);
  }
  if (newTag !== undefined && newTag !== null && newTag !== '') {
    entity.tag = String(newTag);
  }
  if (newActive !== undefined && newActive !== null) {
    entity.active = Boolean(newActive);
  }
  if (newVisible !== undefined && newVisible !== null) {
    entity.visible = Boolean(newVisible);
  }
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'find_closest_by_tag',
      label: 'Find Closest By Tag',
      description: 'Finds the nearest active entity with a specific tag relative to a 2D position',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Find Closest Tag',
          headerColor: '#00838F',
          category: 'Basic Object'
        },
        inputs: [
          { id: 'tag', label: 'Tag', dataType: 'string', color: '#F48FB1', defaultValue: 'Enemy' },
          { id: 'from_x', label: 'From X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'from_y', label: 'From Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'target_id', label: 'Target ID', dataType: 'string', color: '#F48FB1' },
          { id: 'found', label: 'Found', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { tag: 'Enemy', from_x: 0, from_y: 0 },
          code: 
`const targetTag = inputs['Tag'] ?? inputs['tag'];
const fromX = Number(inputs['From X'] ?? inputs['from_x'] ?? 0);
const fromY = Number(inputs['From Y'] ?? inputs['from_y'] ?? 0);

const entities = context.game?.world?.entities || [];
let closestId = null;
let minDistanceSq = Infinity;

for (let i = 0; i < entities.length; i++) {
  const other = entities[i];
  if (other.active === false) continue;

  const otherTag = other.tag || other.components?.Tags?.value;
  if (otherTag !== targetTag) continue;

  const t = other.components?.Transform;
  if (!t) continue;

  const dx = t.x - fromX;
  const dy = t.y - fromY;
  const distSq = (dx * dx) + (dy * dy);

  if (distSq < minDistanceSq) {
    minDistanceSq = distSq;
    closestId = other.scriptId || other.id;
  }
}

const isFound = closestId !== null;
outputs['Target ID'] = closestId;
outputs['target_id'] = closestId;
outputs['Found'] = isFound;
outputs['found'] = isFound;
return;`
        }
      }
    }
  ]
};