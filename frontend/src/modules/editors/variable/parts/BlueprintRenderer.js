import { 
  Image as ImageIcon,
  Type as TypeIcon,
  Square,
  Grid3x3
} from 'lucide-vue-next';

export const BlueprintRenderer = {
  _id: 'game_renderer',
  label: 'Renderer',
  color: '#00ACC1',
  icon: ImageIcon,
  items: [
    { 
      type: 'get_sprite', 
      label: 'Get Sprite', 
      description: 'Get properties of the Image Renderer', 
      icon: ImageIcon, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Sprite', headerColor: '#00ACC1', category: 'Graphics' },
        data: {
          propertyOptions: [
            { value: 'assetId', label: 'Asset ID', type: 'string', color: '#FFF' },
            { value: 'color', label: 'Tint Color', type: 'string', color: '#E91E63' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#00BCD4' },
            { value: 'sourceX', label: 'Source X', type: 'number', color: '#00BCD4' },
            { value: 'sourceY', label: 'Source Y', type: 'number', color: '#00BCD4' },
            { value: 'sourceWidth', label: 'Source Width', type: 'number', color: '#00BCD4' },
            { value: 'sourceHeight', label: 'Source Height', type: 'number', color: '#00BCD4' }
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_sprite', 
      label: 'Set Sprite', 
      icon: ImageIcon,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Sprite', headerColor: '#00ACC1', category: 'Graphics' },
        data: {
          propertyOptions: [
            { value: 'assetId', label: 'Asset ID', type: 'string', color: '#FFF' },
            { value: 'color', label: 'Tint Color', type: 'string', color: '#E91E63' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#00BCD4' },
            { value: 'sourceX', label: 'Source X', type: 'number', color: '#00BCD4' },
            { value: 'sourceY', label: 'Source Y', type: 'number', color: '#00BCD4' },
            { value: 'sourceWidth', label: 'Source Width', type: 'number', color: '#00BCD4' },
            { value: 'sourceHeight', label: 'Source Height', type: 'number', color: '#00BCD4' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    },
    { 
      type: 'get_text', 
      label: 'Get Text', 
      icon: TypeIcon, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Text', headerColor: '#FFB300', category: 'UI / Text' },
        data: {
          propertyOptions: [
            { value: 'value', label: 'Content', type: 'string', color: '#FFF' },
            { value: 'fontSize', label: 'Font Size', type: 'number', color: '#FFC107' },
            { value: 'color', label: 'Color', type: 'string', color: '#FFC107' },
            { value: 'align', label: 'Align', type: 'string', color: '#FFC107' },
            { value: 'assetId', label: 'Font Asset', type: 'string', color: '#FFF' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#FFC107' }
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_text', 
      label: 'Set Text', 
      icon: TypeIcon,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Text', headerColor: '#FFB300', category: 'UI / Text' },
        data: {
          propertyOptions: [
            { value: 'value', label: 'Content', type: 'string', color: '#FFF' },
            { value: 'fontSize', label: 'Font Size', type: 'number', color: '#FFC107' },
            { value: 'color', label: 'Color', type: 'string', color: '#FFC107' },
            { value: 'align', label: 'Align', type: 'string', color: '#FFC107' },
            { value: 'assetId', label: 'Font Asset', type: 'string', color: '#FFF' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#FFC107' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    },
    { 
      type: 'get_shape', 
      label: 'Get Shape', 
      icon: Square, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Shape', headerColor: '#E91E63', category: 'Graphics' },
        data: {
          propertyOptions: [
            { value: 'type', label: 'Type', type: 'string', color: '#FFF' },
            { value: 'color', label: 'Color', type: 'string', color: '#F06292' },
            { value: 'width', label: 'Width', type: 'number', color: '#F06292' },
            { value: 'height', label: 'Height', type: 'number', color: '#F06292' },
            { value: 'thickness', label: 'Line Thickness', type: 'number', color: '#F06292' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#F06292' }
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_shape', 
      label: 'Set Shape', 
      icon: Square,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Shape', headerColor: '#E91E63', category: 'Graphics' },
        data: {
          propertyOptions: [
            { value: 'type', label: 'Type', type: 'string', color: '#FFF' },
            { value: 'color', label: 'Color', type: 'string', color: '#F06292' },
            { value: 'width', label: 'Width', type: 'number', color: '#F06292' },
            { value: 'height', label: 'Height', type: 'number', color: '#F06292' },
            { value: 'thickness', label: 'Line Thickness', type: 'number', color: '#F06292' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#F06292' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    },
    { 
      type: 'get_tilemap', 
      label: 'Get Tilemap', 
      icon: Grid3x3, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Tilemap', headerColor: '#689F38', category: 'Graphics' },
        data: {
          propertyOptions: [
            { value: 'assetId', label: 'Tileset Asset', type: 'string', color: '#FFF' },
            { value: 'width', label: 'Map Width (Grid)', type: 'number', color: '#AED581' },
            { value: 'height', label: 'Map Height (Grid)', type: 'number', color: '#AED581' },
            { value: 'tileWidth', label: 'Tile Width', type: 'number', color: '#AED581' },
            { value: 'tileHeight', label: 'Tile Height', type: 'number', color: '#AED581' },
            { value: 'isSolid', label: 'Is Solid', type: 'boolean', color: '#AED581' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#AED581' }
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_tilemap', 
      label: 'Set Tilemap', 
      icon: Grid3x3,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Tilemap', headerColor: '#689F38', category: 'Graphics' },
        data: {
          propertyOptions: [
            { value: 'assetId', label: 'Tileset Asset', type: 'string', color: '#FFF' },
            { value: 'width', label: 'Map Width (Grid)', type: 'number', color: '#AED581' },
            { value: 'height', label: 'Map Height (Grid)', type: 'number', color: '#AED581' },
            { value: 'tileWidth', label: 'Tile Width', type: 'number', color: '#AED581' },
            { value: 'tileHeight', label: 'Tile Height', type: 'number', color: '#AED581' },
            { value: 'isSolid', label: 'Is Solid', type: 'boolean', color: '#AED581' },
            { value: 'opacity', label: 'Opacity', type: 'number', color: '#AED581' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    }
  ]
};
