import { 
  Image as ImageIcon,
  Type as TypeIcon,
  Square,
  Grid3x3,
  Layers
} from 'lucide-vue-next';

export const BlueprintRenderer = {
  id: 'game_renderer',
  label: 'Renderer',
  color: '#00ACC1',
  icon: ImageIcon,
  items: [
    // 1. GET SPRITE (Pure Node - Dynamic Outputs)
    { 
      type: 'get_sprite', 
      label: 'Get Sprite', 
      description: 'Get properties of the Image Renderer', 
      icon: ImageIcon, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Sprite', headerColor: '#00ACC1', category: 'Graphics' },
        inputs: [
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [], 
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'assetId', label: 'Asset ID', type: 'string', color: '#FFB74D' },
            { value: 'color', label: 'Tint Color', type: 'string', color: '#FFB74D' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#B2FF59' },
            { value: 'sourceX', label: 'Source X', type: 'number', color: '#B2FF59' },
            { value: 'sourceY', label: 'Source Y', type: 'number', color: '#B2FF59' },
            { value: 'sourceWidth', label: 'Source Width', type: 'number', color: '#B2FF59' },
            { value: 'sourceHeight', label: 'Source Height', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.SpriteRenderer) {
    const comp = entity.components.SpriteRenderer;
    outputs['Asset ID'] = comp.assetId;
    outputs['Tint Color'] = comp.color;
    outputs['Opacity'] = comp.opacity;
    outputs['Source X'] = comp.sourceX;
    outputs['Source Y'] = comp.sourceY;
    outputs['Source Width'] = comp.sourceWidth;
    outputs['Source Height'] = comp.sourceHeight;
}
return;`
        }
      } 
    },

    // 2. SET SPRITE (Action Node - Dynamic Inputs)
    { 
      type: 'set_sprite', 
      label: 'Set Sprite', 
      icon: ImageIcon,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Sprite', headerColor: '#00ACC1', category: 'Graphics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'assetId', label: 'Asset ID', type: 'string', color: '#FFB74D' },
            { value: 'color', label: 'Tint Color', type: 'string', color: '#FFB74D' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#B2FF59' },
            { value: 'sourceX', label: 'Source X', type: 'number', color: '#B2FF59' },
            { value: 'sourceY', label: 'Source Y', type: 'number', color: '#B2FF59' },
            { value: 'sourceWidth', label: 'Source Width', type: 'number', color: '#B2FF59' },
            { value: 'sourceHeight', label: 'Source Height', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.SpriteRenderer) {
    const comp = entity.components.SpriteRenderer;

    const props = {
        'Asset ID': v => { comp.assetId = String(v); },
        'Tint Color': v => { comp.color = String(v); },
        'Opacity': v => { comp.opacity = Number(v); },
        'Source X': v => { comp.sourceX = Number(v); },
        'Source Y': v => { comp.sourceY = Number(v); },
        'Source Width': v => { comp.sourceWidth = Number(v); },
        'Source Height': v => { comp.sourceHeight = Number(v); }
    };

    Object.keys(props).forEach(label => {
        const rawVal = inputs[label];
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            props[label](rawVal);
        }
    });
}

outputs['Out'] = true;
return;`
        }
      } 
    },

    // 3. GET TEXT (Pure Node - Dynamic Outputs)
    { 
      type: 'get_text', 
      label: 'Get Text', 
      icon: TypeIcon, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Text', headerColor: '#FFB300', category: 'UI / Text' },
        inputs: [
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [], 
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'value', label: 'Content', type: 'string', color: '#FFB74D' },
            { value: 'mode', label: 'Mode', type: 'string', color: '#FFB74D' },
            { value: 'assetId', label: 'Font Asset', type: 'string', color: '#FFB74D' },
            { value: 'fontSize', label: 'Font Size', type: 'number', color: '#B2FF59' },
            { value: 'color', label: 'Text Color', type: 'string', color: '#FFB74D' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#B2FF59' },
            { value: 'align', label: 'Align', type: 'string', color: '#FFB74D' },
            { value: 'maxWidth', label: 'Max Width', type: 'number', color: '#B2FF59' },
            { value: 'maxLine', label: 'Max Line', type: 'number', color: '#B2FF59' },
            { value: 'lineSpacing', label: 'Line Spacing', type: 'number', color: '#B2FF59' },
            { value: 'letterSpacing', label: 'Char Spacing', type: 'number', color: '#B2FF59' },
            { value: 'overflow', label: 'Overflow', type: 'string', color: '#FFB74D' },
            { value: 'autoFit', label: 'Auto Fit', type: 'boolean', color: '#f472b6' },
            { value: 'smoothing', label: 'Smoothing', type: 'number', color: '#B2FF59' },
            { value: 'bias', label: 'Font Bias', type: 'number', color: '#B2FF59' },
            { value: 'outlineWidth', label: 'Outline Width', type: 'number', color: '#B2FF59' },
            { value: 'outlineColor', label: 'Outline Color', type: 'string', color: '#FFB74D' },
            { value: 'shadowEnabled', label: 'Shadow Enabled', type: 'boolean', color: '#f472b6' },
            { value: 'shadowColor', label: 'Shadow Color', type: 'string', color: '#FFB74D' },
            { value: 'shadowOpacity', label: 'Shadow Opacity (%)', type: 'number', color: '#B2FF59' },
            { value: 'shadowOffsetX', label: 'Shadow Offset X', type: 'number', color: '#B2FF59' },
            { value: 'shadowOffsetY', label: 'Shadow Offset Y', type: 'number', color: '#B2FF59' },
            { value: 'shadowBlur', label: 'Shadow Blur', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.TextRenderer) {
    const comp = entity.components.TextRenderer;
    outputs['Content'] = comp.value;
    outputs['Mode'] = comp.mode;
    outputs['Font Asset'] = comp.assetId;
    outputs['Font Size'] = comp.fontSize;
    outputs['Text Color'] = comp.color;
    outputs['Opacity (%)'] = Math.round((comp.opacity ?? 1.0) * 100);
    outputs['Align'] = comp.align;
    outputs['Max Width'] = comp.maxWidth;
    outputs['Max Line'] = comp.maxLine;
    outputs['Line Spacing'] = comp.lineSpacing;
    outputs['Char Spacing'] = comp.letterSpacing;
    outputs['Overflow'] = comp.overflow;
    outputs['Auto Fit'] = comp.autoFit;
    outputs['Smoothing'] = comp.smoothing;
    outputs['Font Bias'] = comp.bias;
    outputs['Outline Width'] = comp.outlineWidth;
    outputs['Outline Color'] = comp.outlineColor;
    outputs['Shadow Enabled'] = comp.shadowEnabled;
    outputs['Shadow Color'] = comp.shadowColor;
    outputs['Shadow Opacity (%)'] = Math.round((comp.shadowOpacity ?? 1.0) * 100);
    outputs['Shadow Offset X'] = comp.shadowOffsetX;
    outputs['Shadow Offset Y'] = comp.shadowOffsetY;
    outputs['Shadow Blur'] = comp.shadowBlur;
}
return;`
        }
      } 
    },

    // 4. SET TEXT (Action Node - Dynamic Inputs)
    { 
      type: 'set_text', 
      label: 'Set Text', 
      icon: TypeIcon,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Text', headerColor: '#FFB300', category: 'UI / Text' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'value', label: 'Content', type: 'string', color: '#FFB74D' },
            { value: 'fontSize', label: 'Font Size', type: 'number', color: '#B2FF59' },
            { value: 'color', label: 'Color', type: 'string', color: '#FFB74D' },
            { value: 'align', label: 'Align', type: 'string', color: '#FFB74D' },
            { value: 'assetId', label: 'Font Asset', type: 'string', color: '#FFB74D' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.TextRenderer) {
    const comp = entity.components.TextRenderer;

    const props = {
        'Content': v => { comp.value = String(v); },
        'Font Size': v => { comp.fontSize = Number(v); },
        'Color': v => { comp.color = String(v); },
        'Align': v => { comp.align = String(v); },
        'Font Asset': v => { comp.assetId = String(v); },
        'Opacity (%)': v => { comp.opacity = Number(v) / 100; }
    };

    Object.keys(props).forEach(label => {
        const rawVal = inputs[label];
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            props[label](rawVal);
        }
    });
}

outputs['Out'] = true;
return;`
        }
      } 
    },

    // 5. GET SHAPE (Pure Node - Dynamic Outputs)
    { 
      type: 'get_shape', 
      label: 'Get Shape', 
      icon: Square, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Shape', headerColor: '#E91E63', category: 'Graphics' },
        inputs: [
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [], 
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'type', label: 'Type', type: 'string', color: '#FFB74D' },
            { value: 'color', label: 'Color', type: 'string', color: '#FFB74D' },
            { value: 'width', label: 'Width', type: 'number', color: '#B2FF59' },
            { value: 'height', label: 'Height', type: 'number', color: '#B2FF59' },
            { value: 'thickness', label: 'Line Thickness', type: 'number', color: '#B2FF59' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.ShapeRenderer) {
    const comp = entity.components.ShapeRenderer;
    outputs['Type'] = comp.type;
    outputs['Color'] = comp.color;
    outputs['Width'] = comp.width;
    outputs['Height'] = comp.height;
    outputs['Line Thickness'] = comp.thickness;
    outputs['Opacity'] = comp.opacity;
}
return;`
        }
      } 
    },

    // 6. SET SHAPE (Action Node - Dynamic Inputs)
    { 
      type: 'set_shape', 
      label: 'Set Shape', 
      icon: Square,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Shape', headerColor: '#E91E63', category: 'Graphics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'type', label: 'Type', type: 'string', color: '#FFB74D' },
            { value: 'color', label: 'Color', type: 'string', color: '#FFB74D' },
            { value: 'width', label: 'Width', type: 'number', color: '#B2FF59' },
            { value: 'height', label: 'Height', type: 'number', color: '#B2FF59' },
            { value: 'thickness', label: 'Line Thickness', type: 'number', color: '#B2FF59' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.ShapeRenderer) {
    const comp = entity.components.ShapeRenderer;

    const props = {
        'Type': v => { comp.type = String(v); },
        'Color': v => { comp.color = String(v); },
        'Width': v => { comp.width = Number(v); },
        'Height': v => { comp.height = Number(v); },
        'Line Thickness': v => { comp.thickness = Number(v); },
        'Opacity': v => { comp.opacity = Number(v); }
    };

    Object.keys(props).forEach(label => {
        const rawVal = inputs[label];
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            props[label](rawVal);
        }
    });
}

outputs['Out'] = true;
return;`
        }
      } 
    },

    // 7. GET TILEMAP (Pure Node - Dynamic Outputs)
    { 
      type: 'get_tilemap', 
      label: 'Get Tilemap', 
      icon: Grid3x3, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Tilemap', headerColor: '#689F38', category: 'Graphics' },
        inputs: [
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [], 
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'assetId', label: 'Tileset Asset', type: 'string', color: '#FFB74D' },
            { value: 'width', label: 'Map Width (Grid)', type: 'number', color: '#B2FF59' },
            { value: 'height', label: 'Map Height (Grid)', type: 'number', color: '#B2FF59' },
            { value: 'tileWidth', label: 'Tile Width', type: 'number', color: '#B2FF59' },
            { value: 'tileHeight', label: 'Tile Height', type: 'number', color: '#B2FF59' },
            { value: 'isSolid', label: 'Is Solid', type: 'boolean', color: '#f472b6' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.Tilemap) {
    const comp = entity.components.Tilemap;
    outputs['Tileset Asset'] = comp.assetId;
    outputs['Map Width (Grid)'] = comp.width;
    outputs['Map Height (Grid)'] = comp.height;
    outputs['Tile Width'] = comp.tileWidth;
    outputs['Tile Height'] = comp.tileHeight;
    outputs['Is Solid'] = comp.isSolid;
    outputs['Opacity'] = comp.opacity;
}
return;`
        }
      } 
    },

    // 8. SET TILEMAP (Action Node - Dynamic Inputs)
    { 
      type: 'set_tilemap', 
      label: 'Set Tilemap', 
      icon: Grid3x3,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Tilemap', headerColor: '#689F38', category: 'Graphics' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target: 'self'
          },
          propertyOptions: [
            { value: 'assetId', label: 'Tileset Asset', type: 'string', color: '#FFB74D' },
            { value: 'width', label: 'Map Width (Grid)', type: 'number', color: '#B2FF59' },
            { value: 'height', label: 'Map Height (Grid)', type: 'number', color: '#B2FF59' },
            { value: 'tileWidth', label: 'Tile Width', type: 'number', color: '#B2FF59' },
            { value: 'tileHeight', label: 'Tile Height', type: 'number', color: '#B2FF59' },
            { value: 'isSolid', label: 'Is Solid', type: 'boolean', color: '#f472b6' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#B2FF59' }
          ],
          code: `const targetId = inputs['Target Entity'];
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.Tilemap) {
    const comp = entity.components.Tilemap;

    const props = {
        'Tileset Asset': v => { comp.assetId = String(v); },
        'Map Width (Grid)': v => { comp.width = Number(v); },
        'Map Height (Grid)': v => { comp.height = Number(v); },
        'Tile Width': v => { comp.tileWidth = Number(v); },
        'Tile Height': v => { comp.tileHeight = Number(v); },
        'Is Solid': v => { comp.isSolid = Boolean(v); },
        'Opacity': v => { comp.opacity = Number(v); }
    };

    Object.keys(props).forEach(label => {
        const rawVal = inputs[label];
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            props[label](rawVal);
        }
    });
}

