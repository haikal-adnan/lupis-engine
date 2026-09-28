import { BoxSelect, ScanLine, Tag } from 'lucide-vue-next';

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
      icon: BoxSelect,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Solid Collision', headerColor: '#D32F2F', category: 'Physics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target', dataType: 'string', color: '#FFB74D', defaultValue: 'self' },
          { id: 'filter_tag', label: 'Filter Tag', dataType: 'string', color: '#FFB74D', icon: Tag }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'on_hit', label: 'On Hit', dataType: 'execution', color: '#FF5252' },
          { id: 'is_colliding', label: 'Is Colliding?', dataType: 'boolean', color: '#69F0AE' },
          { id: 'self_id', label: 'Self ID', dataType: 'string', color: '#FFB74D' },
          { id: 'hit_id', label: 'Hit ID', dataType: 'string', color: '#FFB74D' }
        ],
        data: {
        code: `const rawTarget = inputs['target'] || inputs['Target'] || 'self';
const filterTag = inputs['filter_tag'] || inputs['Filter Tag'];

const entity = context.entity.get(rawTarget);

if (!entity) {
  outputs['is_colliding'] = false;
  outputs['Is Colliding?'] = false;
  outputs['self_id'] = null;
  outputs['hit_id'] = null;
  outputs['exec_out'] = true;
  return;
}

let hitObject = context.game.colliderSystem.checkSolid(entity);

if (hitObject && filterTag && typeof filterTag === 'string' && filterTag.trim() !== "") {
  const objTag = hitObject.tag || hitObject.components?.Tags?.value;
  if (objTag !== filterTag) {
    hitObject = null;
  }
}

const selfScriptId = entity.scriptId || entity.script_id || entity.id;
const hitScriptId = hitObject ? (hitObject.scriptId || hitObject.script_id || hitObject.id) : null;
const isColliding = !!hitObject;

outputs['self_id'] = selfScriptId;
outputs['Self ID'] = selfScriptId;
outputs['hit_id'] = hitScriptId;
outputs['Hit ID'] = hitScriptId;
outputs['is_colliding'] = isColliding;
outputs['Is Colliding?'] = isColliding;

outputs['exec_out'] = true;
outputs['Out'] = true;

if (isColliding) {
  outputs['on_hit'] = true;
  outputs['On Hit'] = true;
}
return;`
        }
      } 
    },
    { 
      type: 'trigger_zone', 
      label: 'Trigger Zone', 
      description: 'Detects when an object enters, stays, or exits an area.', 
      icon: ScanLine,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Trigger Zone', headerColor: '#0097A7', category: 'Physics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target', dataType: 'string', color: '#FFB74D', defaultValue: 'self' },
          { id: 'filter_tag', label: 'Filter Tag', dataType: 'string', color: '#FFB74D', icon: Tag }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'on_enter', label: 'On Enter', dataType: 'execution', color: '#69F0AE' },
          { id: 'on_exit', label: 'On Exit', dataType: 'execution', color: '#FFAB91' },
          { id: 'is_inside', label: 'Is Inside?', dataType: 'boolean', color: '#69F0AE' },
          { id: 'trigger_id', label: 'Trigger ID', dataType: 'string', color: '#FFB74D' },
          { id: 'other_id', label: 'Other ID', dataType: 'string', color: '#FFB74D' }
        ],
        data: {
        code: `const targetId = inputs['target'] || inputs['Target'] || 'self';
const filterTag = inputs['filter_tag'] || inputs['Filter Tag'];

const entity = context.entity.get(targetId);

if (!entity) {
  outputs['is_inside'] = false;
  outputs['Is Inside?'] = false;
  outputs['trigger_id'] = null;
  outputs['other_id'] = null;
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

outputs['trigger_id'] = triggerScriptId;
outputs['Trigger ID'] = triggerScriptId;
outputs['other_id'] = currentId || previousId;
outputs['Other ID'] = currentId || previousId;
outputs['is_inside'] = isCurrentlyOverlapping;
outputs['Is Inside?'] = isCurrentlyOverlapping;

if (!previousId && currentId) {
  myState.lastId = currentId;
  outputs['on_enter'] = true;
} else if (previousId && currentId && previousId !== currentId) {
  myState.lastId = currentId;
  outputs['on_enter'] = true;
} else if (previousId && !currentId) {
  myState.lastId = null;
  outputs['other_id'] = previousId;
  outputs['Other ID'] = previousId;
  outputs['is_inside'] = false;
  outputs['Is Inside?'] = false;
  outputs['on_exit'] = true;
}

myState.isOverlapping = isCurrentlyOverlapping;
outputs['exec_out'] = true;
return;`
        }
      } 
    }
  ]
};