import { Image as ImageIcon } from 'lucide-vue-next';

export const BlueprintRenderer = {
  id: 'game_renderer',
  label: 'Renderer',
  color: '#00ACC1',
  icon: ImageIcon,
  items: [
    {
      type: 'getSprite',
      label: 'Get Sprite',
      description: 'Get properties of the Image Renderer',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Sprite',
          headerColor: '#00ACC1',
          category: 'Renderer'
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
            { value: 'assetId', label: 'Asset ID', type: 'string', color: '#F48FB1' },
            { value: 'color', label: 'Tint Color', type: 'string', color: '#F48FB1' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#64B5F6' },
            { value: 'sourceX', label: 'Source X', type: 'number', color: '#64B5F6' },
            { value: 'sourceY', label: 'Source Y', type: 'number', color: '#64B5F6' },
            { value: 'sourceWidth', label: 'Source Width', type: 'number', color: '#64B5F6' },
            { value: 'sourceHeight', label: 'Source Height', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteRenderer');

outputs.assetId = comp.assetId;
outputs.color = comp.color;
outputs.opacity = comp.opacity;
outputs.sourceX = comp.sourceX;
outputs.sourceY = comp.sourceY;
outputs.sourceWidth = comp.sourceWidth;
outputs.sourceHeight = comp.sourceHeight;
return;`
        }
      }
    },
    {
      type: 'setSprite',
      label: 'Set Sprite',
      description: 'Set properties of the Image Renderer',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Sprite',
          headerColor: '#00ACC1',
          category: 'Renderer'
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
            { value: 'assetId', label: 'Asset ID', type: 'string', color: '#F48FB1' },
            { value: 'color', label: 'Tint Color', type: 'string', color: '#F48FB1' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#64B5F6' },
            { value: 'sourceX', label: 'Source X', type: 'number', color: '#64B5F6' },
            { value: 'sourceY', label: 'Source Y', type: 'number', color: '#64B5F6' },
            { value: 'sourceWidth', label: 'Source Width', type: 'number', color: '#64B5F6' },
            { value: 'sourceHeight', label: 'Source Height', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'SpriteRenderer');

if ('assetId' in inputs) comp.assetId = inputs.assetId;
if ('color' in inputs) comp.color = inputs.color;
if ('opacity' in inputs) comp.opacity = inputs.opacity;
if ('sourceX' in inputs) comp.sourceX = inputs.sourceX;
if ('sourceY' in inputs) comp.sourceY = inputs.sourceY;
if ('sourceWidth' in inputs) comp.sourceWidth = inputs.sourceWidth;
if ('sourceHeight' in inputs) comp.sourceHeight = inputs.sourceHeight;

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'getText',
      label: 'Get Text',
      description: 'Get properties of the Text Renderer',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Text',
          headerColor: '#FFB300',
          category: 'Renderer'
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
            { value: 'value', label: 'Content', type: 'string', color: '#F48FB1' },
            { value: 'mode', label: 'Mode', type: 'string', color: '#F48FB1' },
            { value: 'assetId', label: 'Font Asset', type: 'string', color: '#F48FB1' },
            { value: 'fontSize', label: 'Font Size', type: 'number', color: '#64B5F6' },
            { value: 'color', label: 'Text Color', type: 'string', color: '#F48FB1' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#64B5F6' },
            { value: 'align', label: 'Align', type: 'string', color: '#F48FB1' },
            { value: 'maxWidth', label: 'Max Width', type: 'number', color: '#64B5F6' },
            { value: 'maxLine', label: 'Max Line', type: 'number', color: '#64B5F6' },
            { value: 'lineSpacing', label: 'Line Spacing', type: 'number', color: '#64B5F6' },
            { value: 'letterSpacing', label: 'Char Spacing', type: 'number', color: '#64B5F6' },
            { value: 'overflow', label: 'Overflow', type: 'string', color: '#F48FB1' },
            { value: 'autoFit', label: 'Auto Fit', type: 'boolean', color: '#E57373' },
            { value: 'smoothing', label: 'Smoothing', type: 'number', color: '#64B5F6' },
            { value: 'bias', label: 'Font Bias', type: 'number', color: '#64B5F6' },
            { value: 'outlineWidth', label: 'Outline Width', type: 'number', color: '#64B5F6' },
            { value: 'outlineColor', label: 'Outline Color', type: 'string', color: '#F48FB1' },
            { value: 'shadowEnabled', label: 'Shadow Enabled', type: 'boolean', color: '#E57373' },
            { value: 'shadowColor', label: 'Shadow Color', type: 'string', color: '#F48FB1' },
            { value: 'shadowOpacity', label: 'Shadow Opacity (%)', type: 'number', color: '#64B5F6' },
            { value: 'shadowOffsetX', label: 'Shadow Offset X', type: 'number', color: '#64B5F6' },
            { value: 'shadowOffsetY', label: 'Shadow Offset Y', type: 'number', color: '#64B5F6' },
            { value: 'shadowBlur', label: 'Shadow Blur', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'TextRenderer');

outputs.value = comp.value;
outputs.mode = comp.mode;
outputs.assetId = comp.assetId;
outputs.fontSize = comp.fontSize;
outputs.color = comp.color;
outputs.opacity = Math.round(comp.opacity * 100);
outputs.align = comp.align;
outputs.maxWidth = comp.maxWidth;
outputs.maxLine = comp.maxLine;
outputs.lineSpacing = comp.lineSpacing;
outputs.letterSpacing = comp.letterSpacing;
outputs.overflow = comp.overflow;
outputs.autoFit = comp.autoFit;
outputs.smoothing = comp.smoothing;
outputs.bias = comp.bias;
outputs.outlineWidth = comp.outlineWidth;
outputs.outlineColor = comp.outlineColor;
outputs.shadowEnabled = comp.shadowEnabled;
outputs.shadowColor = comp.shadowColor;
outputs.shadowOpacity = Math.round(comp.shadowOpacity * 100);
outputs.shadowOffsetX = comp.shadowOffsetX;
outputs.shadowOffsetY = comp.shadowOffsetY;
outputs.shadowBlur = comp.shadowBlur;
return;`
        }
      }
    },
    {
      type: 'setText',
      label: 'Set Text',
      description: 'Set properties of the Text Renderer',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Text',
          headerColor: '#FFB300',
          category: 'Renderer'
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
            { value: 'value', label: 'Content', type: 'string', color: '#F48FB1' },
            { value: 'fontSize', label: 'Font Size', type: 'number', color: '#64B5F6' },
            { value: 'color', label: 'Color', type: 'string', color: '#F48FB1' },
            { value: 'align', label: 'Align', type: 'string', color: '#F48FB1' },
            { value: 'assetId', label: 'Font Asset', type: 'string', color: '#F48FB1' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'TextRenderer');

if ('value' in inputs) comp.value = inputs.value;
if ('fontSize' in inputs) comp.fontSize = inputs.fontSize;
if ('color' in inputs) comp.color = inputs.color;
if ('align' in inputs) comp.align = inputs.align;
if ('assetId' in inputs) comp.assetId = inputs.assetId;
if ('opacity' in inputs) comp.opacity = inputs.opacity / 100;

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'getShape',
      label: 'Get Shape',
      description: 'Get properties of the Shape Renderer',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Shape',
          headerColor: '#E91E63',
          category: 'Renderer'
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
            { value: 'type', label: 'Type', type: 'string', color: '#F48FB1' },
            { value: 'color', label: 'Color', type: 'string', color: '#F48FB1' },
            { value: 'width', label: 'Width', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Height', type: 'number', color: '#64B5F6' },
            { value: 'thickness', label: 'Line Thickness', type: 'number', color: '#64B5F6' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'ShapeRenderer');

outputs.type = comp.type;
outputs.color = comp.color;
outputs.width = comp.width;
outputs.height = comp.height;
outputs.thickness = comp.thickness;
outputs.opacity = comp.opacity;
return;`
        }
      }
    },
    {
      type: 'setShape',
      label: 'Set Shape',
      description: 'Set properties of the Shape Renderer',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Shape',
          headerColor: '#E91E63',
          category: 'Renderer'
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
            { value: 'type', label: 'Type', type: 'string', color: '#F48FB1' },
            { value: 'color', label: 'Color', type: 'string', color: '#F48FB1' },
            { value: 'width', label: 'Width', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Height', type: 'number', color: '#64B5F6' },
            { value: 'thickness', label: 'Line Thickness', type: 'number', color: '#64B5F6' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'ShapeRenderer');

if ('type' in inputs) comp.type = inputs.type;
if ('color' in inputs) comp.color = inputs.color;
if ('width' in inputs) comp.width = inputs.width;
if ('height' in inputs) comp.height = inputs.height;
if ('thickness' in inputs) comp.thickness = inputs.thickness;
if ('opacity' in inputs) comp.opacity = inputs.opacity;

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'getTilemap',
      label: 'Get Tilemap',
      description: 'Get properties of the Tilemap Component',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Tilemap',
          headerColor: '#689F38',
          category: 'Renderer'
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
            { value: 'assetId', label: 'Tileset Asset', type: 'string', color: '#F48FB1' },
            { value: 'width', label: 'Map Width (Grid)', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Map Height (Grid)', type: 'number', color: '#64B5F6' },
            { value: 'tileWidth', label: 'Tile Width', type: 'number', color: '#64B5F6' },
            { value: 'tileHeight', label: 'Tile Height', type: 'number', color: '#64B5F6' },
            { value: 'isSolid', label: 'Is Solid', type: 'boolean', color: '#E57373' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'Tilemap');

outputs.assetId = comp.assetId;
outputs.width = comp.width;
outputs.height = comp.height;
outputs.tileWidth = comp.tileWidth;
outputs.tileHeight = comp.tileHeight;
outputs.isSolid = comp.isSolid;
outputs.opacity = comp.opacity;
return;`
        }
      }
    },
    {
      type: 'setTilemap',
      label: 'Set Tilemap',
      description: 'Set properties of the Tilemap Component',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Tilemap',
          headerColor: '#689F38',
          category: 'Renderer'
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
            { value: 'assetId', label: 'Tileset Asset', type: 'string', color: '#F48FB1' },
            { value: 'width', label: 'Map Width (Grid)', type: 'number', color: '#64B5F6' },
            { value: 'height', label: 'Map Height (Grid)', type: 'number', color: '#64B5F6' },
            { value: 'tileWidth', label: 'Tile Width', type: 'number', color: '#64B5F6' },
            { value: 'tileHeight', label: 'Tile Height', type: 'number', color: '#64B5F6' },
            { value: 'isSolid', label: 'Is Solid', type: 'boolean', color: '#E57373' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs.targetEntity;
const entity = context.assert.exists(context.entity.get(targetId));
const comp = context.assert.hasComponent(entity, 'Tilemap');

if ('assetId' in inputs) comp.assetId = inputs.assetId;
if ('width' in inputs) comp.width = inputs.width;
if ('height' in inputs) comp.height = inputs.height;
if ('tileWidth' in inputs) comp.tileWidth = inputs.tileWidth;
if ('tileHeight' in inputs) comp.tileHeight = inputs.tileHeight;
if ('isSolid' in inputs) comp.isSolid = inputs.isSolid;
if ('opacity' in inputs) comp.opacity = inputs.opacity;

outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'batchSet',
      label: 'Batch Set Properties',
      description: 'Set multiple properties in one execution node',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Batch Set',
          headerColor: '#7E57C2',
          category: 'Renderer'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          steps: [],
          values: {},
          code: 
`const steps = node.data.steps || [];

steps.forEach((step, index) => {
  const targetId = inputs[\`targetEntity\${index}\`] || 'self';
  const entity = context.assert.exists(context.entity.get(targetId));

  if (\`value\${index}\` in inputs) {
    const rawVal = inputs[\`value\${index}\`];
    if (step.component === 'Entity') {
      const rootProps = {
        name: v => v,
        tag: v => v,
        type: v => v,
        zIndex: v => v,
        orderIndex: v => v,
        active: v => v,
        visible: v => v,
        locked: v => v
      };

      if (rootProps[step.property]) {
        entity[step.property] = rootProps[step.property](rawVal);
      }
    } else {
      const comp = context.assert.hasComponent(entity, step.component);
      comp[step.property] = rawVal;
    }
  }
});

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};