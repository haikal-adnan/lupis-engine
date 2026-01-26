import { Image as ImageIcon } from 'lucide-vue-next';

export const renderingGroup = {
  id: 'rendering',
  label: 'Rendering',
  color: '#9C27B0',
  icon: ImageIcon,
  items: [
    { 
      type: 'set_sprite', 
      label: 'Set Texture', 
      description: 'Change sprite image', 
      defaultData: { 
        settings: { headerTitle: 'Set Sprite', headerColor: '#7B1FA2', category: 'Rendering' },
        data: { textureName: '' },
        inputs: [
          { _id: 'in', label: 'In', type: 'execution', color: '#fff' },
          { _id: 'tex', label: 'Texture', type: 'string', color: '#E040FB' }
        ],
        outputs: [{ _id: 'out', label: 'Out', type: 'execution', color: '#fff' }]
      } 
    },
    // ... Node rendering lainnya ...
  ]
};