outputs['Out'] = true;
return;`
        }
      } 
    },

    // 9. BATCH SET PROPERTIES (Action Node - Step Driven)
    { 
      type: 'batch_set', 
      label: 'Batch Set Properties', 
      description: 'Set multiple properties in one execution node',
      icon: Layers,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Batch Set', headerColor: '#7E57C2', category: 'Logic' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          steps: [], 
          values: {},
          code: `const steps = node.data?.steps || [];

steps.forEach((step, index) => {
    let targetId = inputs[\`Target \${index + 1}\`] || inputs[\`target_\${index}\`];
    if (!targetId || String(targetId).trim() === '') {
        targetId = 'self';
    }

    const entity = context.entity.get(targetId);
    if (!entity) return;

    const rawVal = inputs[\`Val \${index + 1}\`] || inputs[\`val_\${index}\`];
    if (rawVal !== undefined && rawVal !== null) {
        if (step.component === 'Entity') {
            const rootProps = {
                name: v => String(v),
                tag: v => String(v),
                type: v => String(v),
                zIndex: v => Number(v),
                orderIndex: v => Number(v),
                active: v => Boolean(v),
                visible: v => Boolean(v),
                locked: v => Boolean(v)
            };

            if (rootProps[step.property]) {
                entity[step.property] = rootProps[step.property](rawVal);
            }
        } else if (entity.components && entity.components[step.component]) {
            const comp = entity.components[step.component];
            comp[step.property] = rawVal;
        }
    }
});

outputs['Out'] = true;
return;`
        }
      } 
    }
  ]
};