import { 
  GitMerge, 
  Timer,
  Hourglass,
  Activity,
  TypeIcon,
  MousePointerClick
} from 'lucide-vue-next';

export const BlueprintHelper = {
  id: 'flow_helper',
  label: 'Flow Helpers',
  color: '#607D8B',
  icon: GitMerge,
  items: [
    { 
      type: 'logic_flow_merge', 
      label: 'Merge Flow', 
      description: 'Merges multiple execution paths into a single output.',
      icon: GitMerge, 
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Merge', headerColor: '#607D8B', category: 'Helper' },
        inputs: [
          { id: 'in_0', label: 'In 1', dataType: 'execution', color: '#ffffff' },
          { id: 'in_1', label: 'In 2', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          code: `outputs['Out'] = true;\nreturn;`
        }
      } 
    },
    { 
      type: 'logic_delay', 
      label: 'Delay', 
      description: 'Delays execution for a specified duration in milliseconds.',
      icon: Timer,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Delay', headerColor: '#607D8B', category: 'Helper' },
        data: { 
          values: { duration: 500 },
          code: `const duration = Number(inputs['Milisecond'] ?? inputs['duration'] ?? 500);
const dt = (context.dt || 0.016) * 1000;

// Tandai node sedang berjalan
if (!node._isDelayActive) {
  node._isDelayActive = true;
  node._delayRemaining = duration;
}

node._delayRemaining -= dt;

if (node._delayRemaining <= 0) {
  node._isDelayActive = false;
  outputs['Completed'] = true;
} else {
  outputs['Completed'] = false;
}
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'duration', label: 'Milisecond', dataType: 'number', color: '#B2FF59', defaultValue: 500 }
        ], 
        outputs: [
          { id: 'out', label: 'Completed', dataType: 'execution', color: '#ffffff' }
        ]
      }
    },
    { 
      type: 'logic_cooldown', 
      label: 'Cooldown / Interval', 
      description: 'Passes execution only if the cooldown duration (ms) has been reached.',
      icon: Hourglass,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Cooldown', headerColor: '#607D8B', category: 'Helper' },
        data: { 
          values: { duration: 500 },
          code: `const targetDuration = Number(inputs['Duration (ms)'] ?? 500);
const currentTime = Date.now();

if (node._lastExecuteTime === undefined) {
  node._lastExecuteTime = 0;
}

if (currentTime - node._lastExecuteTime >= targetDuration) {
  node._lastExecuteTime = currentTime;
  outputs['Ready (Fire)'] = true;
} else {
  outputs['Cooling Down'] = true;
}
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#B2FF59', defaultValue: 500 }
        ], 
        outputs: [
          { id: 'ready', label: 'Ready (Fire)', dataType: 'execution', color: '#ffffff' },
          { id: 'cooling', label: 'Cooling Down', dataType: 'execution', color: '#B0BEC5' }
        ]
      } 
    },
    {
      type: 'logic_tween_value',
      label: 'Tween Value',
      description: 'Generates interpolated values over time.',
      icon: Activity,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: { 
          headerTitle: 'Tween Value', 
          headerColor: '#EC4899', 
          category: 'Helper' 
        },
        data: {
          values: {
            startValue: 0,
            endValue: 100,
            duration: 1000,
            easing: 'smooth'
          },
          options: {
            easing: [
              { label: 'Linear', value: 'linear' },
              { label: 'Smooth (Ease In-Out)', value: 'smooth' },
              { label: 'Accelerate (Ease In)', value: 'ease_in' }
            ]
          },
          code: `const start = parseFloat(inputs['Start Value'] ?? 0);
const end = parseFloat(inputs['End Value'] ?? 100);
const duration = parseFloat(inputs['Duration (ms)'] ?? 1000);
const easing = node.data?.values?.easing || 'smooth';

if (node._tweenElapsed === undefined) {
  node._tweenElapsed = 0;
}

const dt = (context.dt || 0.016) * 1000;
node._tweenElapsed += dt;

let progress = Math.min(node._tweenElapsed / duration, 1.0);
let t = progress;

if (easing === 'smooth') t = progress * progress * (3 - 2 * progress);
if (easing === 'ease_in') t = progress * progress;

node._currentValue = start + (end - start) * t;

outputs['Value'] = node._currentValue;
outputs['On Update'] = true;

if (progress >= 1.0) {
  node._tweenElapsed = undefined;
  outputs['On Complete'] = true;
}
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'Update (Tick)', dataType: 'execution' },
          { id: 'startValue', label: 'Start Value', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'endValue', label: 'End Value', dataType: 'number', color: '#FF4081', defaultValue: 100 },
          { id: 'duration', label: 'Duration (ms)', dataType: 'number', color: '#B2FF59', defaultValue: 1000 }
        ],
        outputs: [
          { id: 'on_update', label: 'On Update', dataType: 'execution', color: '#29B6F6' },
          { id: 'value', label: 'Value', dataType: 'number', color: '#00E676' }, 
          { id: 'on_complete', label: 'On Complete', dataType: 'execution', color: '#69F0AE' }
        ]
      }
    },
    { 
      type: 'logic_typewriter', 
      label: 'Typewriter Effect', 
      description: 'Animates text character by character.',
      icon: TypeIcon, 
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Typewriter', 
          headerColor: '#FFB300', 
          category: 'UI / Text' 
        },
        data: { 
          values: { speed: 50, target_in: '', text_in: '' },
          code: `const targetId = inputs['Target ID (Self)'];
const entity = context.getEntity(targetId);
const comp = entity?.components?.TextRenderer;

if (!comp) {
  outputs['Is Typing'] = false;
  outputs['Completed'] = true;
  return;
}

const speed = Number(inputs['Speed (ms)'] ?? 50);
const inputText = inputs['New Text'];
const targetText = (inputText !== undefined && inputText !== null && inputText !== '') 
  ? String(inputText) 
  : (comp.value || "");

if (node._typewriterIndex === undefined) {
  node._typewriterIndex = 0;
  node._typewriterTimer = 0;
  comp.value = "";
}

const dt = (context.dt || 0.016) * 1000;
node._typewriterTimer += dt;

if (node._typewriterTimer >= speed) {
  node._typewriterTimer = 0;
  if (node._typewriterIndex < targetText.length) {
    node._typewriterIndex++;
    comp.value = targetText.slice(0, node._typewriterIndex);
    outputs['Is Typing'] = true;
    outputs['Out'] = true;
  } else {
    node._typewriterIndex = undefined;
    outputs['Is Typing'] = false;
    outputs['Completed'] = true;
  }
}
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'Update (Tick)', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB', defaultValue: 'self' },
          { id: 'text_in', label: 'New Text', dataType: 'string', color: '#FFF' },
          { id: 'speed', label: 'Speed (ms)', dataType: 'number', color: '#B2FF59', defaultValue: 50 }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'is_typing', label: 'Is Typing', dataType: 'boolean', color: '#40C4FF' },
          { id: 'on_complete', label: 'Completed', dataType: 'execution', color: '#69F0AE' }
        ]
      } 
    },
    { 
      type: 'ui_button_scale_effect', 
      label: 'Button Scale Effect', 
      description: 'Handles button hover, click, and scale interpolation (Lerp) automatically within a single node.',
      icon: MousePointerClick,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Button Scale', 
          headerColor: '#E91E63', 
          category: 'UI Effects' 
        },
        data: { 
          values: { 
            target_in: 'self',
            scaleNormal: 1.0,
            scaleHover: 1.1,
            scalePressed: 0.9,
            lerpSpeed: 0.2,
            use_raycast: true
          },
          code: `const targetId = inputs['Target ID (Self)'] ?? inputs['target_in'] ?? 'self';
const entity = context.getEntity(targetId);

const hasTransform = entity?.components?.Transform;
const hasUITransform = entity?.components?.UITransform;
const t = hasUITransform ? entity.components.UITransform : entity?.components?.Transform;

if (!entity || !t) {
  outputs['Out'] = true;
  return;
}

const entityId = entity.id;
const scaleNormal = Number(inputs['Normal Scale'] ?? inputs['scaleNormal'] ?? 1.0);
const scaleHover = Number(inputs['Hover Scale'] ?? inputs['scaleHover'] ?? 1.1);
const scalePressed = Number(inputs['Pressed Scale'] ?? inputs['scalePressed'] ?? 0.9);
const lerpSpeed = Number(inputs['Lerp Speed'] ?? inputs['lerpSpeed'] ?? 0.2);
const useRaycast = inputs['Use Raycast?'] ?? inputs['use_raycast'] ?? true;

const pointer = context.game?.input?.getPointer?.() || { x: 0, y: 0, down: false };
const isPointerDown = pointer.down;

let isHovering = false;
const RaycastSystem = context.game?.pointerRaycast;

if (useRaycast && RaycastSystem) {
  const topEntity = RaycastSystem.getTopEntityUnderPointer(context.game);
  
  if (topEntity) {
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
}

if (!node._wasDownMap) node._wasDownMap = new Map();
if (!node._scaleMap) node._scaleMap = new Map();

let currentScale = node._scaleMap.get(entityId) ?? (t.scaleX ?? scaleNormal);
let wasDown = node._wasDownMap.get(entityId) ?? false;

let targetScale = scaleNormal;
if (isHovering) {
  targetScale = isPointerDown ? scalePressed : scaleHover;
}

currentScale += (targetScale - currentScale) * lerpSpeed;
t.scaleX = currentScale;
t.scaleY = currentScale;

node._scaleMap.set(entityId, currentScale);

let clicked = false;
if (isHovering && !isPointerDown && wasDown) {
  clicked = true;
}

node._wasDownMap.set(entityId, isPointerDown);

outputs['Out'] = true;

if (clicked) {
  outputs['Clicked ID'] = entity.scriptId || entity.id;
  outputs['On Click (Released)'] = true;
}
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'Update (Tick)', dataType: 'execution' },
          { id: 'target_in', label: 'Target ID (Self)', dataType: 'string', defaultValue: 'self' },
          { id: 'use_raycast', label: 'Use Raycast?', dataType: 'boolean', defaultValue: true },
          { id: 'scaleNormal', label: 'Normal Scale', dataType: 'number', color: '#B2FF59', defaultValue: 1.0 },
          { id: 'scaleHover', label: 'Hover Scale', dataType: 'number', color: '#B2FF59', defaultValue: 1.1 },
          { id: 'scalePressed', label: 'Pressed Scale', dataType: 'number', color: '#B2FF59', defaultValue: 0.9 },
          { id: 'lerpSpeed', label: 'Lerp Speed', dataType: 'number', color: '#40C4FF', defaultValue: 0.2 }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
          { id: 'on_click', label: 'On Click (Released)', dataType: 'execution', color: '#69F0AE' },
          { id: 'script_id_out', label: 'Clicked ID', dataType: 'string', color: '#E040FB' } 
        ]
      } 
    }
  ]
};