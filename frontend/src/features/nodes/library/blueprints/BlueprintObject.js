import { Box, Scan, Settings2, Target } from 'lucide-vue-next';

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
      icon: Scan, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Object', headerColor: '#00838F', category: 'General' },
        inputs: [
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [],
        data: {
          values: {
            target_in: 'self',
          },
          propertyOptions: [
            { value: 'entityId', label: 'Entity ID', type: 'string', color: '#FFB74D' },
            { value: 'name', label: 'Name', type: 'string', color: '#FFB74D' },
            { value: 'tagName', label: 'Tag Name', type: 'string', color: '#FFB74D' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#f472b6' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#f472b6' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity) {
    outputs['Entity ID'] = entity.scriptId;
    outputs['Name'] = entity.name || 'Unknown';
    outputs['Tag Name'] = entity.tag || 'Untagged';
    outputs['Active'] = entity.active;
    outputs['Visible'] = entity.visible;
}
return;`
        }
      } 
    },

    { 
      type: 'set_object', 
      label: 'Set Object Info', 
      description: 'Set entity info like Name, Tag, Active, Visible', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Object', headerColor: '#00838F', category: 'General' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target_in: 'self',
          },
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#FFB74D' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#FFB74D' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#f472b6' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#f472b6' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity) {
    const newName = inputs['Name'];
    const newTag = inputs['Tag'];
    const newActive = inputs['Active'];
    const newVisible = inputs['Visible'];

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
return;`
        }
      } 
    },

    { 
      type: 'find_closest_by_tag', 
      label: 'Find Closest By Tag', 
      description: 'Finds the nearest active entity with a specific tag relative to a 2D position', 
      icon: Target,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Find Closest Tag', headerColor: '#00838F', category: 'General' },
        inputs: [
          { id: 'tag', label: 'Tag', dataType: 'string', color: '#FFB74D', defaultValue: 'Enemy' },
          { id: 'from_x', label: 'From X', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'from_y', label: 'From Y', dataType: 'number', color: '#B2FF59', defaultValue: 0 }
        ], 
        outputs: [
          { id: 'target_id', label: 'Target ID', dataType: 'string', color: '#FFB74D' },
          { id: 'found', label: 'Found', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          code: `const targetTag = inputs['Tag'];
const fromX = Number(inputs['From X']) || 0;
const fromY = Number(inputs['From Y']) || 0;

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

outputs['Target ID'] = closestId;
outputs['Found'] = closestId !== null;
return;`
        }
      } 
    }
  ]
};