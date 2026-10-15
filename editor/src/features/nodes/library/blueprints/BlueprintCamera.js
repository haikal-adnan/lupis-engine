import { Camera } from 'lucide-vue-next';

export const BlueprintCamera = {
  id: 'category_camera',
  label: 'Camera',
  color: '#F59E0B',
  icon: Camera,
  items: [
    {
      type: 'actionCameraFollow',
      label: 'Camera Follow',
      description: 'Makes the camera smoothly follow the target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Camera Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' },
          { id: 'smoothSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 0.1 },
          { id: 'offsetX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'offsetY', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetEntity: 'self',
            smoothSpeed: 0.1,
            offsetX: 0,
            offsetY: 0
          },
          code: 
`const targetEntity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');

context.camera.setTarget(targetEntity, inputs.smoothSpeed, {
  x: inputs.offsetX,
  y: inputs.offsetY
});

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'actionCameraStopFollow',
      label: 'Stop Camera Follow',
      description: 'Stops the camera from following the target entity.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Stop Follow',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`context.camera.clearTarget();

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'actionCameraSetTransform',
      label: 'Set Camera Transform',
      description: 'Sets camera position (X, Y), zoom scale, and interpolation speed (smoothness).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Camera Transform',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'x', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'scale', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'smoothSpeed', dataType: 'number', color: '#64B5F6', defaultValue: 0.1 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            x: 0,
            y: 0,
            scale: 1,
            smoothSpeed: 0.1
          },
          code: 
`context.camera.setTransform(inputs.x, inputs.y, inputs.scale, inputs.smoothSpeed);

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'queryCameraInfo',
      label: 'Get Camera Info',
      description: 'Pure node to read current camera coordinates, zoom scale, smoothness, and target scriptId.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Camera Info',
          headerColor: '#F59E0B',
          category: 'Camera'
        },
        inputs: [],
        outputs: [
          { id: 'x', dataType: 'number', color: '#64B5F6' },
          { id: 'y', dataType: 'number', color: '#64B5F6' },
          { id: 'scale', dataType: 'number', color: '#64B5F6' },
          { id: 'smoothSpeed', dataType: 'number', color: '#64B5F6' },
          { id: 'targetEntity', dataType: 'string', color: '#F48FB1' },
          { id: 'hasTarget', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          code: 
`const info = context.camera.getInfo();

outputs.x = info.x;
outputs.y = info.y;
outputs.scale = info.scale;
outputs.smoothSpeed = info.smoothSpeed;
outputs.targetEntity = info.targetEntity;
outputs.hasTarget = info.hasTarget;
return;`
        }
      }
    }
  ]
};