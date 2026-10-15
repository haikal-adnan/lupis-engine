import { BoxSelect } from 'lucide-vue-next';

export const BlueprintCollider = {
  id: 'game_collider',
  label: 'Collider System',
  color: '#FF9800',
  icon: BoxSelect,
  items: [
    {
      type: 'solidCollision',
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onHit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isColliding', dataType: 'boolean', color: '#E57373' },
          { id: 'selfEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'otherEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            tag: ''
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity));
let hitObject = context.collider.checkSolid(entity);

if (hitObject && inputs.tag && inputs.tag.trim() !== '') {
  const objTag = hitObject.tag || (hitObject.components && hitObject.components.Tags && hitObject.components.Tags.value);
  if (objTag !== inputs.tag) {
    hitObject = null;
  }
}

const selfScriptId = entity.scriptId;
const hitScriptId = hitObject ? hitObject.scriptId : '';
const isColliding = Boolean(hitObject);

outputs.selfEntity = selfScriptId;
outputs.otherEntity = hitScriptId;
outputs.isColliding = isColliding;
outputs.execOut = true;

if (isColliding) {
  outputs.onHit = true;
}
return;`
        }
      }
    },
    {
      type: 'triggerZone',
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'tag', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onEnter', dataType: 'execution', color: '#FFFFFF' },
          { id: 'onExit', dataType: 'execution', color: '#FFFFFF' },
          { id: 'isInside', dataType: 'boolean', color: '#E57373' },
          { id: 'selfEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'otherEntity', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            tag: ''
          },
          code: 
`const entity = context.assert.exists(context.entity.get(inputs.targetEntity));

if (!context.state.triggerStates) {
  context.state.triggerStates = {};
}

const entityScriptId = entity.scriptId;
let myState = context.state.triggerStates[entityScriptId];
if (!myState) {
  myState = { isOverlapping: false, lastId: '' };
  context.state.triggerStates[entityScriptId] = myState;
}

const overlapObject = context.collider.checkOverlap(entity, inputs.tag);

const currentId = overlapObject ? overlapObject.scriptId : '';

const previousId = myState.lastId;
const isCurrentlyOverlapping = Boolean(currentId);

outputs.selfEntity = entityScriptId;
outputs.otherEntity = currentId || previousId;
outputs.isInside = isCurrentlyOverlapping;

if (!previousId && currentId) {
  myState.lastId = currentId;
  outputs.onEnter = true;
} else if (previousId && currentId && previousId !== currentId) {
  myState.lastId = currentId;
  outputs.onEnter = true;
} else if (previousId && !currentId) {
  myState.lastId = '';
  outputs.otherEntity = previousId;
  outputs.isInside = false;
  outputs.onExit = true;
}

myState.isOverlapping = isCurrentlyOverlapping;
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};