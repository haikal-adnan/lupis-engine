import { MousePointer2, Move, MousePointerClick, Target } from 'lucide-vue-next';

export const BlueprintMouse = {
  id: 'mouse_events',
  label: 'Mouse Events',
  color: '#4CAF50',
  icon: MousePointer2,
  items: [
    { 
      type: 'event_pointer_click', 
      label: 'Global Mouse Click', 
      description: 'Triggered when a mouse button is clicked anywhere on the screen.',
      icon: MousePointer2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Global Click', headerColor: '#388E3C', category: 'Mouse Events' },
        data: { button: 'left' }, 
        inputs: [],
        outputs: [
          { id: 'ptr_click_main', label: 'On Click', dataType: 'execution', color: '#ffffff' },
          { id: 'pos_x', label: 'X Position', dataType: 'number', color: '#4CAF50' },
          { id: 'pos_y', label: 'Y Position', dataType: 'number', color: '#4CAF50' }
        ],
        data: {
          code: `context.onTick(() => {
  const mouse = context.game?.input?.mouse;
  const pointer = context.game?.input?.getPointer?.() || { x: 0, y: 0 };
  const config = Array.isArray(node.data) ? node.data[0] : node.data;
  const btnTarget = config && config.button ? config.button : 'left';

  if (mouse && mouse.isPressed && mouse.isPressed(btnTarget)) {
    outputs['X Position'] = pointer.x;
    outputs['Y Position'] = pointer.y;
    outputs['pos_x'] = pointer.x;
    outputs['pos_y'] = pointer.y;
    context.triggerFlow((config && config.id) || 'ptr_click_main');
  }
});
return;`
        }
      } 
    },
    { 
      type: 'event_pointer_drag', 
      label: 'Global Mouse Drag', 
      description: 'Triggered continuously while mouse is held down and moving.',
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Global Drag', headerColor: '#388E3C', category: 'Mouse Events' },
        data: {}, 
        inputs: [],
        outputs: [
          { id: 'drag_active', label: 'On Drag', dataType: 'execution', color: '#ffffff' },
          { id: 'pos_x', label: 'X', dataType: 'number', color: '#4CAF50' },
          { id: 'pos_y', label: 'Y', dataType: 'number', color: '#4CAF50' },
          { id: 'delta_x', label: 'Delta X', dataType: 'number', color: '#4CAF50' },
          { id: 'delta_y', label: 'Delta Y', dataType: 'number', color: '#4CAF50' }
        ]
      } 
    },
    {
      type: 'mouse_entity_interact',
      label: 'Entity Mouse Event',
      description: 'Checks if the mouse is interacting with an entity. Can use Raycast (respects Z-Index/blocking) or Direct bounds check.',
      icon: MousePointerClick,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { headerTitle: 'Entity Mouse Event', headerColor: '#2E7D32', category: 'Mouse Events' },
        data: {
          values: {
            target_in: 'self',
            based_collider: false,
            use_raycast: true 
          },
          code: `const targetId = inputs['Target ID (Self)'] ?? inputs['target_in'] ?? 'self';
const entity = context.getEntity(targetId);

if (!entity) {
  outputs['Out'] = true;
  return;
}

const hasTransform = entity.components && entity.components.Transform;
const hasUITransform = entity.components && entity.components.UITransform;

if (!hasTransform && !hasUITransform) {
  outputs['Out'] = true;
  return;
}

const pointer = context.game?.input?.getPointer?.() || { x: 0, y: 0, down: false };
const isPointerDown = pointer.down;
const entityId = entity.id;

const useRaycast = inputs['Use Raycast?'] ?? inputs['use_raycast'] ?? true;

let isHovering = false;
let outputEntityScriptId = null;

const RaycastSystem = context.game?.pointerRaycast;

if (useRaycast && RaycastSystem) {
  const topEntity = RaycastSystem.getTopEntityUnderPointer(context.game);

  if (topEntity) {
    outputEntityScriptId = topEntity.scriptId || topEntity.id;

    if (topEntity.id === entityId) {
      isHovering = true;
    } else {
      let currentParentId = topEntity.parentId;
      while (currentParentId) {
        if (currentParentId === entityId) {
          isHovering = true;
          break;
        }
        const pEntity = context.game.world?.entities?.find(e => e.id === currentParentId);
        currentParentId = pEntity ? pEntity.parentId : null;
      }
    }
  }
} else if (RaycastSystem) {
  const canvas = context.game?.renderer?.gl?.canvas || context.game?.renderer?.canvas;
  const canvasW = canvas?.clientWidth || canvas?.width || 1920;
  const canvasH = canvas?.clientHeight || canvas?.height || 1080;

  const uiSettings = context.game?.world?.settings?.ui || { width: 1920, height: 1080 };
  const camera = context.camera || context.game?.camera || { x: 0, y: 0, scale: 1 };

  const uiPointer = {
    x: (pointer.x / canvasW) * uiSettings.width,
    y: (pointer.y / canvasH) * uiSettings.height
  };

  const halfW = canvasW / 2;
  const halfH = canvasH / 2;
  const worldPointer = {
    x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
    y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
  };

  const globalT = RaycastSystem._getGlobalTransform(entity, context.game.world);
  let drawX = globalT.x || 0;
  let drawY = globalT.y || 0;
  let targetPointer = hasUITransform ? uiPointer : worldPointer;

  if (hasUITransform) {
    const t = entity.components.UITransform;
    const anchorX = t.anchorX ?? 0.5;
    const anchorY = t.anchorY ?? 0.5;
    drawX = (uiSettings.width * anchorX) + (globalT.x || 0);
    drawY = (uiSettings.height * anchorY) + (globalT.y || 0);
  }

  isHovering = RaycastSystem._checkIntersection(
    entity, 
    globalT, 
    drawX, 
    drawY, 
    targetPointer.x, 
    targetPointer.y
  );

  if (isHovering) {
    outputEntityScriptId = entity.scriptId || entity.id;
  }
}

const node = context.node;
if (!node._interactStates) node._interactStates = new Map();

let state = node._interactStates.get(entityId) || { wasHovering: false, wasDown: false };

outputs['Is Hovering?'] = isHovering;
outputs['Is Holding?'] = isHovering && isPointerDown;
outputs['Entity ID'] = outputEntityScriptId;

outputs['Out'] = true;

if (isHovering) outputs['On Hover'] = true;

if (isHovering && isPointerDown) {
  if (!state.wasDown) {
    outputs['On Mouse Down'] = true;
  } else {
    outputs['On Mouse Hold'] = true;
  }
}

if (!isPointerDown && state.wasDown) {
  outputs['On Mouse Up'] = true;
}

state.wasHovering = isHovering;
state.wasDown = isPointerDown;
node._interactStates.set(entityId, state);

return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution' },
          { id: 'target_in', label: 'Target ID (Self)', dataType: 'string', icon: Target, defaultValue: 'self' },
          { id: 'use_raycast', label: 'Use Raycast?', dataType: 'boolean', defaultValue: true },
          { id: 'based_collider', label: 'Use Collider Bounds?', dataType: 'boolean', defaultValue: false }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution' },
          
          { id: 'on_hover', label: 'On Hover', dataType: 'execution', color: '#FFEB3B' },
          { id: 'on_down', label: 'On Mouse Down', dataType: 'execution', color: '#69F0AE' },
          { id: 'on_hold', label: 'On Mouse Hold', dataType: 'execution', color: '#4FC3F7' },
          { id: 'on_up', label: 'On Mouse Up', dataType: 'execution', color: '#FFAB91' },
          
          { id: 'is_hovering', label: 'Is Hovering?', dataType: 'boolean', color: '#FFEB3B' },
          { id: 'is_holding', label: 'Is Holding?', dataType: 'boolean', color: '#4FC3F7' },
          
          { id: 'entityId', label: 'Entity ID', dataType: 'string', color: '#B0BEC5' } 
        ]
      }
    }
  ]
};