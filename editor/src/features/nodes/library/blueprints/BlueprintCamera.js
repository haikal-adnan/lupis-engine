import { Camera } from 'lucide-vue-next';

export const BlueprintCamera = {
  id: 'category_camera',
  label: 'Camera',
  color: '#F59E0B',
  icon: Camera,
  items: [
    {
      type: 'action_camera_follow',
      label: 'Camera Follow',
      description: 'Membuat kamera mengikuti entity target secara halus (smooth).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Camera Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_entity', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'smooth_speed', label: 'Smoothness', dataType: 'number', color: '#64B5F6', defaultValue: 0.1 },
          { id: 'offset_x', label: 'Offset X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'offset_y', label: 'Offset Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target_entity: 'self',
            smooth_speed: 0.1,
            offset_x: 0,
            offset_y: 0
          },
          code: 
`const target = inputs['Target Entity'] ?? inputs['target_entity'] ?? 'self';
const smoothness = Number(inputs['Smoothness'] ?? inputs['smooth_speed'] ?? 0.1);
const offsetX = Number(inputs['Offset X'] ?? inputs['offset_x'] ?? 0);
const offsetY = Number(inputs['Offset Y'] ?? inputs['offset_y'] ?? 0);

const targetEntity = context.entity.get(target);

if (targetEntity && context.camera && typeof context.camera.setTarget === 'function') {
  context.camera.setTarget(targetEntity, smoothness, {
    x: offsetX,
    y: offsetY
  });
}

outputs['Out'] = true;
outputs['out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'action_camera_stop_follow',
      label: 'Stop Camera Follow',
      description: 'Menghentikan kamera dari mengikuti entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Stop Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`if (context.camera && typeof context.camera.clearTarget === 'function') {
  context.camera.clearTarget();
}

outputs['Out'] = true;
outputs['out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'action_camera_set_transform',
      label: 'Set Camera Transform',
      description: 'Mengatur posisi (X, Y), skala zoom, dan kecepatan interpolasi (smoothness) kamera.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Camera Transform',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'x', label: 'X', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y', label: 'Y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'scale', label: 'Scale', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'smooth_speed', label: 'Smoothness', dataType: 'number', color: '#64B5F6', defaultValue: 0.1 }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            x: 0,
            y: 0,
            scale: 1,
            smooth_speed: 0.1
          },
          code: 
`const posX = Number(inputs['X'] ?? inputs['x'] ?? 0);
const posY = Number(inputs['Y'] ?? inputs['y'] ?? 0);
const scaleVal = Number(inputs['Scale'] ?? inputs['scale'] ?? 1);
const smoothness = Number(inputs['Smoothness'] ?? inputs['smooth_speed'] ?? 0.1);

if (context.camera) {
  if (typeof context.camera.snapTo === 'function') {
    context.camera.snapTo(posX, posY);
  } else {
    context.camera.x = isNaN(posX) ? 0 : posX;
    context.camera.y = isNaN(posY) ? 0 : posY;
  }

  if (!isNaN(scaleVal) && scaleVal > 0) {
    context.camera.scale = scaleVal;
  }

  if (!isNaN(smoothness)) {
    context.camera.lerp = smoothness;
  }
}

outputs['Out'] = true;
outputs['out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'query_camera_info',
      label: 'Get Camera Info',
      description: 'Pure node untuk membaca koordinat, skala zoom, smoothness, dan scriptId target kamera saat ini.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Camera Info',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [],
        outputs: [
          { id: 'x', label: 'X', dataType: 'number', color: '#64B5F6' },
          { id: 'y', label: 'Y', dataType: 'number', color: '#64B5F6' },
          { id: 'scale', label: 'Scale', dataType: 'number', color: '#64B5F6' },
          { id: 'smooth_speed', label: 'Smoothness', dataType: 'number', color: '#64B5F6' },
          { id: 'target_script_id', label: 'Target Script ID', dataType: 'string', color: '#F48FB1' },
          { id: 'has_target', label: 'Has Target', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          code: 
`const camera = context.camera;
const posX = camera ? Number(camera.x) || 0 : 0;
const posY = camera ? Number(camera.y) || 0 : 0;
const scaleVal = camera ? Number(camera.scale) || 1 : 1;
const smoothness = camera ? Number(camera.lerp) || 0.1 : 0.1;

const target = camera ? camera.target : null;
const isValid = Boolean(target && !target._isDestroyed);
const scriptId = isValid ? (target.scriptId ?? target.script_id ?? target.id ?? '') : '';

outputs['X'] = posX;
outputs['x'] = posX;
outputs['Y'] = posY;
outputs['y'] = posY;
outputs['Scale'] = scaleVal;
outputs['scale'] = scaleVal;
outputs['Smoothness'] = smoothness;
outputs['smooth_speed'] = smoothness;
outputs['Target Script ID'] = String(scriptId);
outputs['target_script_id'] = String(scriptId);
outputs['Has Target'] = Boolean(isValid && scriptId);
outputs['has_target'] = Boolean(isValid && scriptId);
return;`
        }
      }
    }
  ]
};