import { BoxSelect } from 'lucide-vue-next';

export const BlueprintCollider = {
  id: 'game_physics',
  label: 'Collider System',
  color: '#FF9800',
  icon: BoxSelect,
  items: [
    {
      type: 'solid_collision',
      label: 'Solid Collision',
      description: 'Check if an object is hitting a solid wall or obstacle.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Solid Collision',
          headerColor: '#D32F2F',
          category: 'Collider System'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'filter_tag', label: 'Filter Tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'on_hit', label: 'On Hit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'is_colliding', label: 'Is Colliding?', dataType: 'boolean', color: '#E57373' },
          { id: 'self_id', label: 'Self ID', dataType: 'string', color: '#F48FB1' },
          { id: 'hit_id', label: 'Hit ID', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            target: 'self',
            filter_tag: ''
          },
          code: 
`const rawTarget = inputs['Target'] ?? inputs['target'] ?? 'self';
const filterTag = inputs['Filter Tag'] ?? inputs['filter_tag'];

const entity = context.entity.get(rawTarget);

if (!entity) {
  outputs['Is Colliding?'] = false;
  outputs['is_colliding'] = false;
  outputs['Self ID'] = null;
  outputs['self_id'] = null;
  outputs['Hit ID'] = null;
  outputs['hit_id'] = null;
  outputs['Out'] = true;
  outputs['exec_out'] = true;
  return;
}

let hitObject = context.game.colliderSystem.checkSolid(entity);

if (hitObject && filterTag && typeof filterTag === 'string' && filterTag.trim() !== '') {
  const objTag = hitObject.tag || hitObject.components?.Tags?.value;
  if (objTag !== filterTag) {
    hitObject = null;
  }
}

const selfScriptId = entity.scriptId || entity.script_id || entity.id;
const hitScriptId = hitObject ? (hitObject.scriptId || hitObject.script_id || hitObject.id) : null;
const isColliding = !!hitObject;

outputs['Self ID'] = selfScriptId;
outputs['self_id'] = selfScriptId;
outputs['Hit ID'] = hitScriptId;
outputs['hit_id'] = hitScriptId;
outputs['Is Colliding?'] = isColliding;
outputs['is_colliding'] = isColliding;

outputs['Out'] = true;
outputs['exec_out'] = true;

if (isColliding) {
  outputs['On Hit'] = true;
  outputs['on_hit'] = true;
}
return;`
        }
      }
    },
    {
      type: 'trigger_zone',
      label: 'Trigger Zone',
      description: 'Detects when an object enters, stays, or exits an area.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Trigger Zone',
          headerColor: '#0097A7',
          category: 'Collider System'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'filter_tag', label: 'Filter Tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'on_enter', label: 'On Enter', dataType: 'execution', color: '#FFFFFF' },
          { id: 'on_exit', label: 'On Exit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'is_inside', label: 'Is Inside?', dataType: 'boolean', color: '#E57373' },
          { id: 'trigger_id', label: 'Trigger ID', dataType: 'string', color: '#F48FB1' },
          { id: 'other_id', label: 'Other ID', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            target: 'self',
            filter_tag: ''
          },
          code: 
`const targetId = inputs['Target'] ?? inputs['target'] ?? 'self';
const filterTag = inputs['Filter Tag'] ?? inputs['filter_tag'];

const entity = context.entity.get(targetId);

if (!entity) {
  outputs['Is Inside?'] = false;
  outputs['is_inside'] = false;
  outputs['Trigger ID'] = null;
  outputs['trigger_id'] = null;
  outputs['Other ID'] = null;
  outputs['other_id'] = null;
  outputs['Out'] = true;
  outputs['exec_out'] = true;
  return;
}

if (!node._triggerStates) {
  node._triggerStates = {};
}

const entityId = entity.id || entity._id;
let myState = node._triggerStates[entityId];
if (!myState) {
  myState = { isOverlapping: false, lastId: null };
  node._triggerStates[entityId] = myState;
}

let overlapObject = context.game.colliderSystem.checkOverlap(entity, filterTag);

const triggerScriptId = entity.scriptId || entity.script_id || entity.id;
const currentId = overlapObject 
  ? (overlapObject.scriptId || overlapObject.script_id || overlapObject.id) 
  : null;

const previousId = myState.lastId;
const isCurrentlyOverlapping = !!currentId;

outputs['Trigger ID'] = triggerScriptId;
outputs['trigger_id'] = triggerScriptId;
outputs['Other ID'] = currentId || previousId;
outputs['other_id'] = currentId || previousId;
outputs['Is Inside?'] = isCurrentlyOverlapping;
outputs['is_inside'] = isCurrentlyOverlapping;

if (!previousId && currentId) {
  myState.lastId = currentId;
  outputs['On Enter'] = true;
  outputs['on_enter'] = true;
} else if (previousId && currentId && previousId !== currentId) {
  myState.lastId = currentId;
  outputs['On Enter'] = true;
  outputs['on_enter'] = true;
} else if (previousId && !currentId) {
  myState.lastId = null;
  outputs['Other ID'] = previousId;
  outputs['other_id'] = previousId;
  outputs['Is Inside?'] = false;
  outputs['is_inside'] = false;
  outputs['On Exit'] = true;
  outputs['on_exit'] = true;
}

myState.isOverlapping = isCurrentlyOverlapping;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};