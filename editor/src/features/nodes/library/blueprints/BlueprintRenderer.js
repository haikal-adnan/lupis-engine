import { Image as ImageIcon } from 'lucide-vue-next';

export const BlueprintRenderer = {
  id: 'game_renderer',
  label: 'Renderer',
  color: '#00ACC1',
  icon: ImageIcon,
  items: [
    {
      type: 'get_sprite',
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
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.SpriteRenderer) {
  const comp = entity.components.SpriteRenderer;
  const assetIdVal = comp.assetId ?? '';
  const colorVal = comp.color ?? '#FFFFFF';
  const opacityVal = comp.opacity ?? 1.0;
  const sX = comp.sourceX ?? 0;
  const sY = comp.sourceY ?? 0;
  const sW = comp.sourceWidth ?? 0;
  const sH = comp.sourceHeight ?? 0;

  outputs['Asset ID'] = assetIdVal;
  outputs['assetId'] = assetIdVal;
  outputs['Tint Color'] = colorVal;
  outputs['color'] = colorVal;
  outputs['Opacity'] = opacityVal;
  outputs['opacity'] = opacityVal;
  outputs['Source X'] = sX;
  outputs['sourceX'] = sX;
  outputs['Source Y'] = sY;
  outputs['sourceY'] = sY;
  outputs['Source Width'] = sW;
  outputs['sourceWidth'] = sW;
  outputs['Source Height'] = sH;
  outputs['sourceHeight'] = sH;
}
return;`
        }
      }
    },
    {
      type: 'set_sprite',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.SpriteRenderer) {
  const comp = entity.components.SpriteRenderer;

  const assetId = inputs['Asset ID'] ?? inputs['assetId'];
  const color = inputs['Tint Color'] ?? inputs['color'];
  const opacity = inputs['Opacity'] ?? inputs['opacity'];
  const sourceX = inputs['Source X'] ?? inputs['sourceX'];
  const sourceY = inputs['Source Y'] ?? inputs['sourceY'];
  const sourceWidth = inputs['Source Width'] ?? inputs['sourceWidth'];
  const sourceHeight = inputs['Source Height'] ?? inputs['sourceHeight'];

  if (assetId !== undefined && assetId !== null) comp.assetId = String(assetId);
  if (color !== undefined && color !== null) comp.color = String(color);
  if (opacity !== undefined && opacity !== null && opacity !== '') comp.opacity = Number(opacity);
  if (sourceX !== undefined && sourceX !== null && sourceX !== '') comp.sourceX = Number(sourceX);
  if (sourceY !== undefined && sourceY !== null && sourceY !== '') comp.sourceY = Number(sourceY);
  if (sourceWidth !== undefined && sourceWidth !== null && sourceWidth !== '') comp.sourceWidth = Number(sourceWidth);
  if (sourceHeight !== undefined && sourceHeight !== null && sourceHeight !== '') comp.sourceHeight = Number(sourceHeight);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'get_text',
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
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.TextRenderer) {
  const comp = entity.components.TextRenderer;
  const contentVal = comp.value ?? '';
  const modeVal = comp.mode ?? '';
  const assetIdVal = comp.assetId ?? '';
  const fontSizeVal = comp.fontSize ?? 16;
  const textColorVal = comp.color ?? '#FFFFFF';
  const opacityVal = Math.round((comp.opacity ?? 1.0) * 100);
  const alignVal = comp.align ?? 'left';
  const maxWidthVal = comp.maxWidth ?? 0;
  const maxLineVal = comp.maxLine ?? 0;
  const lineSpacingVal = comp.lineSpacing ?? 0;
  const charSpacingVal = comp.letterSpacing ?? 0;
  const overflowVal = comp.overflow ?? '';
  const autoFitVal = Boolean(comp.autoFit);
  const smoothingVal = comp.smoothing ?? 0;
  const biasVal = comp.bias ?? 0;
  const outlineWidthVal = comp.outlineWidth ?? 0;
  const outlineColorVal = comp.outlineColor ?? '#000000';
  const shadowEnabledVal = Boolean(comp.shadowEnabled);
  const shadowColorVal = comp.shadowColor ?? '#000000';
  const shadowOpacityVal = Math.round((comp.shadowOpacity ?? 1.0) * 100);
  const shadowOffsetXVal = comp.shadowOffsetX ?? 0;
  const shadowOffsetYVal = comp.shadowOffsetY ?? 0;
  const shadowBlurVal = comp.shadowBlur ?? 0;

  outputs['Content'] = contentVal;
  outputs['value'] = contentVal;
  outputs['Mode'] = modeVal;
  outputs['mode'] = modeVal;
  outputs['Font Asset'] = assetIdVal;
  outputs['assetId'] = assetIdVal;
  outputs['Font Size'] = fontSizeVal;
  outputs['fontSize'] = fontSizeVal;
  outputs['Text Color'] = textColorVal;
  outputs['color'] = textColorVal;
  outputs['Opacity (%)'] = opacityVal;
  outputs['opacity'] = opacityVal;
  outputs['Align'] = alignVal;
  outputs['align'] = alignVal;
  outputs['Max Width'] = maxWidthVal;
  outputs['maxWidth'] = maxWidthVal;
  outputs['Max Line'] = maxLineVal;
  outputs['maxLine'] = maxLineVal;
  outputs['Line Spacing'] = lineSpacingVal;
  outputs['lineSpacing'] = lineSpacingVal;
  outputs['Char Spacing'] = charSpacingVal;
  outputs['letterSpacing'] = charSpacingVal;
  outputs['Overflow'] = overflowVal;
  outputs['overflow'] = overflowVal;
  outputs['Auto Fit'] = autoFitVal;
  outputs['autoFit'] = autoFitVal;
  outputs['Smoothing'] = smoothingVal;
  outputs['smoothing'] = smoothingVal;
  outputs['Font Bias'] = biasVal;
  outputs['bias'] = biasVal;
  outputs['Outline Width'] = outlineWidthVal;
  outputs['outlineWidth'] = outlineWidthVal;
  outputs['Outline Color'] = outlineColorVal;
  outputs['outlineColor'] = outlineColorVal;
  outputs['Shadow Enabled'] = shadowEnabledVal;
  outputs['shadowEnabled'] = shadowEnabledVal;
  outputs['Shadow Color'] = shadowColorVal;
  outputs['shadowColor'] = shadowColorVal;
  outputs['Shadow Opacity (%)'] = shadowOpacityVal;
  outputs['shadowOpacity'] = shadowOpacityVal;
  outputs['Shadow Offset X'] = shadowOffsetXVal;
  outputs['shadowOffsetX'] = shadowOffsetXVal;
  outputs['Shadow Offset Y'] = shadowOffsetYVal;
  outputs['shadowOffsetY'] = shadowOffsetYVal;
  outputs['Shadow Blur'] = shadowBlurVal;
  outputs['shadowBlur'] = shadowBlurVal;
}
return;`
        }
      }
    },
    {
      type: 'set_text',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.TextRenderer) {
  const comp = entity.components.TextRenderer;

  const content = inputs['Content'] ?? inputs['value'];
  const fontSize = inputs['Font Size'] ?? inputs['fontSize'];
  const color = inputs['Color'] ?? inputs['color'];
  const align = inputs['Align'] ?? inputs['align'];
  const assetId = inputs['Font Asset'] ?? inputs['assetId'];
  const opacity = inputs['Opacity (%)'] ?? inputs['opacity'];

  if (content !== undefined && content !== null) comp.value = String(content);
  if (fontSize !== undefined && fontSize !== null && fontSize !== '') comp.fontSize = Number(fontSize);
  if (color !== undefined && color !== null) comp.color = String(color);
  if (align !== undefined && align !== null) comp.align = String(align);
  if (assetId !== undefined && assetId !== null) comp.assetId = String(assetId);
  if (opacity !== undefined && opacity !== null && opacity !== '') comp.opacity = Number(opacity) / 100;
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'get_shape',
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
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.ShapeRenderer) {
  const comp = entity.components.ShapeRenderer;
  const typeVal = comp.type ?? 'rect';
  const colorVal = comp.color ?? '#FFFFFF';
  const widthVal = comp.width ?? 0;
  const heightVal = comp.height ?? 0;
  const thicknessVal = comp.thickness ?? 1;
  const opacityVal = comp.opacity ?? 1.0;

  outputs['Type'] = typeVal;
  outputs['type'] = typeVal;
  outputs['Color'] = colorVal;
  outputs['color'] = colorVal;
  outputs['Width'] = widthVal;
  outputs['width'] = widthVal;
  outputs['Height'] = heightVal;
  outputs['height'] = heightVal;
  outputs['Line Thickness'] = thicknessVal;
  outputs['thickness'] = thicknessVal;
  outputs['Opacity'] = opacityVal;
  outputs['opacity'] = opacityVal;
}
return;`
        }
      }
    },
    {
      type: 'set_shape',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.ShapeRenderer) {
  const comp = entity.components.ShapeRenderer;

  const shapeType = inputs['Type'] ?? inputs['type'];
  const color = inputs['Color'] ?? inputs['color'];
  const width = inputs['Width'] ?? inputs['width'];
  const height = inputs['Height'] ?? inputs['height'];
  const thickness = inputs['Line Thickness'] ?? inputs['thickness'];
  const opacity = inputs['Opacity'] ?? inputs['opacity'];

  if (shapeType !== undefined && shapeType !== null) comp.type = String(shapeType);
  if (color !== undefined && color !== null) comp.color = String(color);
  if (width !== undefined && width !== null && width !== '') comp.width = Number(width);
  if (height !== undefined && height !== null && height !== '') comp.height = Number(height);
  if (thickness !== undefined && thickness !== null && thickness !== '') comp.thickness = Number(thickness);
  if (opacity !== undefined && opacity !== null && opacity !== '') comp.opacity = Number(opacity);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'get_tilemap',
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
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.Tilemap) {
  const comp = entity.components.Tilemap;
  const assetIdVal = comp.assetId ?? '';
  const widthVal = comp.width ?? 0;
  const heightVal = comp.height ?? 0;
  const tileWidthVal = comp.tileWidth ?? 0;
  const tileHeightVal = comp.tileHeight ?? 0;
  const isSolidVal = Boolean(comp.isSolid);
  const opacityVal = comp.opacity ?? 1.0;

  outputs['Tileset Asset'] = assetIdVal;
  outputs['assetId'] = assetIdVal;
  outputs['Map Width (Grid)'] = widthVal;
  outputs['width'] = widthVal;
  outputs['Map Height (Grid)'] = heightVal;
  outputs['height'] = heightVal;
  outputs['Tile Width'] = tileWidthVal;
  outputs['tileWidth'] = tileWidthVal;
  outputs['Tile Height'] = tileHeightVal;
  outputs['tileHeight'] = tileHeightVal;
  outputs['Is Solid'] = isSolidVal;
  outputs['isSolid'] = isSolidVal;
  outputs['Opacity'] = opacityVal;
  outputs['opacity'] = opacityVal;
}
return;`
        }
      }
    },
    {
      type: 'set_tilemap',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target', label: 'Target Entity', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target: 'self'
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
`const targetId = inputs['Target Entity'] ?? inputs['target'] ?? 'self';
const entity = context.entity.get(targetId);

if (entity && entity.components && entity.components.Tilemap) {
  const comp = entity.components.Tilemap;

  const assetId = inputs['Tileset Asset'] ?? inputs['assetId'];
  const width = inputs['Map Width (Grid)'] ?? inputs['width'];
  const height = inputs['Map Height (Grid)'] ?? inputs['height'];
  const tileWidth = inputs['Tile Width'] ?? inputs['tileWidth'];
  const tileHeight = inputs['Tile Height'] ?? inputs['tileHeight'];
  const isSolid = inputs['Is Solid'] ?? inputs['isSolid'];
  const opacity = inputs['Opacity'] ?? inputs['opacity'];

  if (assetId !== undefined && assetId !== null) comp.assetId = String(assetId);
  if (width !== undefined && width !== null && width !== '') comp.width = Number(width);
  if (height !== undefined && height !== null && height !== '') comp.height = Number(height);
  if (tileWidth !== undefined && tileWidth !== null && tileWidth !== '') comp.tileWidth = Number(tileWidth);
  if (tileHeight !== undefined && tileHeight !== null && tileHeight !== '') comp.tileHeight = Number(tileHeight);
  if (isSolid !== undefined && isSolid !== null) comp.isSolid = Boolean(isSolid);
  if (opacity !== undefined && opacity !== null && opacity !== '') comp.opacity = Number(opacity);
}

outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'batch_set',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          steps: [],
          values: {},
          code: 
`const steps = node.data?.steps || [];

steps.forEach((step, index) => {
  let targetId = inputs[\`Target \${index + 1}\`] ?? inputs[\`target_\${index}\`];
  if (!targetId || String(targetId).trim() === '') {
    targetId = 'self';
  }

  const entity = context.entity.get(targetId);
  if (!entity) return;

  const rawVal = inputs[\`Val \${index + 1}\`] ?? inputs[\`val_\${index}\`];
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
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};